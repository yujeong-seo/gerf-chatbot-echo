"""LangChain ReAct agent for GERF 2026 event recommendations.

Uses langchain_classic.create_react_agent for an explicit
Thought → Action → Observation reasoning chain.

Discovery routing:
  Theme / mood / interest queries → search_events tool  (Python LIKE, always returns results)
  Logistics / general festival info → gerf_faq tool

Structured SQL tools are removed; search_events handles all discovery internally
and is far more reliable than letting the model write ad-hoc SQL.
"""
import json
import sqlite3
from pathlib import Path
from typing import Optional, Union

from dotenv import load_dotenv
from langchain_classic.agents import create_react_agent, AgentExecutor
from langchain_classic.agents.output_parsers import ReActSingleInputOutputParser
from langchain_core.agents import AgentAction, AgentFinish
from langchain_core.exceptions import OutputParserException
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

from .tools         import build_faq_tool
from .datetime_tool import current_datetime_tool
from .calendar_tool import create_calendar_event
from .location_tool import maps_url_tool, event_url_tool, get_event_by_id
from .interests     import (
    get_user_interests_tool,
    build_interests_context,
    load_history,
    format_history_context,
    save_message,
)
from .search_tool import search_events

load_dotenv()

_ROOT        = Path(__file__).parent.parent.parent
_RAG_DIR     = _ROOT / "rag"
_SQL_FILE    = _RAG_DIR / "gerf_2026.sql"
_DB_FILE     = _RAG_DIR / "gerf_2026.db"
_PROMPT_FILE = Path(__file__).parent / "agent.prompt"


# ---------------------------------------------------------------------------
# DB initialisation
# ---------------------------------------------------------------------------

def _init_db() -> None:
    if _DB_FILE.exists():
        return
    conn = sqlite3.connect(str(_DB_FILE))
    conn.executescript(_SQL_FILE.read_text())
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# ReAct output parser
# ---------------------------------------------------------------------------

class _FlexibleReActParser(ReActSingleInputOutputParser):
    """Accepts bare JSON output as a Final Answer when the model omits the prefix."""

    def parse(self, text: str) -> Union[AgentAction, AgentFinish]:
        try:
            return super().parse(text)
        except OutputParserException:
            stripped = text.strip()
            if stripped.startswith("{") and stripped.endswith("}"):
                return AgentFinish(return_values={"output": stripped}, log=text)
            raise


# ---------------------------------------------------------------------------
# ReAct prompt suffix (appended to agent.prompt content)
# ---------------------------------------------------------------------------

_REACT_SUFFIX = """\


== TOOLS ==
{tools}

== REASONING FORMAT ==

Use this format exactly for every reply:

Question: the input question you must answer
Thought: decide whether you need a tool or can answer directly
Action: one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
(Repeat Thought / Action / Action Input / Observation as needed)
Thought: I now know the final answer
Final Answer: {{"response": "your message", "keywords": ["kw1"]}}
(When recommending specific events, also include: "mentioned_events": [{{"n": 1, "id": "event-id-slug"}}, ...])
(When the response is a broad discovery or recommendation — i.e. you called search_events for general browsing — also include: "suggest_interests": true)

Rules:
- If no tool is needed, go directly from Thought to Final Answer — omit Action/Action Input.
- Final Answer must be a single valid JSON object on one line (no embedded newlines).
- Represent bullet points in the response value as \\n- (escaped newline followed by hyphen).
- After the final bullet, separate any follow-up sentence with \\n\\n (two newlines = blank line).
- Never output anything after Final Answer.
- Use event titles exactly as they appear in tool results. Synthesise descriptions naturally from the provided detail — do not copy field values verbatim.
- If events or titles already appear in [Conversation so far:], do not recommend them again unless the user explicitly asks.
- Only answer from tool observations. If the tools did not return the information being asked about, do not supplement from model training knowledge. Acknowledge the gap using the A/B/C patterns in the system prompt.

Begin!

Question: {input}
Thought:{agent_scratchpad}"""


# ---------------------------------------------------------------------------
# Agent construction
# ---------------------------------------------------------------------------

def _build_agent():
    _init_db()

    # Read the persona/rules file and escape literal braces so PromptTemplate
    # does not treat them as format variables.
    raw_system = _PROMPT_FILE.read_text()
    system_escaped = raw_system.replace("{", "{{").replace("}", "}}")

    prompt = PromptTemplate(
        input_variables=["input", "agent_scratchpad", "tools", "tool_names"],
        template=system_escaped + _REACT_SUFFIX,
    )

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    all_tools = [
        search_events,
        build_faq_tool(),
        current_datetime_tool,
        create_calendar_event,
        maps_url_tool,
        event_url_tool,
        get_event_by_id,
        get_user_interests_tool,
    ]

    agent = create_react_agent(
        llm=llm,
        tools=all_tools,
        prompt=prompt,
        output_parser=_FlexibleReActParser(),
    )

    return AgentExecutor(
        agent=agent,
        tools=all_tools,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=8,
    )


_agent = None


def get_agent():
    global _agent
    if _agent is None:
        _agent = _build_agent()
    return _agent


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def run_agent(
    query:              str,
    thread_id:          str            = "",
    username:           str            = "",
    interests_prompted: bool           = False,
    _chat_history:      Optional[list] = None,
) -> tuple[str, list[dict]]:
    """Run a user query and return (raw_output_json, tool_calls).

    Context injected before the query (in order):
      1. [User interests: ...]  — from saved preferences
      2. [Conversation so far:] — last 4 turns from SQLite history
      3. The user's new message

    tool_calls is a list of {"tool": name, "input": input_str} dicts,
    one entry per tool invocation within this turn.
    """
    parts: list[str] = []

    if username:
        parts.append(f"[Visitor name: {username}]\n")

    if interests_prompted:
        parts.append("[Interests already prompted]\n")

    if thread_id:
        interests_ctx = build_interests_context(thread_id)
        if interests_ctx:
            parts.append(interests_ctx)

        history = load_history(thread_id)
        history_ctx = format_history_context(history)
        if history_ctx:
            parts.append(history_ctx)

    parts.append(query)
    enriched = "".join(parts)

    if thread_id:
        save_message(thread_id, "user", query)

    result = get_agent().invoke({"input": enriched})
    output = result["output"]

    tool_calls = [
        {"tool": action.tool, "input": str(action.tool_input)}
        for action, _obs in result.get("intermediate_steps", [])
    ]

    if thread_id:
        try:
            parsed = json.loads(output)
            response_text = parsed.get("response", output)
            mentioned = parsed.get("mentioned_events", [])
        except (json.JSONDecodeError, AttributeError):
            response_text = output
            mentioned = []

        # Prepend compact event-ID annotation so the next turn can resolve references
        if mentioned:
            pairs = ", ".join(
                f"{m['n']}={m['id']}"
                for m in mentioned
                if isinstance(m, dict) and "n" in m and "id" in m
            )
            history_text = f"[event_ids: {pairs}] {response_text}"
        else:
            history_text = response_text

        save_message(thread_id, "assistant", history_text)

    return output, tool_calls

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
import os
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
# Routing feature flag
# ---------------------------------------------------------------------------

ROUTING_ENABLED = os.getenv("ROUTING_ENABLED", "false").lower() == "true"


# ---------------------------------------------------------------------------
# Action-only agent (calendar / maps / booking — no search or FAQ tools)
# ---------------------------------------------------------------------------

def _build_action_agent():
    _init_db()
    raw_system   = _PROMPT_FILE.read_text()
    system_esc   = raw_system.replace("{", "{{").replace("}", "}}")
    prompt       = PromptTemplate(
        input_variables=["input", "agent_scratchpad", "tools", "tool_names"],
        template=system_esc + _REACT_SUFFIX,
    )
    llm          = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    action_tools = [
        create_calendar_event,
        maps_url_tool,
        event_url_tool,
        get_event_by_id,
    ]
    agent = create_react_agent(
        llm=llm,
        tools=action_tools,
        prompt=prompt,
        output_parser=_FlexibleReActParser(),
    )
    return AgentExecutor(
        agent=agent,
        tools=action_tools,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=5,
    )


_action_agent = None


def _get_action_agent():
    global _action_agent
    if _action_agent is None:
        _action_agent = _build_action_agent()
    return _action_agent


# ---------------------------------------------------------------------------
# Onboarding chain — direct LLM call, no tools, no ReAct loop
# ---------------------------------------------------------------------------

def _run_onboarding_chain(enriched: str) -> str:
    from langchain_core.messages import SystemMessage, HumanMessage
    llm    = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    result = llm.invoke([
        SystemMessage(content=_PROMPT_FILE.read_text()),
        HumanMessage(content=enriched),
    ])
    return result.content.strip()


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

    _has_history = False
    if thread_id:
        interests_ctx = build_interests_context(thread_id)
        if interests_ctx:
            parts.append(interests_ctx)

        _history     = load_history(thread_id)
        _has_history = bool(_history)
        history_ctx  = format_history_context(_history)
        if history_ctx:
            parts.append(history_ctx)

    parts.append(query)
    enriched = "".join(parts)

    if thread_id:
        save_message(thread_id, "user", query)

    if ROUTING_ENABLED:
        from .router import classify_intent, Intent as _Intent
        _intent = classify_intent(query, has_history=_has_history).intent
        if _intent == _Intent.ONBOARDING:
            output     = _run_onboarding_chain(enriched)
            tool_calls = []
        elif _intent == _Intent.ACTION:
            _res       = _get_action_agent().invoke({"input": enriched})
            output     = _res["output"]
            tool_calls = [
                {"tool": a.tool, "input": str(a.tool_input), "output": str(obs)}
                for a, obs in _res.get("intermediate_steps", [])
            ]
        else:  # DISCOVERY — handles event search, FAQ, logistics, and any slipthrough
            _res       = get_agent().invoke({"input": enriched})
            output     = _res["output"]
            tool_calls = [
                {"tool": a.tool, "input": str(a.tool_input), "output": str(obs)}
                for a, obs in _res.get("intermediate_steps", [])
            ]
    else:
        result     = get_agent().invoke({"input": enriched})
        output     = result["output"]
        tool_calls = [
            {"tool": action.tool, "input": str(action.tool_input), "output": str(obs)}
            for action, obs in result.get("intermediate_steps", [])
        ]

    if thread_id:
        try:
            parsed = json.loads(output)
            response_text = parsed.get("response", output)
            mentioned = parsed.get("mentioned_events", [])
        except (json.JSONDecodeError, AttributeError):
            response_text = output
            mentioned = []

        # Fallback: if agent omitted mentioned_events, reconstruct from tool observations.
        # get_event_by_id input IS the slug; search_events output contains "event_id: slug" lines.
        if not mentioned:
            import re as _re
            seen: list[str] = []
            for tc in tool_calls:
                if tc["tool"] == "get_event_by_id":
                    slug = tc["input"].strip().strip("\"'")
                    if slug and slug not in seen:
                        seen.append(slug)
                elif tc["tool"] == "search_events":
                    for m in _re.finditer(r"event_id:\s*(\S+)", tc.get("output", "")):
                        slug = m.group(1).strip()
                        if slug and slug not in seen:
                            seen.append(slug)
            if seen:
                mentioned = [{"n": i + 1, "id": slug} for i, slug in enumerate(seen)]

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

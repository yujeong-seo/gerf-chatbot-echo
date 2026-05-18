"""Post-session structured extraction and cross-session aggregation.

extract_session_insights: LLM call that parses a conversation into the three
  structured outputs defined in the data architecture (session profile,
  event interactions, feedback entries).

extract_keywords / aggregate_insights: operate on saved event_interactions
  records fetched from Supabase — used by reporting / admin endpoints.
"""
import json
from collections import Counter

from langchain_openai import ChatOpenAI


_EXTRACTION_PROMPT = """\
You are an analytics parser for a conversational festival chatbot.
Analyse the conversation below and extract structured data.

Return ONLY valid JSON with this exact structure:
{{
  "session_profile": {{
    "profile_type": "anonymous",
    "interest_tags": ["<tag>", ...],
    "chat_topics": ["<topic>", ...],
    "engagement_preferences": {{
      "audience_type": "<family|adult|student|general|unknown>",
      "content_type": "<workshop|exhibition|talk|performance|outdoor|unknown>"
    }},
    "interaction_depth": "<overview|detailed>"
  }},
  "interactions": [
    {{
      "interaction_summary": "<short phrase, 3-7 words describing what was discussed, e.g. 'Robotics demo and engineering hands-on', 'Music and family stage performance', 'Interactive science for children'>",
      "interaction_stage": "<pre|on|post>",
      "event_zone": "<zone name or null>",
      "event_or_activity": "<activity name or null>",
      "sentiment": {{
        "overall": "<positive|negative|confused|neutral>",
        "tone": "<brief description>"
      }},
      "engagement_level": "<high|moderate|low_to_moderate|low>",
      "engagement_behaviour": "<brief description>",
      "audience_type": "<family|adult|student|general|unknown>",
      "content_type": "<workshop|exhibition|talk|performance|outdoor|unknown>",
      "context_tags": ["<tag>", ...]
    }}
  ],
  "feedback_entries": [
    {{
      "feedback_topic": "<topic>",
      "feedback_stage": "natural",
      "interaction_stage": "<pre|on|post>",
      "sentiment": {{
        "overall": "<positive|negative|confused|neutral>",
        "tone": "<brief description>"
      }},
      "feedback_text": "<direct quote or close paraphrase>",
      "tags": ["<tag>", ...]
    }}
  ]
}}

Rules:
- interactions: one entry per distinct topic/event discussed (0 to 5 entries maximum)
- feedback_entries: only include if the user expressed clear opinions or reflections (0 to 3 entries)
- feedback_entries feedback_stage must always be "natural" (post-session organic capture)
- feedback_entries interaction_stage: "pre" | "on" | "post" based on when in the visit the conversation occurred
- If no clear event zone or activity is mentioned, use null
- interaction_stage in interactions defaults to "on" unless the conversation clearly indicates pre or post
- Use only data present in the conversation — do not invent details

Conversation:
{conversation}
"""


def _format_conversation(messages: list[dict]) -> str:
    lines = []
    for m in messages:
        role = "User" if m["role"] == "user" else "ECHO"
        lines.append(f"{role}: {m['content']}")
    return "\n".join(lines)


def extract_session_insights(thread_id: str, messages: list[dict]) -> dict:
    """LLM-based structured extraction from a session's conversation history.

    Returns the parsed dict with keys: session_profile, interactions, feedback_entries.
    Raises ValueError if the LLM returns unparseable JSON.
    """
    conversation = _format_conversation(messages)
    prompt = _EXTRACTION_PROMPT.format(conversation=conversation)

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    response = llm.invoke(prompt)

    content = response.content.strip()
    if content.startswith("```"):
        # Strip opening fence (```json or ```)
        content = content.split("\n", 1)[-1]
        # Strip closing fence
        if content.endswith("```"):
            content = content.rsplit("```", 1)[0]
        content = content.strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON for session {thread_id}: {e}")


def extract_keywords(interactions: list[dict]) -> list[dict]:
    """Return ranked keywords from context_tags across interaction records.

    Input: list of event_interactions rows (fetched from Supabase).
    Output: [{"text": "...", "weight": n}, ...] ordered by frequency.
    """
    all_tags: list[str] = []
    for ia in interactions:
        all_tags.extend(ia.get("context_tags") or [])
    counts = Counter(all_tags)
    return [{"text": tag, "weight": count} for tag, count in counts.most_common(20)]


def aggregate_insights(interactions: list[dict]) -> list[dict]:
    """Count conversation mentions per activity/event across interaction records.

    Input: list of event_interactions rows (fetched from Supabase).
    Output: [{"text": "...", "count": n}, ...] ordered by frequency.
    """
    activities = [
        ia.get("event_or_activity")
        for ia in interactions
        if ia.get("event_or_activity")
    ]
    counts = Counter(activities)
    return [{"text": activity, "count": count} for activity, count in counts.most_common()]

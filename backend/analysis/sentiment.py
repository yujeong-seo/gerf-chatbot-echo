"""Sentiment scoring for conversation messages.

score_message: keyword-based, no external deps, suitable for short chatbot turns.
score_session: aggregates message scores; qualitative label used in Supabase writes.
"""

_POSITIVE = frozenset([
    "great", "love", "amazing", "interesting", "excited", "helpful", "good",
    "wonderful", "fantastic", "brilliant", "perfect", "excellent", "enjoy",
    "enjoyed", "fun", "useful", "clear", "thanks", "thank", "awesome",
])
_NEGATIVE = frozenset([
    "bad", "boring", "confusing", "confused", "hate", "awful", "terrible",
    "poor", "wrong", "unclear", "unhelpful", "frustrating", "frustrated",
    "useless", "disappointed", "disappoint", "hard", "difficult",
])


def score_message(text: str) -> float:
    """Return a sentiment score in [-1, 1] for a single message."""
    words = set(text.lower().split())
    pos = len(words & _POSITIVE)
    neg = len(words & _NEGATIVE)
    total = pos + neg
    if total == 0:
        return 0.0
    return round((pos - neg) / total, 3)


def score_session(messages: list[str]) -> dict:
    """Aggregate sentiment across all user messages in a session.

    Returns: {"score": float, "overall": str, "message_count": int}
    """
    if not messages:
        return {"score": 0.0, "overall": "neutral", "message_count": 0}
    scores = [score_message(m) for m in messages]
    avg = sum(scores) / len(scores)
    if avg > 0.1:
        overall = "positive"
    elif avg < -0.1:
        overall = "negative"
    else:
        overall = "neutral"
    return {"score": round(avg, 3), "overall": overall, "message_count": len(scores)}

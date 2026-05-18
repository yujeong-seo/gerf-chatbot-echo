"""Write consented CRM registrations to Airtable.

Env vars required:
  AIRTABLE_API_KEY    — personal access token from airtable.com/create/tokens
  AIRTABLE_BASE_ID    — base ID from the Airtable URL (starts with "app")
  AIRTABLE_TABLE_NAME — name of the CRM table (e.g. "CRM Registrations")
"""
import os

from pyairtable import Api


def _get_table():
    api = Api(os.environ["AIRTABLE_API_KEY"])
    return api.table(
        os.environ["AIRTABLE_BASE_ID"],
        os.environ["AIRTABLE_TABLE_NAME"],
    )


def write_crm_registration(record: dict) -> None:
    """Push a consented CRM record to Airtable.

    Required keys: name, email, consent_given (bool), consent_timestamp (ISO str)
    Optional keys: interest_tags (list[str]), preferred_topics (list[str])

    Raises ValueError if consent_given is not True.
    """
    if not record.get("consent_given"):
        raise ValueError("Cannot write CRM record without consent.")

    tags   = record.get("interest_tags", [])
    topics = record.get("preferred_topics", [])

    _get_table().create({
        "Name":              record["name"],
        "Email":             record["email"],
        "Consent Given":     True,
        "Consent Timestamp": record["consent_timestamp"],
        "Interest Tags":     ", ".join(tags)   if tags   else "",
        "Preferred Topics":  ", ".join(topics) if topics else "",
    })

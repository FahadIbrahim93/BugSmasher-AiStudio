# AI Lead Hunter — Revenue Acquisition Engine

This directory is the portable operating system for the AI Lead Hunter. It is designed so local AI agents can operate the system without depending on chat history.

## Canonical architecture

- `OPERATING_SYSTEM.md` — mission, principles, agent contract, safety and decision rules.
- `SCHEMA.md` — canonical entities and fields for a future structured database.
- `WORKFLOWS.md` — discovery, qualification, audit, offer, outreach, follow-up and learning workflows.
- `SCORING.md` — 100-point lead scoring methodology and expected-value framework.
- `AGENTS.md` — instructions for local/autonomous agents, handoffs and concurrency.
- `DATA_DICTIONARY.md` — field definitions, enums and validation rules.
- `QUALITY_GATES.md` — pre-presentation and pre-outreach checks.
- `OUTREACH.md` — message-generation rules and approval protocol.
- `RESEARCH.md` — evidence/provenance requirements.
- `PIPELINE.md` — current lead-state snapshot; not a replacement for a real database.
- `CHANGELOG.md` — system evolution and migration notes.

## Source of truth

Until a structured database is connected, GitHub is the portable specification and version-controlled snapshot, while Slack is the live operational event stream. Once a real database is available, it should become the canonical transactional store; GitHub remains the versioned agent specification and schema; Drive stores artifacts; Slack coordinates agents; email remains human-controlled.

## Agent startup

1. Read `OPERATING_SYSTEM.md`.
2. Read `AGENTS.md`.
3. Read `SCHEMA.md` and `DATA_DICTIONARY.md` before writing records.
4. Check `PIPELINE.md` and the external database/event stream for existing leads.
5. Search by normalized business name/domain before creating a lead.
6. Preserve history; append evidence/events rather than silently overwriting them.
7. Never claim a message was sent or a meeting occurred unless an actual event confirms it.
8. Stop at `HUMAN_ACTION_REQUIRED` for consequential external actions.

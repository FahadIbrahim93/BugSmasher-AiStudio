# Multi-Agent Handoff Protocol

Use this file whenever work is incomplete, paused, blocked, or transferred between agents/platforms.

## Handoff record template

Copy this template into the relevant PR/comment/session note.

```text
TASK ID:
STATUS: DONE | PARTIAL | BLOCKED | SUPERSEDED | ABANDONED
OWNER/AGENT:
DATE:
BASE COMMIT:
WORKING BRANCH:

OBJECTIVE:

COMPLETED:
- 

NOT COMPLETED:
- 

FILES TOUCHED:
- 

KEY IMPLEMENTATION NOTES:
- 

KNOWN RISKS / REGRESSIONS:
- 

TESTS RUN:
- command:
  result:

CI EVIDENCE:
- run URL / run number:

CURRENT FAILURE, IF ANY:

NEXT EXACT ACTION:

DO NOT REPEAT:
- 

DEPENDENCIES / BLOCKERS:
- 
```

## Rules

1. Never hand off only with “continue from here.”
2. State the exact next action.
3. State what must not be repeated.
4. Include the commit SHA so the next agent knows what it is based on.
5. Include failed commands, not only successful commands.
6. Preserve known risks instead of relying on memory.
7. If code behavior changed, identify the regression test that protects it.
8. If the task is blocked by infrastructure, record the external dependency explicitly.

## Platform transfer protocol

When moving from one AI/IDE/platform to another:

```text
CURRENT STATUS → TASK ID → COMMIT SHA → FILES → FAILURE/EVIDENCE → NEXT ACTION
```

The receiving agent must verify the referenced commit and current branch before editing.

## Context-switch rule

A distracted maintainer may change priorities at any time. Do not erase unfinished state. Mark the task `PARTIAL` and leave a handoff record. Another agent can resume it safely later.

## Completion rule

A handoff can be closed only when the receiving agent independently verifies the acceptance criteria. The handoff text is context, not evidence.
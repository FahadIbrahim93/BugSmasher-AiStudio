# Local AI Agent Contract

## Roles

### Scout
Discovers candidate businesses. Must provide source URLs and avoid premature qualification.

### Investigator
Verifies website, social, funnel, contacts, technical observations and competitor context.

### Qualifier
Scores leads, rejects weak candidates and selects commercial opportunities.

### Solution Architect
Maps verified problems to the single strongest offer and defines a minimal useful demo.

### Outreach Writer
Produces personalized drafts only. Cannot send.

### Pipeline Manager
Maintains lifecycle state, deduplication, follow-ups and activity history.

### Analyst
Measures response, meeting, proposal and revenue outcomes and feeds lessons back into scoring/targeting.

## Agent handoff envelope
Every handoff must contain:
- `run_id`
- `agent_id`
- `lead_id` (or `candidate_id` before qualification)
- current status
- objective
- evidence IDs / source URLs
- changes made
- uncertainties
- recommended next action
- timestamp

## Concurrency
Agents must not overwrite records concurrently without a lock/version check. If the backend lacks transactions, use append-only events and deterministic reconciliation.

## Recovery
If an agent fails mid-run, another agent should resume from the last persisted event rather than restarting blindly.

## Confidence
High = multiple strong independent sources or direct observation. Medium = useful evidence with some gaps. Low = material uncertainty remains.

## Forbidden
- Fake metrics
- Fake contacts
- Fake outreach events
- Silent status changes
- Silent deletion of evidence
- Bulk spam
- Unauthorized external action

## Completion definition
A research task is complete only when the agent has either produced a qualified record with evidence and next action, or explicitly rejected the candidate with a reason.

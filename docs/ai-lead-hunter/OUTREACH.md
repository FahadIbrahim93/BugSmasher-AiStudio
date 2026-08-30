# Outreach System

## Principle
Research first, personalize second, ask third. The goal is a useful business conversation, not message volume.

## Message structure
1. Specific observation
2. Why it may matter commercially
3. Concrete improvement idea
4. Offer to show a small demonstration/audit
5. Low-friction next step

## Prohibited
No fake compliments, fake urgency, unsupported revenue claims, impersonation, deceptive pretexts, mass spam, or repeated contact after a clear opt-out.

## Approval state
`NOT_READY` → `READY` → `HUMAN_APPROVED` → `CONTACTED`.

Only the human can authorize `HUMAN_APPROVED` unless an explicit future policy grants an agent that authority.

## Follow-up
Record each actual send and response. Follow-ups must respect applicable laws/platform rules and opt-outs. If no response, do not fabricate interest. After the configured limit, move to a dormant/watch state unless there is a legitimate new reason to contact.

## Experiment tracking
Every message should have a version ID and store: niche, offer, hook, channel, approval, send date, response, meeting, proposal and outcome. This enables conversion analysis instead of anecdotal learning.

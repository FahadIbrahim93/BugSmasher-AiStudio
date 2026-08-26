# Data Dictionary

## Lifecycle enum
`DISCOVERED`, `QUALIFIED`, `AUDITED`, `OFFER_SELECTED`, `DEMO_PREPARED`, `OUTREACH_READY`, `HUMAN_APPROVED`, `CONTACTED`, `FOLLOW_UP`, `INTERESTED`, `MEETING`, `PROPOSAL`, `WON`, `LOST`, `DO_NOT_CONTACT`.

## Outreach status enum
`NOT_READY`, `READY`, `HUMAN_APPROVED`, `CONTACTED`, `FOLLOW_UP`, `RESPONDED`, `OPTED_OUT`.

## Response classification
`POSITIVE`, `NEUTRAL`, `QUESTION`, `MEETING_REQUEST`, `NEGATIVE`, `NO_RESPONSE`, `OPT_OUT`, `INVALID_CONTACT`.

## Source types
`OFFICIAL_WEBSITE`, `OFFICIAL_SOCIAL`, `BUSINESS_DIRECTORY`, `PUBLIC_REVIEW`, `SEARCH_RESULT`, `COMPETITOR`, `PUBLIC_DOCUMENT`, `OTHER_PUBLIC_SOURCE`.

## Timestamps
Prefer ISO 8601 UTC. Preserve original capture time. Never change historical timestamps to make a record appear fresher.

## URLs
Store canonical URL and source URL separately when useful. Do not store tracking parameters unless needed for provenance.

## Null/unknown semantics
Use explicit `UNKNOWN`/`UNVERIFIED` rather than guessing. Empty string means missing data only; it must not be interpreted as verified negative evidence.

## Monetary data
Store currency explicitly. `estimated_value` is allowed only when supported by a stated/verified source or an internal approved commercial estimate; label its basis. `actual_revenue` requires a real transaction/outcome.

# Canonical Data Model

Design for a relational/document database. Keep lead identity separate from evidence, activities and outreach.

## Lead

`lead_id` (stable), `business_name`, `normalized_business_name`, `domain`, `industry`, `country`, `city`, `website`, `social_urls`, `score_total`, `score_problem`, `score_commercial`, `score_ability_to_pay`, `score_solution_fit`, `score_accessibility`, `score_evidence`, `score_urgency`, `priority`, `lifecycle_status`, `primary_problem`, `commercial_opportunity`, `recommended_offer`, `opportunity_value_band`, `decision_maker_name`, `decision_maker_role`, `public_contact`, `contact_source`, `evidence_confidence`, `outreach_status`, `next_action`, `next_action_at`, `last_researched_at`, `owner_agent`, `created_at`, `updated_at`.

## Evidence

`evidence_id`, `lead_id`, `claim`, `classification`, `source_url`, `source_type`, `source_context`, `captured_at`, `agent_id`, `confidence`, `supersedes_evidence_id`.

Classification enum: `OBSERVED_FACT`, `REASONABLE_INFERENCE`, `HYPOTHESIS`.

## Problem

`problem_id`, `lead_id`, `category`, `description`, `commercial_consequence`, `severity`, `evidence_ids`, `status`.

Categories: `WEBSITE`, `MOBILE_UX`, `CONVERSION`, `SEO`, `LEAD_CAPTURE`, `FOLLOW_UP`, `SUPPORT`, `BOOKING`, `ORDER_FLOW`, `CRM`, `OPERATIONS`, `CONTENT`, `OTHER`.

## Offer

`offer_id`, `lead_id`, `offer_name`, `problem_ids`, `value_proposition`, `deliverables`, `demo_concept`, `fit_score`, `status`, `created_at`.

## Contact

`contact_id`, `lead_id`, `name`, `role`, `channel`, `value`, `verification_status`, `source_url`, `last_verified_at`.

Verification enum: `VERIFIED_PUBLIC`, `UNVERIFIED`, `STALE`, `DO_NOT_USE`.

## Outreach

`outreach_id`, `lead_id`, `channel`, `message_version`, `personalization_hook`, `approval_status`, `approved_by`, `approved_at`, `sent_at`, `response_at`, `response_class`, `meeting_booked`, `proposal_sent`, `outcome`, `lesson`.

Never populate `sent_at` from preparation alone.

## Activity

Append-only: `activity_id`, `lead_id`, `timestamp`, `actor_type`, `actor_id`, `event_type`, `previous_status`, `new_status`, `notes`, `evidence_ids`, `next_action`, `next_action_at`.

## Research Run

`run_id`, `started_at`, `completed_at`, `agent_id`, `market`, `query_strategy`, `leads_discovered`, `leads_qualified`, `leads_rejected`, `errors`, `lessons`.

## Opportunity Outcome

`outcome_id`, `lead_id`, `stage`, `timestamp`, `estimated_value` (only when supplied/verified), `actual_revenue` (only when real), `currency`, `source`, `notes`.

## Identity/deduplication

Primary dedupe key: normalized domain when available. Secondary: normalized legal/business name + city/country. Do not merge ambiguous entities automatically. Flag for review.

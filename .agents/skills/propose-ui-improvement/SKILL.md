---
name: propose-ui-improvement
description: Turn a consumer's custom UI or missing behavior into an evidence-based shared-UI improvement proposal. Use when asked to propose or file a component, helper, or composition improvement; distinguish library gaps from adoption work before publishing.
---

# Propose a UI improvement

Resolve the library checkout, consumer, and canonical issue tracker from the request and applicable repository guidance.
This skill lives in the UI repository; read its `CONTRIBUTING.md` and `.github/ISSUE_TEMPLATE/feature_request.yml` from that checkout.
If organization guidance selects another tracker, use it rather than duplicating the issue in the public library.

## Establish the gap

- Read the consumer's dependency and lockfile, the relevant custom implementation, and the current library exports, README, showcase, and tests.
  Record the installed version and the revision actually inspected; do not infer absence from unused imports or an outdated checkout.
- Search both open and closed proposals by behavior and component synonyms in the canonical tracker and the library's public tracker when different.
  Read matching issue discussion before deciding whether to reuse it; a failed search is not evidence that there is no duplicate.
- Classify each behavior as existing capability/adoption, existing proposal, extension, missing primitive, composition recipe, or application-specific logic.
  Keep observed symptoms separate from inferred causes, especially for stale tabs, service workers, network status, and focus failures.

An existing `DataTable` is an adoption option before proposing another table.
A maintenance-status banner is not automatically a local-save or synchronization indicator: check the actual props and behavior.
A service-worker helper may exist while lacking safe asynchronous draft preservation; name the missing contract instead of proposing registration from scratch.

## Draft and publish

Use the form's evidence, alternatives, ownership, and acceptance fields as the proposal structure, scaled to the gap.
Name the smallest reusable behavior and what stays with the application, including authorization, business rules, persistence, conflict handling, and backend protocols.
One verified consumer can justify evaluation; do not invent additional consumers or prescribe a generalized API before review.
Include relevant touch/hardware keyboard, focus, accessibility, responsive, localization, error, and compatibility requirements as observable outcomes.
State open decisions rather than silently choosing them.
A draft can record missing reproduction or version evidence without claiming that those facts were verified; unavailable private source does not prevent drafting a sanitized candidate.

Reuse a matching proposal with an authorized evidence comment instead of creating a duplicate.
Split independently implementable gaps into bounded issues and preserve existing parent relationships.
For a new issue, use the tracker's established labels; do not invent status labels or claim implementation ownership just to propose work.
An adoption gap belongs to the consumer, not a fabricated missing-component issue.

Publish only when issue creation or posting is authorized by the request or standing workflow.
A draft-only request produces a draft without external writes.
Use the required account identity and structured bodies or body files; read back the created issue/comment and verify its destination, content, labels, and links.
After an uncertain write result, check for success before retrying.
Public artifacts use sanitized reproductions rather than private source links, identities, or infrastructure details.

Return the verified proposal links, reused issues, adoption findings, and unresolved decisions.
Do not implement the proposal or change issue state merely because it was recorded.

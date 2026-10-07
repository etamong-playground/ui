# Proposing UI improvements

Use English for issue and pull-request text.

Use the [UI improvement form](https://github.com/etamong-playground/ui/issues/new?template=feature_request.yml) for public proposals.
For organization work, follow the repository or organization guidance that identifies its canonical tracker; do not create a second public issue for an existing private work item.
Public reports, examples, and attachments must omit private URLs, account identities, credentials, and internal issue references.

Compare the consumer's installed version with the current exports, README, and showcase before calling something missing.
Search open and closed issues and record whether the gap is a missing primitive, an extension, a composition recipe, or application adoption.
A handwritten table is not evidence that the package lacks a table: inspect `DataTable` and explain the exact unsupported behavior, if any.
A touch keypad is a candidate when the existing fields cannot provide the required input behavior; the application still owns denominations, amounts, and persistence.
An installed-app screenshot alone does not prove deployment failure: distinguish the server's assets from the code running in an existing tab and record what was actually inspected.

A useful proposal names a real user task, a reproducible shortcoming, the smallest reusable behavior, alternatives, and observable acceptance criteria.
A single real consumer can motivate evaluation without proving that a new shared component is the best answer.
Prefer an existing component or a documented composition when it meets the need.
Do not make an application-specific permission model or synchronization protocol part of a presentation component.

## Agent workflows

- [Propose UI improvement](.agents/skills/propose-ui-improvement/SKILL.md) checks evidence and duplicates before drafting or publishing a proposal within the requested scope.
- [Review UI proposal](.agents/skills/review-ui-proposal/SKILL.md) returns an evidence-based disposition and acceptance gaps without treating review as permission to implement or close the issue.

The canonical skills live in `.agents/skills`; `.claude/skills` links to that directory so both agent runtimes read the same files.
To review an external proposal, supply its issue URL and the relevant library checkout to the review skill.
Private evidence belongs only in the authorized private tracker, with a sanitized reproduction for any public discussion.

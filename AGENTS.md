# STAC Semantics: repository guide

## Purpose and status

This repository specifies the proposed STAC **Semantics** extension (`sem:`):
annotations connecting a variable, band, dimension, table column or suitable
asset to published vocabulary/ontology concepts. It is a metadata specification,
not a runtime package, application, vocabulary service or UI style system.

The current proposal is v0.1.0 with schema identity:

`https://hamk-uas.github.io/stac-semantics/v0.1.0/schema.json`

It has not been reviewed/endorsed by the STAC community; names and fields may
change. Preserve the [Apache-2.0 license](LICENSE) and source notices.
The npm package is private because tooling uses npm locally; schema publication
is through GitHub Pages, not an npm library release.

Observatory has a related [design proposal](https://github.com/hamk-uas/observatory/blob/main/docs/semantics-extension-plan.md);
`stac-schema-explorer` already offers this schema for inspection.
`observatory-stac-extension` separately owns `obs:` roles/companions/temporal
metadata. Producer tools such as `cards-zarr-optim` and HIKET/Observatory clients
can adopt Semantics, but do not claim they already emit or interpret `sem:concepts`
without checking their implementation.

The ecosystem is pre-alpha with unfrozen APIs and efficient cooperation.
Coordinate breaking proposal changes explicitly without imposing simultaneous
upgrades on all applications. A published versioned schema's identity is still
an external contract; do not silently repurpose it under the assumption that
pre-alpha means release URLs have no meaning. Read each destination repo's
instructions before changing consumers.

## Organization and sources of truth

| File/location | Role |
| --- | --- |
| [README.md](README.md) | Human-facing specification, field meanings, placements, examples and non-goals. |
| [json-schema/schema.json](json-schema/schema.json) | Authoritative draft-7 JSON Schema. |
| [examples](examples) | Executable Item, band and Collection fixtures. |
| [tests/schema.test.mjs](tests/schema.test.mjs) | Positive/negative schema and semantic regression checks. |
| [tests/duplicates.mjs](tests/duplicates.mjs) | Duplicate `(uri, role)` validation beyond JSON Schema. |
| [CHANGELOG.md](CHANGELOG.md) | Proposal/release changes. |
| [package.json](package.json) | npm validation/formatting commands and local schema-URL mapping. |
| [.github/workflows](.github/workflows) | CI checks and release-triggered Pages publication. |

Keep the README, schema titles/descriptions, examples, duplicate helper and tests
synchronized. The schema and examples are hand-maintained source, not generated
application artifacts. Changes to identity/version also need the example
declarations, validator mapping, changelog and publishing path checked together.

## Semantic invariants

- Applies to STAC Items (`Feature`) and Collections, not Catalogs. Use the
  allowed variable-bearing containers: `bands`, `cube:variables`,
  `cube:dimensions`, `table:columns`, assets, `item_assets` and asset templates.
  Do not place `sem:` fields at dataset level, in Collection summaries, links or
  link templates. Dataset classification is a different concern (for example Themes).
- `sem:concepts` is nonempty; each entry needs an absolute `uri`. Other fields
  qualify/document the reference, not replace its identity. Compare IRIs exactly;
  protocol, spelling and trailing slash differences are not normalized away.
- Roles are `variable`, `property`, `object_of_interest`, `matrix`,
  `context_object`, `constraint`, `statistical_modifier` and `unit`.
  Match strengths are `exact`, `close`, `broad`, `narrow` and `related`.
  Missing role means `variable`; missing match means `exact`.
  JSON Schema defaults document interpretation; validation does not insert them.
- Do not repeat a `(uri, role)` pair even if descriptions/titles differ.
  `uniqueItems` only rejects identical whole JSON objects; the
  [duplicate helper](tests/duplicates.mjs) checks the semantic rule, including
  omitted role versus explicit `variable`. Preserve both validation layers and
  explain this distinction to consumers using only the schema.
- Asset-level concepts describe the asset's single variable or concepts shared
  by all its bands; a band's concept list **replaces**, not merges with, the
  asset-level list.
- Concepts denote types, not individual observations or particular entities.
  Shared concepts do not establish numerical comparability, unit conversion,
  common aggregation, matching support or scientific equivalence.
- Keep units in their established STAC/common metadata conventions. Semantics
  does not own display palettes, quality flags, provenance, data transformations
  or Observatory-specific UI behavior.

## Validation and release workflow

Use the repository's npm tooling and committed lockfile, not another workspace's
pnpm configuration.

- `npm install` sets up development dependencies.
- `npm run check-schema` is the focused Node/Ajv and duplicate-rule test suite.
- `npm run check-examples` validates example STAC using the local schema mapping;
  external schema resolution can require network access.
- `npm run check-markdown` validates documentation. `npm test` combines Markdown,
  example and schema checks; keep all three passing for a contract change.
- `npm run format-examples` formats fixtures; inspect the diff rather than mixing
  unrelated example churn into a semantic change.
- [.github/workflows/publish.yaml](.github/workflows/publish.yaml) publishes
  `json-schema` under the release-ref path on a published GitHub release.
  Ordinary commits are not schema releases. Verify the intended hosted path
  matches `$id` before claiming a version is available.

Do not weaken tests to accommodate a proposal change without first making the
new rule explicit in the specification and adding its positive/negative cases.
No UI style or translation system is owned here; readable schema/specification
documentation is the relevant presentation contract.

## TODO: planned work, not confirmed defects

No contradictory schema/specification rule was identified in the analysis for
this guide. In particular, helper-enforced pair uniqueness is intentional, not
a claim that `uniqueItems` enforces more than it does.

- [ ] Complete STAC community review and resolve proposal naming/scope feedback;
  keep the maturity statement honest until that process happens.
- [ ] Establish a real producer/consumer pilot beyond schema inspection, with
  explicit adoption responsibilities. Do not assume Observatory display presets
  or CARDS/HIKET output already use the extension.
- [ ] When implementing downstream validation, carry over the documented
  `(uri, role)` check and test it explicitly; a schema-only pass is insufficient.

## Keep this guide current

Update this file in the same change whenever proposal status, semantics,
placements, identity/versioning, validation commands or ecosystem adoption
changes, or new high-value information is learned. Link to the specification
instead of duplicating it wholesale. Record actual discrepancies separately from
planned adoption work, and remove or revise TODOs as they are resolved.

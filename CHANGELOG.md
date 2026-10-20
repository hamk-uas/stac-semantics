# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The JSON Schema has titles and descriptions for every field of the Concept Reference Object and for each `role` and
  `match` value, so that tools can explain them. `role`, `match` and `type` list their values as `oneOf` of titled
  constants instead of `enum`. Validation is unchanged.

## [v0.1.0] - 2026-10-15

### Added

- `sem:concepts` with Concept Reference Objects (`uri`, `role`, `match`, `scheme`, `id`, `title`, `description`)
  for Band Objects, `cube:variables` and `cube:dimensions` entries, `table:columns` Column Objects,
  Assets, Item Asset Definitions and Asset Templates
- JSON Schema, examples and schema tests

[Unreleased]: <https://github.com/hamk-uas/stac-semantics/compare/v0.1.0...HEAD>

[v0.1.0]: <https://github.com/hamk-uas/stac-semantics/tree/v0.1.0>

# Semantics Extension Specification

- **Title:** Semantics
- **Identifier:** <https://hamk-uas.github.io/stac-semantics/v0.1.0/schema.json>
- **Field Name Prefix:** sem
- **Scope:** Item, Collection
- **Extension [Maturity Classification](https://github.com/radiantearth/stac-spec/tree/master/extensions/README.md#extension-maturity):** Proposal
- **Owner**: @olli4

This document explains the Semantics Extension to the [SpatioTemporal Asset Catalog](https://github.com/radiantearth/stac-spec)
(STAC) specification.

The extension lets STAC documents say **what a variable, band or table column measures** by referring to concepts in
published vocabularies and ontologies, such as [CF standard names](https://cfconventions.org/Data/cf-standard-names/current/build/cf-standard-name-table.html)
in the [NERC Vocabulary Server](https://vocab.nerc.ac.uk/), [QUDT](https://qudt.org/) quantity kinds and units,
[ChEBI](https://www.ebi.ac.uk/chebi/), [ENVO](https://sites.google.com/site/environmentontology/) and
[I-ADOPT](https://i-adopt.github.io/) variables. Clients can then recognise the same quantity across catalogs without
parsing names or descriptions, for example to choose display defaults, convert units or find comparable data.

> \[!NOTE]
> This extension is a proposal that has not yet been reviewed by the STAC community. Names and fields may change in
> later versions.

- Examples:
  - [Item example](examples/item.json): A Zarr store with concepts on data cube variables and dimensions
  - [Item example with bands](examples/item-bands.json): Surface reflectance bands and a single-band asset
  - [Collection example](examples/collection.json): In-situ table columns in Item Asset Definitions
- [JSON Schema](json-schema/schema.json)
- [Changelog](./CHANGELOG.md)

## Fields

The field in the table below can be used in these parts of STAC documents:

- [ ] Catalogs
- [ ] Collections (top-level fields)
- [ ] Item Properties (incl. Summaries in Collections)
- [x] Assets (for both Collections and Items, incl. Item Asset Definitions in Collections and Asset Templates)
- [ ] Links (incl. Link Templates)
- [x] Bands (in Item Properties, Collections, Assets and Item Asset Definitions)
- [x] [Datacube Extension](https://github.com/stac-extensions/datacube): entries of `cube:variables` and `cube:dimensions`
- [x] [Table Extension](https://github.com/stac-extensions/table): Column Objects in `table:columns`

| Field Name   | Type                                                     | Description                                                            |
| ------------ | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| sem:concepts | \[[Concept Reference Object](#concept-reference-object)] | Concepts that describe the variable, band, column, dimension or asset. |

### Additional Field Information

#### sem:concepts

A non-empty list of concepts that together describe what the values of **one variable** represent. The field is
allowed wherever a single variable is described:

| Location                                       | Describes                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| Band Object (`bands`)                          | the band                                                         |
| Entry of `cube:variables`                      | the data cube variable                                           |
| Entry of `cube:dimensions`                     | the dimension's coordinate values, for example depth or latitude |
| Column Object (`table:columns`)                | the column                                                       |
| Asset, Item Asset Definition or Asset Template | the asset's single variable, or all of its bands                 |

Bands, data cube variables and dimensions and table columns may appear in Item Properties, at the top level of
Collections, in Assets and in Item Asset Definitions; the field is allowed on them in all these places.

The field is **not** allowed in Item Properties or at the top level of Catalogs and Collections (and so not in
Summaries). A dataset as a whole is not a variable; use the [Themes extension](https://github.com/stac-extensions/themes)
to say what a dataset is about.

On an asset, the field describes the variable the asset holds. Following the STAC best practice for
[multiple bands](https://github.com/radiantearth/stac-spec/blob/master/best-practices.md#multiple-bands), concepts that
all bands of an asset share should be given once on the asset; they then apply to every band. A band's own
`sem:concepts` replaces the asset's list for that band (the lists are not merged). The field must not be used on an
asset that holds several different variables (for example a Zarr store or a table); annotate its `cube:variables` or
`table:columns` instead.

Omit the field when no concept fits the values, for example 8-bit display values in a `visual` asset.

### Concept Reference Object

A reference to one concept in a vocabulary, ontology or other concept scheme.

| Field Name  | Type   | Description                                                                                    |
| ----------- | ------ | ---------------------------------------------------------------------------------------------- |
| uri         | string | **REQUIRED.** Identifier (absolute IRI) of the concept, as published by its vocabulary.        |
| role        | string | What part of the variable the concept describes, see [role](#role). Default: `variable`.       |
| match       | string | How closely the concept fits what the values represent, see [match](#match). Default: `exact`. |
| scheme      | string | Identifier (absolute IRI) of the vocabulary (concept scheme) the concept belongs to.           |
| id          | string | The concept's notation or code within `scheme`, for example a CF standard name.                |
| title       | string | Human-readable label of the concept.                                                           |
| description | string | Human-readable explanation, for example why a `match` other than `exact` was chosen.           |

Other extensions may add fields to Concept Reference Objects; their names must carry the extension's prefix (for
example `xyz:field`). Unprefixed fields other than the ones above are not allowed.

Each `uri` and `role` pair must occur at most once in a list. A reference without `role` has the role `variable`.

#### uri

The `uri` is the identity of the concept. Two references are to the same concept exactly when their `uri` strings are
equal; clients compare them as strings and never need to dereference them. Producers must use the IRI exactly as the
vocabulary publishes it, including `http` or `https` and any trailing slash. Concept IRIs should be HTTP(S) IRIs.

For example, the NERC Vocabulary Server publishes each CF standard name as
`http://vocab.nerc.ac.uk/standard_name/<name>/` in its collection P07 (`http://vocab.nerc.ac.uk/collection/P07/current/`).

#### role

The roles follow the [I-ADOPT framework](https://i-adopt.github.io/), a Research Data Alliance recommendation that
decomposes a variable into components ([ontology](https://w3id.org/iadopt/ont/)).

| Role                   | The concept is ...                                                                         | I-ADOPT                  |
| ---------------------- | ------------------------------------------------------------------------------------------ | ------------------------ |
| `variable`             | the variable as a whole, for example a CF standard name or an I-ADOPT variable             | `Variable`               |
| `property`             | the characteristic of the object of interest that is observed, for example mole fraction   | `hasProperty`            |
| `object_of_interest`   | the entity whose property is observed, for example methane                                 | `hasObjectOfInterest`    |
| `matrix`               | the entity in which the object of interest is contained, for example air for methane       | `hasMatrix`              |
| `context_object`       | an entity that gives background information about the object of interest                   | `hasContextObject`       |
| `constraint`           | a qualifier that confines another component to a particular state, for example "dissolved" | `hasConstraint`          |
| `statistical_modifier` | a statistical measure applied to the property, for example a maximum                       | `hasStatisticalModifier` |
| `unit`                 | the unit of the values (not an I-ADOPT role)                                               | -                        |

Most providers will start with one `variable` concept. Component concepts help search and discovery; ratios and other
I-ADOPT systems (numerator, denominator, source, target) cannot be expressed in this version, so prefer a `variable`
concept that names a ratio as a whole. Statistics over the data's own axes (a daily mean, an area mean) are also
described by `cf:cell_methods`, which clients should use when comparing variables.

#### match

The values follow the [SKOS mapping properties](https://www.w3.org/TR/skos-reference/#mapping).

| Match     | The concept is ...                          | SKOS                |
| --------- | ------------------------------------------- | ------------------- |
| `exact`   | the same as what the values represent       | `skos:exactMatch`   |
| `close`   | nearly the same, but not formally identical | `skos:closeMatch`   |
| `broad`   | broader than what the values represent      | `skos:broadMatch`   |
| `narrow`  | narrower than what the values represent     | `skos:narrowMatch`  |
| `related` | related in another way                      | `skos:relatedMatch` |

A qualified match is better than a wrong `exact` claim. For example, the matrix of a column-averaged dry-air mole
fraction is dry air in an atmospheric column; ENVO's "air" is broader, so it is given with `match` `broad`. Clients
that act on meaning (display defaults, unit conversion, computation checks) should use only `exact` concepts; the others
serve search and discovery.

#### scheme and id

`scheme` lets clients restrict themselves to vocabularies they trust; `id` and `title` help people. Neither is part of
the concept's identity. They have the same meaning as `scheme` and `id` in the
[Themes extension](https://github.com/stac-extensions/themes), so a Themes concept converts to a Concept Reference by
adding its concept IRI as `uri`.

### What concepts describe

A concept names a **kind** of thing: a quantity, substance, medium or qualifier. In
[W3C SOSA/SSN](https://www.w3.org/TR/vocab-ssn/) terms, `sem:concepts` describes the observed property. Particular
places, objects, sites, sensors, campaigns and time periods are never concepts in `sem:concepts`, so that the same
annotation means the same at every site and in every region. They have their own places in STAC:

| Information                                 | Where it belongs                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| Unit of the values                          | `unit` (and optionally a `unit` concept)                                          |
| Statistic over the data's axes (daily mean) | `cf:cell_methods` of the [CF extension](https://github.com/stac-extensions/cf)    |
| Area the data cover, or a station           | `geometry`, `bbox`, spatial `cube:dimensions`, links                              |
| Height or depth (2 m, 0-10 cm)              | vertical `cube:dimensions`, `description`                                         |
| Platform, instrument, algorithm or model    | `platform`, `instruments`, `processing:*`, `providers`                            |
| Meaning of categorical values               | the [Classification extension](https://github.com/stac-extensions/classification) |

#### Concepts and comparability

Two variables with the same concepts are not necessarily comparable or interchangeable: daily means and daily maxima of
air temperature share a concept, and so do modelled and observed methane. Clients that compare, convert or combine
values should check at least the concepts, `unit`, `cf:cell_methods` and the time integration, and where it matters
the provenance. Display defaults may use the concepts and unit alone.

#### Derived variables

Clients and processors that compute new variables keep the concepts of a source only for operations that preserve the
quantity, such as masking, subsetting, unit conversion and averaging over space or time (with the corresponding cell
method added). They drop them for operations that change the quantity, such as sums over an area, products, ratios or
differences, unless the concepts of the result are known.

### Relation to the CF extension

`cf:standard_name` and `cf:cell_methods` stay as they are. When a variable has a `cf:standard_name` without a modifier,
providers should add the matching NERC P07 concept with role `variable`. The two must not contradict each other.
CF standard name modifiers (such as `standard_error`) have no concept IRIs; such variables keep only
`cf:standard_name`.

```json
{
  "cf:standard_name": "air_temperature",
  "sem:concepts": [
    {
      "uri": "http://vocab.nerc.ac.uk/standard_name/air_temperature/",
      "scheme": "http://vocab.nerc.ac.uk/collection/P07/current/",
      "id": "air_temperature"
    }
  ]
}
```

### Units

The `unit` field of STAC common metadata ([UCUM](https://ucum.org/) or UDUNITS-2) remains the authoritative unit of the
values. A concept with role `unit`, for example a QUDT unit, is optional and must denote the same unit. It lets clients
use the unit's dimensions and conversion factors published by the vocabulary.

### Example

A data cube variable of the [Item example](examples/item.json):

```json
{
  "type": "data",
  "description": "Column-averaged dry-air mole fraction of methane (XCH4)",
  "dimensions": ["time", "latitude", "longitude"],
  "unit": "ppbv",
  "cf:standard_name": "dry_atmosphere_mole_fraction_of_methane",
  "sem:concepts": [
    {
      "uri": "http://vocab.nerc.ac.uk/standard_name/dry_atmosphere_mole_fraction_of_methane/",
      "role": "variable",
      "scheme": "http://vocab.nerc.ac.uk/collection/P07/current/",
      "id": "dry_atmosphere_mole_fraction_of_methane"
    },
    { "uri": "http://qudt.org/vocab/quantitykind/MoleFraction", "role": "property", "title": "Mole fraction" },
    { "uri": "http://purl.obolibrary.org/obo/CHEBI_16183", "role": "object_of_interest", "title": "methane" },
    { "uri": "http://purl.obolibrary.org/obo/ENVO_00002005", "role": "matrix", "match": "broad", "title": "air" },
    { "uri": "http://qudt.org/vocab/unit/PPB", "role": "unit", "title": "parts per billion" }
  ]
}
```

### Validation

The JSON Schema checks the shape of the field: that it appears only where allowed, that `uri` and `scheme` are absolute
IRIs, that `role` and `match` have allowed values, and that no Concept Reference occurs twice. It cannot check:

- that each `uri` and `role` pair is unique within a list (JSON Schema can only compare whole objects); the tests of
  this repository include a [check](tests/duplicates.mjs) that linters can reuse,
- that a concept exists, or fits the data,
- that a concept agrees with `cf:standard_name` or `unit`.

## Contributing

All contributions are subject to the
[STAC Specification Code of Conduct](https://github.com/radiantearth/stac-spec/blob/master/CODE_OF_CONDUCT.md).
For contributions, please follow the
[STAC specification contributing guide](https://github.com/radiantearth/stac-spec/blob/master/CONTRIBUTING.md) Instructions
for running tests are copied here for convenience.

### Running tests

The same checks that run as checks on PRs are part of the repository and can be run locally to verify that changes are valid.
To run tests locally, you'll need `npm`, which is a standard part of any [node.js installation](https://nodejs.org/en/download/).

First you'll need to install everything with npm once. Just navigate to the root of this repository and on
your command line run:

```bash
npm install
```

Then to check markdown formatting, test the examples against the JSON schema and run the schema tests, you can run:

```bash
npm test
```

This will spit out the same texts that you see online, and you can then go and fix your markdown or examples.

If the tests reveal formatting problems with the examples, you can fix them with:

```bash
npm run format-examples
```

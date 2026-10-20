import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { findDuplicateConcepts } from './duplicates.mjs';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
// The same Ajv setup and IRI formats as stac-node-validator, which `npm run check-examples` uses.
const iriFormats = require('stac-node-validator/iri.js');

const readJson = (url) => JSON.parse(readFileSync(url, 'utf8'));
const schema = readJson(new URL('../json-schema/schema.json', import.meta.url));
const SCHEMA_ID = schema.properties.stac_extensions.contains.const;

const ajv = new Ajv({ formats: iriFormats, allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const errorsOf = (document) => (validate(document) ? [] : validate.errors);

const P07 = 'http://vocab.nerc.ac.uk/collection/P07/current/';
const AIR_TEMPERATURE = 'http://vocab.nerc.ac.uk/standard_name/air_temperature/';
const concepts = (overrides = {}) => [{ uri: AIR_TEMPERATURE, ...overrides }];
const annotated = (extra = {}) => ({ 'sem:concepts': concepts(), ...extra });

function item({ properties = {}, assets = {}, top = {} } = {}) {
  return {
    stac_version: '1.1.0',
    stac_extensions: [SCHEMA_ID],
    type: 'Feature',
    id: 'item',
    geometry: null,
    properties: { datetime: '2021-01-01T00:00:00Z', ...properties },
    links: [],
    assets,
    ...top,
  };
}

function collection(top = {}) {
  return {
    stac_version: '1.1.0',
    stac_extensions: [SCHEMA_ID],
    type: 'Collection',
    id: 'collection',
    description: 'A description',
    license: 'CC-BY-4.0',
    extent: { spatial: { bbox: [[-180, -90, 180, 90]] }, temporal: { interval: [[null, null]] } },
    links: [],
    ...top,
  };
}

const assetWith = (fields) => ({ data: { href: 'https://example.com/data', ...fields } });

test('examples are valid and have unique concept references', () => {
  const dir = new URL('../examples/', import.meta.url);
  const files = readdirSync(dir).filter((name) => name.endsWith('.json'));
  assert.ok(files.length >= 3);
  for (const name of files) {
    const document = readJson(new URL(name, dir));
    assert.deepEqual(errorsOf(document), [], name);
    assert.deepEqual(findDuplicateConcepts(document), [], name);
  }
});

const validCases = {
  'asset (single variable)': item({ assets: assetWith(annotated()) }),
  'bands in an asset': item({ assets: assetWith({ bands: [annotated({ name: 'b1' })] }) }),
  'bands in Item properties': item({ properties: { bands: [annotated({ name: 'b1' })] } }),
  'cube:variables in an asset': item({ assets: assetWith({ 'cube:variables': { t: annotated({ type: 'data' }) } }) }),
  'cube:variables in Item properties': item({ properties: { 'cube:variables': { t: annotated({ type: 'data' }) } } }),
  'cube:dimensions in Item properties': item({
    properties: { 'cube:dimensions': { depth: annotated({ type: 'spatial', axis: 'z' }) } },
  }),
  'table:columns in an asset': item({ assets: assetWith({ 'table:columns': [annotated({ name: 'TA' })] }) }),
  'table:columns in Item properties': item({ properties: { 'table:columns': [annotated({ name: 'TA' })] } }),
  'asset templates': item({ top: { assetTemplates: { data: annotated({ href: 'https://example.com/{x}' }) } } }),
  'Collection assets': collection({ assets: assetWith(annotated()) }),
  'Collection item_assets': collection({ item_assets: { data: annotated({ roles: ['data'] }) } }),
  'bands in Collection item_assets': collection({ item_assets: { data: { bands: [annotated({ name: 'b1' })] } } }),
  'bands at Collection top level': collection({ bands: [annotated({ name: 'b1' })] }),
  'cube:variables at Collection top level': collection({ 'cube:variables': { t: annotated({ type: 'data' }) } }),
  'cube:dimensions at Collection top level': collection({ 'cube:dimensions': { depth: annotated({ type: 'spatial' }) } }),
  'table:columns at Collection top level': collection({ 'table:columns': [annotated({ name: 'TA' })] }),
  'all optional concept fields': item({
    assets: assetWith({
      'sem:concepts': [
        {
          uri: AIR_TEMPERATURE,
          role: 'variable',
          match: 'exact',
          scheme: P07,
          id: 'air_temperature',
          title: 'Air temperature',
          description: 'Bulk temperature of the air.',
        },
        { uri: 'https://qudt.org/vocab/quantitykind/Temperature', role: 'property', match: 'close' },
      ],
    }),
  }),
  'every role and match value': item({
    assets: assetWith({
      'sem:concepts': ['variable', 'property', 'object_of_interest', 'matrix', 'context_object', 'constraint',
        'statistical_modifier', 'unit'].map((role, index) => ({
        uri: `https://example.com/concept/${index}`,
        role,
        match: ['exact', 'close', 'broad', 'narrow', 'related'][index % 5],
      })),
    }),
  }),
  'fields of other extensions in a Concept Reference': item({
    assets: assetWith({ 'sem:concepts': concepts({ 'other:field': 1 }) }),
  }),
  'the same concept with different roles': item({
    assets: assetWith({ 'sem:concepts': [{ uri: AIR_TEMPERATURE }, { uri: AIR_TEMPERATURE, role: 'property' }] }),
  }),
};

for (const [name, document] of Object.entries(validCases)) {
  test(`valid: ${name}`, () => {
    assert.deepEqual(errorsOf(document), []);
    assert.deepEqual(findDuplicateConcepts(document), []);
  });
}

// Each case breaks one rule of the extension and must fail the schema.
const invalidCases = {
  'identifier missing from stac_extensions': { ...item({ assets: assetWith(annotated()) }), stac_extensions: [] },
  'used in a Catalog': {
    stac_version: '1.1.0',
    stac_extensions: [SCHEMA_ID],
    type: 'Catalog',
    id: 'catalog',
    description: 'A description',
    links: [],
  },
  'field in Item properties': item({ properties: annotated() }),
  'field at Item top level': item({ top: annotated() }),
  'field at Collection top level': collection(annotated()),
  'field in a link': item({ top: { links: [annotated({ href: 'https://example.com', rel: 'about' })] } }),
  'field in Collection summaries': collection({ summaries: annotated() }),
  'unknown field with the prefix': item({ assets: assetWith({ 'sem:concept': concepts() }) }),
  'empty array': item({ assets: assetWith({ 'sem:concepts': [] }) }),
  'not an array': item({ assets: assetWith({ 'sem:concepts': { uri: AIR_TEMPERATURE } }) }),
  'Concept Reference not an object': item({ assets: assetWith({ 'sem:concepts': [AIR_TEMPERATURE] }) }),
  'uri missing': item({ assets: assetWith({ 'sem:concepts': [{ id: 'air_temperature', scheme: P07 }] }) }),
  'uri relative': item({ assets: assetWith({ 'sem:concepts': [{ uri: 'air_temperature' }] }) }),
  'uri with whitespace': item({ assets: assetWith({ 'sem:concepts': [{ uri: 'http://example.com/air temperature' }] }) }),
  'uri not a string': item({ assets: assetWith({ 'sem:concepts': [{ uri: 42 }] }) }),
  'scheme relative': item({ assets: assetWith({ 'sem:concepts': concepts({ scheme: 'P07' }) }) }),
  'unknown role': item({ assets: assetWith({ 'sem:concepts': concepts({ role: 'feature_of_interest' }) }) }),
  'unknown match': item({ assets: assetWith({ 'sem:concepts': concepts({ match: 'exactMatch' }) }) }),
  'unknown unprefixed property': item({ assets: assetWith({ 'sem:concepts': concepts({ rol: 'matrix' }) }) }),
  'empty id': item({ assets: assetWith({ 'sem:concepts': concepts({ id: '' }) }) }),
  'empty title': item({ assets: assetWith({ 'sem:concepts': concepts({ title: '' }) }) }),
  'identical Concept References': item({
    assets: assetWith({ 'sem:concepts': [{ uri: AIR_TEMPERATURE }, { uri: AIR_TEMPERATURE }] }),
  }),
  'invalid reference in a band': item({ assets: assetWith({ bands: [{ name: 'b1', 'sem:concepts': [{}] }] }) }),
  'invalid reference in cube:variables': item({
    properties: { 'cube:variables': { t: { type: 'data', 'sem:concepts': [{ uri: 'x' }] } } },
  }),
  'invalid reference in cube:dimensions': collection({
    'cube:dimensions': { z: { type: 'spatial', 'sem:concepts': [{ uri: 'x' }] } },
  }),
  'invalid reference in table:columns': collection({
    item_assets: { data: { 'table:columns': [{ name: 'TA', 'sem:concepts': [{ uri: 'x' }] }] } },
  }),
  'invalid reference in an asset template': item({
    top: { assetTemplates: { data: { href: 'https://example.com/{x}', 'sem:concepts': [] } } },
  }),
};

for (const [name, document] of Object.entries(invalidCases)) {
  test(`invalid: ${name}`, () => {
    assert.notDeepEqual(errorsOf(document), []);
  });
}

test('duplicates: same uri with the default and the explicit variable role', () => {
  const document = item({
    assets: assetWith({ 'sem:concepts': [{ uri: AIR_TEMPERATURE }, { uri: AIR_TEMPERATURE, role: 'variable', scheme: P07 }] }),
  });
  assert.deepEqual(errorsOf(document), [], 'the schema cannot detect this');
  assert.deepEqual(findDuplicateConcepts(document), [
    {
      path: '/assets/data/sem:concepts/1',
      firstPath: '/assets/data/sem:concepts/0',
      uri: AIR_TEMPERATURE,
      role: 'variable',
    },
  ]);
});

test('duplicates: found in nested variables and escaped in JSON Pointers', () => {
  const twice = [{ uri: AIR_TEMPERATURE, role: 'property' }, { uri: AIR_TEMPERATURE, role: 'property', title: 'T' }];
  const document = collection({ 'cube:variables': { 'a/b': { type: 'data', 'sem:concepts': twice } } });
  assert.deepEqual(
    findDuplicateConcepts(document).map((duplicate) => duplicate.path),
    ['/cube:variables/a~1b/sem:concepts/1'],
  );
});

test('the field, the Concept Reference and every allowed value have a title and a description', () => {
  const field = schema.definitions['sem:concepts'];
  const concept = schema.definitions.concept;
  assert.ok(field.title && field.description, 'sem:concepts');
  assert.ok(concept.title && concept.description, 'Concept Reference');
  for (const [name, property] of Object.entries(concept.properties)) {
    assert.ok(property.title && property.description, name);
    assert.equal(property.enum, undefined, `${name} lists its values as titled constants instead of enum`);
    for (const value of property.oneOf ?? []) assert.ok(value.title && value.description, `${name}: ${value.const}`);
  }
});

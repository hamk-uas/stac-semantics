// Checks that JSON Schema cannot express: Concept References in one `sem:concepts` array must have
// unique `uri` + `role` pairs, where a missing `role` means `variable`.

export const DEFAULT_ROLE = 'variable';

export function findDuplicateConcepts(document) {
  const duplicates = [];
  walk(document, '', duplicates);
  return duplicates;
}

function walk(value, path, duplicates) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}/${index}`, duplicates));
    return;
  }
  if (value === null || typeof value !== 'object') {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`;
    if (key === 'sem:concepts' && Array.isArray(child)) {
      checkArray(child, childPath, duplicates);
    }
    walk(child, childPath, duplicates);
  }
}

function checkArray(concepts, path, duplicates) {
  const seen = new Map();
  concepts.forEach((concept, index) => {
    if (concept === null || typeof concept !== 'object' || typeof concept.uri !== 'string') {
      return;
    }
    const role = concept.role ?? DEFAULT_ROLE;
    const key = JSON.stringify([concept.uri, role]);
    if (seen.has(key)) {
      duplicates.push({ path: `${path}/${index}`, firstPath: `${path}/${seen.get(key)}`, uri: concept.uri, role });
    } else {
      seen.set(key, index);
    }
  });
}

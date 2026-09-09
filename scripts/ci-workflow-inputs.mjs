// Shared workflow census, maintained in CrispStrobe/bw-circuit-ui.
// MIT. Keep consumer copies byte-identical when adopting changes.
import {readdirSync, readFileSync} from 'node:fs';
import {join, relative, posix} from 'node:path';

export function workflowSources(root) {
    const walk = dir => readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
        const path = join(dir, entry.name);
        return entry.isDirectory() ? walk(path) : /\.ya?ml$/.test(entry.name) ? [path] : [];
    });
    return new Map(walk(join(root, '.github', 'workflows'))
        .map(file => [relative(root, file), readFileSync(file, 'utf8')]));
}

// Deliberately require block-style external checkouts. A new syntax must be
// taught to the census with a failing fixture, rather than silently omitted.
export function checkoutSites(workflows) {
    const sites = [];
    for (const [file, source] of workflows) {
        const lines = source.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (/^\s*#/.test(lines[i]) || !/\brepository\s*:/.test(lines[i])) continue;
            const repository = lines[i].match(/^\s*repository:\s*(.*?)\s*(?:#.*)?$/)?.[1];
            if (!repository) throw new Error(`${file}:${i + 1}: unsupported repository syntax`);
            const indent = lines[i].search(/\S/);
            let start = i;
            while (start > 0 && !/^\s*-\s/.test(lines[start])) start--;
            let end = i + 1;
            while (end < lines.length && !(lines[end].trim() && lines[end].search(/\S/) < indent)) end++;
            const step = lines.slice(start, end).join('\n');
            if (!/uses:\s*['"]?actions\/checkout@/.test(step)) {
                throw new Error(`${file}:${i + 1}: repository field outside a recognized checkout`);
            }
            const refs = lines.slice(start, end)
                .filter(line => line.search(/\S/) === indent)
                .map(line => line.match(/^\s*ref:\s*(.*?)\s*(?:#.*)?$/)?.[1]).filter(Boolean);
            if (refs.length > 1) throw new Error(`${file}:${i + 1}: duplicate checkout ref`);
            const unquote = value => value?.replace(/^(['"])(.*)\1$/, '$2');
            sites.push({file, line: i + 1, repository: unquote(repository), ref: unquote(refs[0])});
        }
    }
    return sites;
}

export function assertCheckoutPins(workflows, allowedRef = () => false) {
    const sites = checkoutSites(workflows);
    for (const site of sites) {
        if (!/^[a-f0-9]{40}$/.test(site.ref || '') && !allowedRef(site)) {
            throw new Error(`${site.file}:${site.line} ${site.repository}: expected a full 40-character reviewed SHA; got ${site.ref || '<missing>'}`);
        }
    }
    return sites;
}

export function assertNoRawClones(workflows) {
    for (const [file, source] of workflows) {
        const code = source.split('\n').filter(line => !/^\s*#/.test(line)).join('\n');
        if (/\bgit\s+(?:\\\n\s*)?clone\b/.test(code)) {
            throw new Error(`${file}: unreviewed raw clone; record and enforce its exact pin contract`);
        }
    }
}

// Follow direct workflow script invocations and relative module imports. This
// complements the checkout census without treating test fixture strings as CI.
export function assertInvokedScriptsPinned(workflows, readScript) {
    const pending = [...workflows.values()].flatMap(source =>
        [...source.matchAll(/\b(?:node|bash|sh)\s+(scripts\/[\w./-]+\.(?:mjs|js|sh))\b/g)].map(m => m[1]));
    const visited = new Set();
    while (pending.length) {
        const file = pending.pop();
        if (visited.has(file)) continue;
        visited.add(file);
        const source = readScript(file);
        const code = source.split('\n').filter(line => !/^\s*(?:#|\/\/|\*)/.test(line)).join('\n');
        if (/\bgit\s+clone\b/.test(code)
            || /\(\s*['"]git['"]\s*,\s*\[\s*['"]clone['"]/.test(code)
            || /\bgit\(\s*['"]clone['"]/.test(code)) {
            throw new Error(`${file}: unreviewed script clone; enforce an exact pin contract before adding this site`);
        }
        for (const match of code.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.[^'"]+\.(?:mjs|js))['"]/g)) {
            const dependency = posix.normalize(posix.join(posix.dirname(file), match[1]));
            // Sibling modules belong to the separately pinned repository, not
            // this repository's script corpus.
            if (!dependency.startsWith('../')) pending.push(dependency);
        }
    }
    return [...visited].sort();
}

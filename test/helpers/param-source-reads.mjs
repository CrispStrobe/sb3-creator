// Source-only tier-1 instrument. This never imports or executes engine code.
import { dirname, resolve } from 'node:path';

const stripComments = text => text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

export function readParamKeys(sources) {
    const keys = new Set();
    const anchored = [
        /\bparams\s*(?:\?\.|\.)\s*([A-Za-z_]\w*)/g,
        /\bparams\s*(?:\?\.)?\s*\[\s*['"]([A-Za-z_]\w*)['"]/g,
    ];
    const clean = new Map([...sources].map(([file, text]) => [resolve(file), stripComments(text)]));
    for (const text of clean.values()) {
        for (const re of anchored) {
            re.lastIndex = 0;
            let m;
            while ((m = re.exec(text)) !== null) keys.add(m[1]);
        }
        // const { rDark, rLight } = part.params
        for (const m of text.matchAll(/\{([^{}]*)\}\s*=\s*[\w.?]*params\b/g))
            for (const piece of m[1].split(',')) {
                const k = piece.split(':')[0].trim().replace(/^\.\.\./, '');
                if (/^[A-Za-z_]\w*$/.test(k)) keys.add(k);
            }
        // A local alias for the params object: `const P = part.params` and
        // `sourceVoltage(p, t)` where p IS params (mna.js reads p.amplitude,
        // p.offset, p.freq that way). Only in files that handle params at all.
        // This is the one deliberately loose rule here: an unrelated local `p`
        // can vote, which can only make tier 1 quieter, never wrongly red. Tier 2
        // is where per-kind sharpness lives, and it is not fooled by aliases.
        if (/\bparams\b/.test(text))
            for (const m of text.matchAll(/\b[Pp]\s*\.\s*([A-Za-z_]\w*)/g)) keys.add(m[1]);
    }

    // Follow the engine's literal-key helper calls only through their actual
    // relative named import. The declaration must itself read its first
    // argument's params using its second formal, as world.ambient does.
    // This discovers keys, not per-kind behaviour: tier 2 remains unchanged.
    const readers = new Map();
    for (const [file, text] of clean) {
        const names = new Set();
        const declaration = /export\s+function\s+(\w+)\s*\(\s*(\w+)\s*,\s*(\w+)[^)]*\)\s*\{\s*const\s+\w+\s*=\s*(\w+)\s*\?\.\s*params\s*\?\.\s*\[\s*(\w+)\s*\]\s*;/g;
        for (const m of text.matchAll(declaration))
            if (m[2] === m[4] && m[3] === m[5]) names.add(m[1]);
        readers.set(file, names);
    }
    for (const [file, text] of clean) {
        for (const imported of text.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)) {
            if (!imported[2].startsWith('.')) continue;
            const exported = readers.get(resolve(dirname(file), imported[2]));
            if (!exported) continue;
            for (const item of imported[1].split(',')) {
                const binding = item.trim().match(/^(\w+)(?:\s+as\s+(\w+))?$/);
                if (!binding || !exported.has(binding[1])) continue;
                const local = binding[2] || binding[1];
                const call = new RegExp('\\b' + local + "\\s*\\(\\s*[A-Za-z_$][\\w$]*\\s*,\\s*['\"]([A-Za-z_]\\w*)['\"]\\s*,", 'g');
                for (const m of text.matchAll(call)) keys.add(m[1]);
            }
        }
    }
    return keys;
}


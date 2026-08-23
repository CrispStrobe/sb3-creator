// Loading the vendored downstream extension snapshots.
//
// A cross-repo gate must not be able to skip. Before this helper existed, the
// conformance test located sibling checkouts by walking `../../` and carried
// `skip: !source && 'file not found'` — so in CI, which clones one repo, five of
// its seven tests skipped and the run was green. See test/STC12-CONFORMANCE-FINDING.md.
//
// Everything here therefore THROWS on a missing or unattributed input. There is
// no branch that quietly does less work.
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCES, locateLive, sha256 } from '../../scripts/vendor-downstream-extensions.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const DOWNSTREAM = resolve(here, '..', 'fixtures', 'downstream');

const manifestPath = join(DOWNSTREAM, 'MANIFEST.json');
if (!existsSync(manifestPath)) {
    throw new Error(
        `test/fixtures/downstream/MANIFEST.json is missing. The conformance gate compares ` +
        `against vendored copies of the extensions other repos ship; without them it would ` +
        `have nothing to compare and would silently pass. Regenerate with ` +
        `\`node scripts/vendor-downstream-extensions.mjs\` beside the sibling checkouts.`);
}
export const MANIFEST = JSON.parse(readFileSync(manifestPath, 'utf8'));

/** Strip the `module.exports = makeExt(`…`)` wrapper lite's bundled copies use. */
export function unwrap (text, wrapper) {
    if (!wrapper) return text;
    const m = text.match(/makeExt\(`([\s\S]*)`\);?\s*$/);
    if (!m) throw new Error(`expected a ${wrapper}(\`…\`) wrapper but found none`);
    return m[1];
}

/**
 * Every vendored snapshot, as { name, source, entry, text, inner, live }.
 * `live` is the sibling checkout's copy when this machine has one, else null —
 * an extra, never a precondition.
 */
export function snapshots () {
    return SOURCES.map((source) => {
        const file = join(DOWNSTREAM, `${source.name}.js`);
        if (!existsSync(file)) {
            throw new Error(
                `vendored snapshot ${source.name}.js is missing from test/fixtures/downstream/. ` +
                `A cross-repo comparison with no second side is not a comparison — this fails ` +
                `rather than skips. Regenerate with \`node scripts/vendor-downstream-extensions.mjs\`.`);
        }
        const entry = MANIFEST.snapshots?.[source.name];
        if (!entry) throw new Error(`MANIFEST.json has no entry for ${source.name}`);
        const text = readFileSync(file, 'utf8');
        if (sha256(text) !== entry.sha256) {
            throw new Error(
                `${source.name}.js does not match the sha256 recorded in MANIFEST.json. The ` +
                `snapshot was edited by hand instead of re-vendored, so it no longer stands for ` +
                `anything that ships.`);
        }
        // A gap may be recorded, but never anonymously: whoever records one has to
        // say where the fix is, or the record rots into a permanent exemption.
        const missing = entry.expectedMissing || [];
        if (missing.length > 0 && !entry.pendingFix) {
            throw new Error(
                `${source.name}: MANIFEST.json records expectedMissing ${JSON.stringify(missing)} ` +
                `but no \`pendingFix\`. A known cross-repo gap must name the branch or issue that ` +
                `closes it.`);
        }
        let live = null;
        try { live = locateLive(source); } catch { live = null; }
        return { name: source.name, source, entry, text, inner: unwrap(text, source.wrapper), live };
    });
}

/** Run an extension source in a minimal Scratch shim and return getInfo(). */
export function loadExtension (source, label) {
    const registered = [];
    const Scratch = {
        BlockType: { COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean', HAT: 'hat' },
        ArgumentType: { STRING: 'string', NUMBER: 'number', BOOLEAN: 'boolean', COLOR: 'color' },
        extensions: { register (ext) { registered.push(ext); } },
        translate: (obj) => obj.default || obj,
        vm: { runtime: { stc: {
            pins: [{ name: 'P1_0', activeLow: false }], ports: [], parts: [],
            tables: [{ name: 'font', values: [0x3F] }]
        } } }
    };
    new Function('Scratch', source)(Scratch);
    if (registered.length === 0) throw new Error(`${label}: extension registered nothing`);
    return registered[0].getInfo();
}

export const blocksByOpcode = (info) => Object.fromEntries(
    info.blocks.filter((b) => typeof b === 'object').map((b) => [b.opcode, b]));

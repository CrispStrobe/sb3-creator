/** The Lehrpfad manifest: every station's example exists, every trail
 *  and chapter is bilingual, interludes carry both languages. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { corpusFloor } from './helpers/corpus-floor.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cur = JSON.parse(readFileSync(join(here, '../examples/curriculum.json'), 'utf8'));
const ids = new Set(JSON.parse(readFileSync(join(here, '../examples/index.json'), 'utf8')).map(e => e.id));

// MEASURED 2026-08-29 (direct count; re-measured because the 2026-08-23 figure
// below had gone stale in the one place it mattered): 5 trails, 15 chapters,
// 53 stations, and 310 index entries — the index grew from 274 while the floor
// of 250 stayed put, so it now sits at 80.6 % of actual rather than 91.2 %.
// A measurement recorded once and never revisited is how a floor stops being a
// floor; that is this document's own opening story, and it had happened here.
// Every assertion in this file lives inside `for (const t of cur.trails)`, so a
// curriculum.json that lost its trails — or grew a differently named top-level
// key — makes the whole file pass having checked nothing.
corpusFloor('curriculum stations', () => cur.trails.reduce(
    (n, t) => n + (t.chapters || []).reduce((m, c) => m + (c.stations || []).length, 0), 0), 45,
    'Every check here iterates trails -> chapters -> stations; with none, none run.');
// MEASURED 2026-08-29 (direct count of examples/index.json): 310 unique ids,
// against 274 when this floor was last looked at. See the note above the block.
corpusFloor('example ids the curriculum is checked against', () => ids.size, 250,
    'Station targets are validated against examples/index.json; an empty id set accepts anything.');

test('every station example exists in the index', () => {
    for (const t of cur.trails) for (const ch of t.chapters) for (const st of ch.stations) {
        if (st.example) assert.ok(ids.has(st.example), `${t.id}: unknown example ${st.example}`);
    }
});

test('trails, chapters and narrative are bilingual', () => {
    for (const t of cur.trails) {
        assert.ok(t.title.en && t.title.de, t.id);
        for (const ch of t.chapters) {
            assert.ok(ch.title.en && ch.title.de, `${t.id} chapter`);
            for (const st of ch.stations) {
                if (st.interlude) assert.ok(st.interlude.en && st.interlude.de, `${t.id} interlude`);
                if (st.lead) assert.ok(st.lead.en && st.lead.de, `${t.id}/${st.example} lead`);
            }
        }
    }
});

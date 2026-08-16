/** The Lehrpfad manifest: every station's example exists, every trail
 *  and chapter is bilingual, interludes carry both languages. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cur = JSON.parse(readFileSync(join(here, '../examples/curriculum.json'), 'utf8'));
const ids = new Set(JSON.parse(readFileSync(join(here, '../examples/index.json'), 'utf8')).map(e => e.id));

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

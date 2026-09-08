// N2e — bounded signed-16 list storage for the i8086 C route.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const emit = (source, mutate) => {
    const creator = new SB3Creator();
    creator.parse(source);
    if (mutate) mutate(creator.project);
    const generated = creator.generateC();
    return {creator, code: typeof generated === 'string' ? generated : generated.code};
};

const LIST_PROGRAM = `DEVICE i8086
PIN led = P1.0 OUTPUT
SPRITE Cat:
  WHEN flag clicked:
    delete all of readings
    add 10 to readings
    insert 5 at 1 of readings
    replace item 2 of readings with 20
    set value to (item 2 of readings)
    delete 1 of readings
    print value
`;

test('i8086 numeric lists use bounded storage and checked one-based helpers', () => {
    const {code, creator} = emit(LIST_PROGRAM);
    assert.doesNotMatch(code, /No C emitted/);
    assert.match(code, /#define BW_LIST_CAPACITY 32u/);
    assert.match(code, /static int bw_list_.*_data\[32\]/);
    assert.match(code, /static unsigned bw_list_.*_len = 0u/);
    assert.match(code, /if \(index < 1 \|\| \(unsigned\)index > len\) return 0/);
    assert.match(code, /bw_list_add\([^\n]+, 10\);/);
    assert.match(code, /bw_list_insert\([^\n]+, 1, 5\);/);
    assert.match(code, /bw_list_replace\([^\n]+, 2, 20\);/);
    assert.match(code, /bw_list_item\([^\n]+, 2\)/);
    assert.match(code, /bw_list_delete\([^\n]+, 1\);/);
    assert.match(code, /bw_list_overflow\(\)/,
        'a full list must trap rather than silently drop an add/insert');
    assert.deepEqual(creator._cListRefused, []);
});

test('same-named sprite lists receive distinct prefix-safe storage', () => {
    const {code} = emit(LIST_PROGRAM, project => {
        const stage = project.targets.find(target => target.isStage);
        stage.lists['stage-readings'] = ['readings', []];
    });
    const names = [...code.matchAll(/^static int (bw_list_[A-Za-z0-9_]+)_data\[32\]/gm)].map(match => match[1]);
    assert.equal(names.length, 2);
    assert.equal(new Set(names).size, 2, 'sprite-local list backing arrays collided');
    const local = names.find(name => /s0/.test(name));
    assert.ok(local, `sprite prefix missing from ${names.join(', ')}`);
    assert.match(code, new RegExp(`bw_list_add\\(${local}_data, &${local}_len`));
});

test('numeric-list storage refuses the explicit aggregate .COM data ceiling', () => {
    const {code} = emit(LIST_PROGRAM, project => {
        const stage = project.targets.find(target => target.isStage);
        for (let i = 0; i < 16; i++) stage.lists[`extra-${i}`] = [`extra ${i}`, []];
    });
    assert.match(code, /No C emitted/);
    assert.match(code, /17 lists need 1122 bytes; the i8086 C list-state ceiling is 990 bytes/);
});

test('an oversized or non-numeric list refuses instead of truncating or coercing', () => {
    const tooLong = emit(LIST_PROGRAM, project => {
        const list = Object.values(project.targets.find(target => target.name === 'Cat').lists)[0];
        list[1] = Array.from({length: 33}, (_, i) => i);
    }).code;
    assert.match(tooLong, /starts with 33 items; the i8086 C capacity is 32/);
    assert.match(tooLong, /No C emitted/);

    const text = emit(LIST_PROGRAM.replace('add 10 to readings', 'add "not numeric" to readings')).code;
    assert.match(text, /non-numeric/);
    assert.match(text, /No C emitted/);
    assert.doesNotMatch(text, /bw_print_num/);
});

test('non-i8086 list lowering remains the pre-N2e comment-only boundary', () => {
    const source = LIST_PROGRAM.replace('DEVICE i8086', 'DEVICE STC12C5A60S2');
    const {code} = emit(source);
    assert.match(code, /no C equivalent for "add 10 to readings"/);
    assert.match(code, /\/\* add 10 to readings \*\//);
    assert.doesNotMatch(code, /BW_LIST_CAPACITY|bw_list_add/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {relativeImportSpecifiers, missingRelativeImports} from '../scripts/lib/relative-imports.mjs';

const scan = source => relativeImportSpecifiers(source, 'example.js');
const missing = (source, tracked = []) => missingRelativeImports({
    root: '/project', file: 'src/main.js', source, tracked: new Set(tracked)
});

test('actual static imports and reexports include side effects without dropping duplicates', () => {
    assert.deepEqual(scan(`
        import './side.js';
        import value from './value.js';
        import {other} from './value.js';
        export {value} from './named.js';
        export * from './all.js';
        import external from 'external';
    `), ['./side.js', './value.js', './value.js', './named.js', './all.js']);
});

test('fixture strings, raw templates, comments and regexp are never interpreted as module source', () => {
    const source = [
        'const fixture = `import {x} from "../world.js"; export {y} from "../no-read.js"; import("./world.js")`;',
        "const text = \"import('../string.js')\";",
        '// import "../line.js";',
        '/* export * from "../block.js"; */',
        'const regex = /import.*from/;',
        'export const retained = 1;'
    ].join('\n');
    assert.deepEqual(scan(source), []);
    assert.deepEqual(missing(source), []);
});

test('actual imports inside template interpolations remain dependencies while raw fixture text does not', () => {
    assert.deepEqual(scan('const text = `import("./fake.js") ${import("./real.js")} ${`nested ${import("../nested.js")}`}`;'),
        ['./real.js', '../nested.js']);
});

test('JSX attributes and text are inert but JSX expression imports are checked', () => {
    const source = `const view = <Panel title={"import('./attribute.js')"}>import("./text.js"){import("./expression.js")}<Child /></Panel>;`;
    assert.deepEqual(relativeImportSpecifiers(source, 'view.jsx'), ['./expression.js']);
    assert.deepEqual(missing(source).map(problem => problem.spec), ['./expression.js']);
});

test('literal dynamic imports include cooked strings and constant templates, not unknown expressions', () => {
    assert.deepEqual(scan('import("./\\u0061.js"); import(`./b.js`); import("./" + name); import(`./${name}.js`);'),
        ['./a.js', './b.js']);
    assert.deepEqual(scan('const bag={import(value){return value}}; bag.import("./method.js");'), []);
});

test('real missing imports still fail inside dead branches and beside misleading fixture strings', () => {
    const source = 'const fixture=`import "./exists.js"`; if(false){import("./absent.js")} export * from "../missing.js";';
    assert.deepEqual(missing(source, ['src/exists.js']), [
        {file: 'src/main.js', spec: './absent.js', expected: 'src/absent.js'},
        {file: 'src/main.js', spec: '../missing.js', expected: 'missing.js'}
    ]);
    for (const directive of [
        '/* eslint "imports/collect": "off" */',
        '/* eslint-disable imports/collect */',
        '// eslint-disable-next-line imports/collect'
    ]) {
        const actual = directive + '\nimport "./missing-static.js"; import("./missing-dynamic.js");';
        assert.deepEqual(scan(actual), ['./missing-static.js', './missing-dynamic.js'], directive);
        assert.deepEqual(missing(actual).map(problem => problem.spec), ['./missing-static.js', './missing-dynamic.js'], directive);
    }
});

test('tracked membership retains literal extension and directory resolution without trusting disk existence', () => {
    const source = 'import "./exact";import "./suffix";import "./directory";import "./unstaged.js";';
    assert.deepEqual(missing(source, ['src/exact', 'src/suffix.mjs', 'src/directory/index.js']), [
        {file: 'src/main.js', spec: './unstaged.js', expected: 'src/unstaged.js'}
    ]);
    assert.equal(missing('import "./deleted.js";', []).length, 1);
});

test('parse failures refuse inspection and CommonJS syntax retains actual dynamic imports', () => {
    assert.throws(() => scan('import {broken from "./missing.js"'), SyntaxError);
    assert.throws(() => relativeImportSpecifiers('const node=<Broken>;', 'view.jsx'), SyntaxError);
    assert.deepEqual(relativeImportSpecifiers('if(flag)return; import("./cjs.js");', 'example.cjs'), ['./cjs.js']);
});

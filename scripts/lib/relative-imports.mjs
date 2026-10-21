// Parse source only: never transform, import or execute the inspected module.
import {Linter} from 'eslint';
import {dirname, relative, resolve} from 'node:path';

const linter = new Linter({configType: 'flat'});
export const RELATIVE_IMPORT_CANDIDATES = Object.freeze([
    '', '.js', '.mjs', '.cjs', '.jsx', '/index.js', '/index.mjs'
]);

/** Actual import syntax, including executable JSX/template interpolations.
 * Raw fixture strings, comments, regexp and template text are not dependencies.
 * Unknown dynamic expressions stay outside this literal-relative-import gate.
 */
export function relativeImportSpecifiers(source, filename = 'input.js') {
    const result = [];
    const collect = node => {
        let value;
        if (node?.type === 'Literal' && typeof node.value === 'string') value = node.value;
        else if (node?.type === 'TemplateLiteral' && node.expressions.length === 0)
            value = node.quasis[0].value.cooked;
        if (typeof value === 'string' && value.startsWith('.')) result.push(value);
    };
    // Inline configuration only; Linter.verify never discovers repository or
    // user configuration or inspected-source rule directives. Espree is ESLint's existing supported JSX parser.
    const messages = linter.verify(source, [{
        files: ['**/*.{js,mjs,cjs,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: filename.endsWith('.cjs') ? 'commonjs' : 'module',
            parserOptions: {ecmaFeatures: {jsx: true}}
        },
        plugins: {imports: {rules: {collect: {
            meta: {schema: []},
            create: () => ({
                ImportDeclaration: node => collect(node.source),
                ExportNamedDeclaration: node => collect(node.source),
                ExportAllDeclaration: node => collect(node.source),
                ImportExpression: node => collect(node.source)
            })
        }}}},
        rules: {'imports/collect': 'error'}
    }], {allowInlineConfig: false, filename: filename.endsWith('.cjs') ? 'dependency-input.cjs' : 'dependency-input.jsx'});
    if (messages.length) {
        const first = messages[0];
        throw new SyntaxError(`${filename}:${first.line ?? 0}:${first.column ?? 0}: ${first.message}`);
    }
    return result;
}

/** Keep the original tracked/index membership and suffix resolution contract. */
export function missingRelativeImports({root, file, source, tracked}) {
    const problems = [];
    for (const spec of relativeImportSpecifiers(source, file)) {
        const base = resolve(root, dirname(file), spec);
        const found = RELATIVE_IMPORT_CANDIDATES.some(ext =>
            tracked.has(relative(root, base + ext).split('\\').join('/')));
        if (!found) problems.push({file, spec, expected: relative(root, base)});
    }
    return problems;
}

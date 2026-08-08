// The C runtime that host-target programs are emitted against.
//
// There are two C targets, and they have nothing in common but the language:
//
//   device C  — bare metal for the STC12/8051. 16-bit ints, no heap, no strings,
//               no sprites. A `move 10 steps` block is meaningless there and is
//               reported as such. `generateC` has always done this.
//   host C    — a portable C99 program that runs the project the way
//               `generatePython` does: sprites, lists, strings, dynamic values,
//               against a shim you can swap for a real renderer.
//
// Python gets its totality for free from `__getattr__`: any Scratch method the
// emitter invents resolves to a no-op returning 0, so `generatePython` never has
// to know the full block surface. C has no such escape, so the shim has to
// DECLARE every method — and that is exactly why it is generated here from
// `OP_TO_SCRATCH`, the same table that drives the Python and JavaScript targets.
// Coverage is then total by construction: a block that has a `scratch.<method>()`
// spelling in one target cannot fail to have a `scratch_<method>()` in this one.
//
// Values are a tagged union rather than a C type per block, because Scratch's are:
// `join`, `letter of` and `=` all have to accept a number where a string is meant
// and vice versa, with Scratch's own coercion rules (§ bw_cmp below).

import { OP_TO_SCRATCH } from './scratchRuntime.js';

// say/think exist at two arities (with and without a duration). C has no
// overloading, so the two-argument forms get their own names, and the emitter
// picks by argument count.
const ARITY_SUFFIX = { say: 'say_for', think: 'think_for' };

/** `scratch.<method>` as a C identifier, disambiguated by arity where needed. */
export function cShimName(method, argc) {
    if (argc >= 2 && ARITY_SUFFIX[method]) return 'scratch_' + ARITY_SUFFIX[method];
    return 'scratch_' + method;
}

/** Every shim signature the table implies: [{name, argc}], de-duplicated. */
export function shimSignatures() {
    const seen = new Map();
    for (const e of Object.values(OP_TO_SCRATCH)) {
        const argc = (e.gen || []).length;
        const name = cShimName(e.m, argc);
        // Keep the widest arity seen for a given C name; `say`/`say_for` are
        // already separated, so this only guards against table edits.
        if (!seen.has(name) || seen.get(name) < argc) seen.set(name, argc);
    }
    return [...seen].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([name, argc]) => ({ name, argc }));
}

// The fixed part: values, coercion, lists. Kept as one string so the generated
// program is self-contained — the same choice generatePython makes with its
// `_Scratch` class, and the reason either can be pasted into a compiler and run.
const CORE = `/* ---- values ---------------------------------------------------------------
 * A Scratch value is a number or a string, and blocks coerce freely between
 * them. Strings come out of a bump arena that is never freed: generated
 * programs are short-lived, and a refcount would be a lie about how carefully
 * this is managed. Swap the arena for a real allocator if that stops being true.
 */
typedef struct { int is_str; double n; const char *s; } bw_val;

static char bw_arena[1 << 16];
static size_t bw_arena_used = 0;

static const char *bw_intern(const char *src, size_t len) {
    if (bw_arena_used + len + 1 > sizeof bw_arena) return "";   /* out of arena */
    char *dst = bw_arena + bw_arena_used;
    memcpy(dst, src, len);
    dst[len] = 0;
    bw_arena_used += len + 1;
    return dst;
}

static inline bw_val bw_num(double n) { bw_val v; v.is_str = 0; v.n = n; v.s = 0; return v; }
static inline bw_val bw_str(const char *s) { bw_val v; v.is_str = 1; v.n = 0; v.s = s; return v; }
static inline bw_val bw_bool(int b) { return bw_num(b ? 1 : 0); }

/* Number coercion: a non-numeric string is 0, which is Scratch's rule. */
static inline double bw_n(bw_val v) {
    if (!v.is_str) return v.n;
    if (!v.s || !*v.s) return 0;
    char *end;
    double d = strtod(v.s, &end);
    while (*end == ' ') end++;
    return *end ? 0 : d;
}

/* String coercion. Integers print without a decimal point, as Scratch shows them. */
static const char *bw_s(bw_val v) {
    if (v.is_str) return v.s ? v.s : "";
    char buf[40];
    if (v.n == (double)(long long)v.n) snprintf(buf, sizeof buf, "%lld", (long long)v.n);
    else snprintf(buf, sizeof buf, "%g", v.n);
    return bw_intern(buf, strlen(buf));
}
`;

const NUMERIC = `/* Does this value look like a number? Decides whether = compares numerically. */
static inline int bw_numeric(bw_val v) {
    if (!v.is_str) return 1;
    if (!v.s || !*v.s) return 0;
    char *end;
    strtod(v.s, &end);
    while (*end == ' ') end++;
    return !*end;
}
`;

const CMP = `/* Scratch comparison: numeric when both sides look numeric, else
 * case-insensitive string order. Returns <0, 0 or >0. */
static inline int bw_cmp(bw_val a, bw_val b) {
    if (bw_numeric(a) && bw_numeric(b)) {
        double x = bw_n(a), y = bw_n(b);
        return x < y ? -1 : (x > y ? 1 : 0);
    }
    const char *p = bw_s(a), *q = bw_s(b);
    while (*p && *q) {
        int c = tolower((unsigned char)*p) - tolower((unsigned char)*q);
        if (c) return c;
        p++; q++;
    }
    return (int)((unsigned char)*p) - (int)((unsigned char)*q);
}
`;

const JOIN = `static inline bw_val bw_join(bw_val a, bw_val b) {
    const char *p = bw_s(a), *q = bw_s(b);
    size_t la = strlen(p), lb = strlen(q);
    if (bw_arena_used + la + lb + 1 > sizeof bw_arena) return bw_str("");
    char *dst = bw_arena + bw_arena_used;
    memcpy(dst, p, la); memcpy(dst + la, q, lb); dst[la + lb] = 0;
    bw_arena_used += la + lb + 1;
    return bw_str(dst);
}
`;

const LETTER = `static inline bw_val bw_letter(bw_val s, bw_val i) {
    const char *p = bw_s(s);
    long k = (long)bw_n(i);
    if (k < 1 || (size_t)k > strlen(p)) return bw_str("");
    return bw_str(bw_intern(p + k - 1, 1));
}
`;

const LENGTH = `static inline bw_val bw_length(bw_val s) { return bw_num((double)strlen(bw_s(s))); }
`;

const CONTAINS = `static inline bw_val bw_contains(bw_val hay, bw_val needle) {
    const char *h = bw_s(hay), *n = bw_s(needle);
    size_t ln = strlen(n);
    if (!ln) return bw_bool(1);
    for (; *h; h++) {
        size_t i = 0;
        while (i < ln && h[i] && tolower((unsigned char)h[i]) == tolower((unsigned char)n[i])) i++;
        if (i == ln) return bw_bool(1);
    }
    return bw_bool(0);
}
`;

const MOD = `/* Scratch's mod follows the sign of the divisor, unlike C's fmod. */
static inline bw_val bw_mod(bw_val a, bw_val b) {
    double x = bw_n(a), y = bw_n(b);
    if (y == 0) return bw_num(0);
    double r = fmod(x, y);
    if (r != 0 && ((r < 0) != (y < 0))) r += y;
    return bw_num(r);
}
`;

const RANDOM = `static inline bw_val bw_random(bw_val a, bw_val b) {
    double lo = bw_n(a), hi = bw_n(b);
    if (lo > hi) { double t = lo; lo = hi; hi = t; }
    /* Integer range unless either bound was written with a fraction, as in Scratch. */
    if (lo == (long)lo && hi == (long)hi)
        return bw_num(lo + (double)(rand() % (long)(hi - lo + 1)));
    return bw_num(lo + (hi - lo) * ((double)rand() / (double)RAND_MAX));
}
`;

const LIST = `/* ---- lists ---------------------------------------------------------------
 * Scratch lists are 1-based and silently ignore out-of-range writes. Both are
 * modelled here rather than corrected, because a project that relies on the
 * behaviour has to keep working.
 */
typedef struct { bw_val *v; int n, cap; } bw_list;

static inline void bw_list_grow(bw_list *l, int need) {
    if (need <= l->cap) return;
    int cap = l->cap ? l->cap * 2 : 8;
    while (cap < need) cap *= 2;
    l->v = (bw_val *)realloc(l->v, (size_t)cap * sizeof(bw_val));
    l->cap = cap;
}
static inline void bw_list_add(bw_list *l, bw_val x) { bw_list_grow(l, l->n + 1); l->v[l->n++] = x; }
static inline void bw_list_delete(bw_list *l, int i) {
    if (i < 1 || i > l->n) return;
    memmove(l->v + i - 1, l->v + i, (size_t)(l->n - i) * sizeof(bw_val));
    l->n--;
}
static inline void bw_list_delete_all(bw_list *l) { l->n = 0; }
static inline void bw_list_insert(bw_list *l, int i, bw_val x) {
    if (i < 1 || i > l->n + 1) return;
    bw_list_grow(l, l->n + 1);
    memmove(l->v + i, l->v + i - 1, (size_t)(l->n - i + 1) * sizeof(bw_val));
    l->v[i - 1] = x; l->n++;
}
static inline void bw_list_replace(bw_list *l, int i, bw_val x) { if (i >= 1 && i <= l->n) l->v[i - 1] = x; }
static inline bw_val bw_list_item(bw_list *l, int i) { return (i >= 1 && i <= l->n) ? l->v[i - 1] : bw_str(""); }
static inline bw_val bw_list_length(bw_list *l) { return bw_num((double)l->n); }
static inline bw_val bw_list_contains(bw_list *l, bw_val x) {
    for (int i = 0; i < l->n; i++) if (bw_cmp(l->v[i], x) == 0) return bw_bool(1);
    return bw_bool(0);
}
static inline bw_val bw_list_index(bw_list *l, bw_val x) {
    for (int i = 0; i < l->n; i++) if (bw_cmp(l->v[i], x) == 0) return bw_num(i + 1);
    return bw_num(0);
}
`;

// The runtime is split into chunks so a program carries only what it calls:
// clang treats an unused `static inline` in a .c file as a warning, so shipping
// all of it would make -Werror unusable for a two-block project. `deps` is the
// transitive part -- bw_cmp needs bw_numeric, the list needs bw_cmp.
const CHUNKS = [
    { name: 'core', deps: [], always: true, code: CORE },
    { name: 'bw_numeric', deps: ['core'], code: NUMERIC },
    { name: 'bw_cmp', deps: ['bw_numeric'], code: CMP },
    { name: 'bw_join', deps: ['core'], code: JOIN },
    { name: 'bw_letter', deps: ['core'], code: LETTER },
    { name: 'bw_length', deps: ['core'], code: LENGTH },
    { name: 'bw_contains', deps: ['core'], code: CONTAINS },
    { name: 'bw_mod', deps: ['core'], code: MOD },
    { name: 'bw_random', deps: ['core'], code: RANDOM },
    // The list functions are chunked one by one: a project that only appends
    // must not carry `delete of` and `insert at`.
    ...listChunks(),
];

// Cut a block of C into one entry per `static inline ... bw_foo(` definition,
// keeping each function's own leading comment with it.
function listChunks() {
    const head = LIST.slice(0, LIST.indexOf('static inline void bw_list_grow'));
    const rest = LIST.slice(LIST.indexOf('static inline void bw_list_grow'));
    const pieces = rest.split(/\n(?=static inline )/).filter(Boolean);
    const out = [{ name: 'bw_list_base', deps: ['core'],
                   code: head + pieces[0] + '\n' }];   // typedef + grow
    for (const piece of pieces.slice(1)) {
        const name = (piece.match(/\b(bw_list_\w+)\(/) || [])[1];
        if (!name) continue;
        const deps = ['bw_list_base'];
        if (/bw_cmp\(/.test(piece)) deps.push('bw_cmp');
        out.push({ name, deps, code: piece.trimEnd() + '\n' });
    }
    return out;
}

/** Every chunk whose name the body mentions, plus what those need. */
function neededChunks(body) {
    const want = new Set(CHUNKS.filter((c) => c.always).map((c) => c.name));
    for (const c of CHUNKS) {
        if (c.always) continue;
        const probe = c.name === 'bw_list_base' ? /\bbw_list\b/ : new RegExp('\\b' + c.name + '\\(');
        if (probe.test(body)) want.add(c.name);
    }
    let grew = true;
    while (grew) {
        grew = false;
        for (const c of CHUNKS) {
            if (!want.has(c.name)) continue;
            for (const d of c.deps) if (!want.has(d)) { want.add(d); grew = true; }
        }
    }
    return CHUNKS.filter((c) => want.has(c.name));
}

/**
 * The whole runtime for one generated program: values, lists, and the shim.
 * `used` is the set of shim names the program actually calls; passing it emits
 * only those (plus the handful the runtime itself needs), so a two-line project
 * does not carry 59 stubs. Pass null for all of them.
 */
export function cHostRuntime(body = '', used = null) {
    const out = [];
    for (const chunk of neededChunks(body)) out.push(chunk.code);
    out.push('/* ---- Scratch stage shim ---------------------------------------------------');
    out.push(' * No-ops that report what they were asked to do, so a generated program runs');
    out.push(' * and prints something without a renderer. Replace the bodies to drive one.');
    out.push(' * Generated from the same OP_TO_SCRATCH table as the Python and JS targets,');
    out.push(' * so this list cannot fall behind them.');
    out.push(' */');
    let any = false;
    for (const { name, argc } of shimSignatures()) {
        if (used ? !used.has(name) : !new RegExp('\\b' + name + '\\(').test(body)) continue;
        any = true;
        const params = argc === 0 ? 'void'
            : Array.from({ length: argc }, (_, i) => `bw_val a${i}`).join(', ');
        const say = name === 'scratch_say' || name === 'scratch_think';
        const sayFor = name === 'scratch_say_for' || name === 'scratch_think_for';
        const inner = say ? ' printf("%s\\n", bw_s(a0));'
            : sayFor ? ' printf("%s\\n", bw_s(a0)); (void)a1;'
                : Array.from({ length: argc }, (_, i) => ` (void)a${i};`).join('');
        out.push(`static inline bw_val ${name}(${params}) {${inner} return bw_num(0); }`);
    }
    if (!any) out.length -= 6;      // no shim used: drop the heading too
    out.push('');
    return out.join('\n');
}

/** The headers the runtime above needs. */
export const C_HOST_INCLUDES = ['stdio.h', 'stdlib.h', 'string.h', 'math.h', 'ctype.h'];

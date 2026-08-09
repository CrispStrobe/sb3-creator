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
const TYPE = `/* ---- values ---------------------------------------------------------------
 * A Scratch value is a number or a string, and blocks coerce freely between
 * them. Strings come out of a bump arena that is never freed: generated
 * programs are short-lived, and a refcount would be a lie about how carefully
 * this is managed. Swap the arena for a real allocator if that stops being true.
 */
typedef struct { int is_str; double n; const char *s; } bw_val;
`;

const ARENA = `static char bw_arena[1 << 16];
static size_t bw_arena_used = 0;

static inline const char *bw_intern(const char *src, size_t len) {
    if (bw_arena_used + len + 1 > sizeof bw_arena) return "";   /* out of arena */
    char *dst = bw_arena + bw_arena_used;
    memcpy(dst, src, len);
    dst[len] = 0;
    bw_arena_used += len + 1;
    return dst;
}
`;

const NUM = `static inline bw_val bw_num(double n) { bw_val v; v.is_str = 0; v.n = n; v.s = 0; return v; }
`;
const STR = `static inline bw_val bw_str(const char *s) { bw_val v; v.is_str = 1; v.n = 0; v.s = s; return v; }
`;
const BOOL = `static inline bw_val bw_bool(int b) { return bw_num(b ? 1 : 0); }
`;
const N = `/* Number coercion: a non-numeric string is 0, which is Scratch's rule. */
static inline double bw_n(bw_val v) {
    if (!v.is_str) return v.n;
    if (!v.s || !*v.s) return 0;
    char *end;
    double d = strtod(v.s, &end);
    while (*end == ' ') end++;
    return *end ? 0 : d;
}
`;
const S = `/* String coercion. Integers print without a decimal point, as Scratch shows them. */
static inline const char *bw_s(bw_val v) {
    if (v.is_str) return v.s ? v.s : "";
    char buf[40];
    if (v.n == (double)(long long)v.n) snprintf(buf, sizeof buf, "%lld", (long long)v.n);
    else snprintf(buf, sizeof buf, "%g", v.n);
    return bw_intern(buf, strlen(buf));
}
`;

const CHANGE = `/* \`change x by n\`. A helper rather than inline arithmetic so that the
 * way back can tell it from \`set x to x + n\`, which is a different block. */
static inline void bw_change(bw_val *v, bw_val d) { *v = bw_num(bw_n(*v) + bw_n(d)); }
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

const MULTIPLE = `static inline int bw_multiple(bw_val a, bw_val b) {
    return bw_n(bw_mod(a, b)) == 0;
}
`;

const PI = `/* pi and e are blocks in their own right; as bare literals the way back
 * could not tell them from a number someone typed. */
static inline bw_val bw_pi(void) { return bw_num(3.14159265358979323846); }
`;
const E = `static inline bw_val bw_e(void) { return bw_num(2.71828182845904523536); }
`;

const SUMDIGITS = `/* Planete Maths' \`sum of digits\`: digits only, sign and dot ignored. */
static inline bw_val bw_sumdigits(bw_val x) {
    const char *p = bw_s(x);
    long total = 0;
    for (; *p; p++) if (*p >= '0' && *p <= '9') total += *p - '0';
    return bw_num((double)total);
}
`;

const ARRAYS = `/* ---- Arrays & Vectors extension -------------------------------------------
 * A named-array registry, the C counterpart of the _Arrays class the Python
 * target emits. The 1-D surface is implemented; the 2-D and functional blocks
 * (map/filter/reduce/reshape/transpose) are declared so a program using them
 * still compiles, and the emitter warns when one is actually reached, because
 * a stub that silently returns 0 is how a simulator starts lying.
 */
#define BW_ARRAYS_MAX 32
static struct { const char *name; bw_list v; } bw_arr[BW_ARRAYS_MAX];
static int bw_arr_n = 0;

static inline bw_list *bw_array(bw_val name) {
    const char *n = bw_s(name);
    for (int i = 0; i < bw_arr_n; i++) if (!strcmp(bw_arr[i].name, n)) return &bw_arr[i].v;
    if (bw_arr_n >= BW_ARRAYS_MAX) return &bw_arr[0].v;
    bw_arr[bw_arr_n].name = bw_intern(n, strlen(n));
    bw_arr[bw_arr_n].v.v = 0; bw_arr[bw_arr_n].v.n = 0; bw_arr[bw_arr_n].v.cap = 0;
    return &bw_arr[bw_arr_n++].v;
}

/* \`new array "x" = [1, 2, "three"]\` — the literal arrives as text, as it does
 * on the Python side, so it is parsed here rather than at emit time. */
static inline void bw_array_load(bw_list *l, bw_val text) {
    const char *p = bw_s(text);
    l->n = 0;
    while (*p && *p != '[') p++;
    if (*p == '[') p++;
    while (*p) {
        while (*p == ' ' || *p == ',') p++;
        if (*p == ']' || !*p) break;
        if (*p == '"') {
            const char *start = ++p;
            while (*p && *p != '"') p++;
            bw_list_add(l, bw_str(bw_intern(start, (size_t)(p - start))));
            if (*p == '"') p++;
        } else {
            char *end;
            double d = strtod(p, &end);
            if (end == p) break;
            bw_list_add(l, bw_num(d));
            p = end;
        }
    }
}

static inline bw_val arrays_create1d(bw_val n, bw_val j) { bw_array_load(bw_array(n), j); return bw_num(0); }
static inline bw_val arrays_create(bw_val n) { bw_array(n)->n = 0; return bw_num(0); }
static inline bw_val arrays_create_range(bw_val n, bw_val s, bw_val e) {
    bw_list *l = bw_array(n); l->n = 0;
    for (long i = (long)bw_n(s); i <= (long)bw_n(e); i++) bw_list_add(l, bw_num((double)i));
    return bw_num(0);
}
static inline bw_val arrays_push(bw_val n, bw_val v) { bw_list_add(bw_array(n), v); return bw_num(0); }
static inline bw_val arrays_set(bw_val n, bw_val i, bw_val v) {
    bw_list *l = bw_array(n); long k = (long)bw_n(i);
    if (k >= 0 && k < l->n) l->v[k] = v;            /* 0-based, as the extension is */
    return bw_num(0);
}
static inline bw_val arrays_insert(bw_val n, bw_val i, bw_val v) {
    bw_list_insert(bw_array(n), (int)bw_n(i) + 1, v); return bw_num(0);
}
static inline bw_val arrays_remove(bw_val n, bw_val i) {
    bw_list_delete(bw_array(n), (int)bw_n(i) + 1); return bw_num(0);
}
static inline bw_val arrays_drop(bw_val n) { bw_array(n)->n = 0; return bw_num(0); }
static inline bw_val arrays_get(bw_val n, bw_val i) {
    bw_list *l = bw_array(n); long k = (long)bw_n(i);
    return (k >= 0 && k < l->n) ? l->v[k] : bw_str("");
}
static inline bw_val arrays_pop(bw_val n) {
    bw_list *l = bw_array(n);
    return l->n ? l->v[--l->n] : bw_str("");
}
static inline bw_val arrays_length(bw_val n) { return bw_num((double)bw_array(n)->n); }
static inline bw_val arrays_sum(bw_val n) {
    bw_list *l = bw_array(n); double t = 0;
    for (int i = 0; i < l->n; i++) t += bw_n(l->v[i]);
    return bw_num(t);
}
static inline bw_val arrays_mean(bw_val n) {
    bw_list *l = bw_array(n);
    return l->n ? bw_num(bw_n(arrays_sum(n)) / l->n) : bw_num(0);
}
static inline bw_val arrays_min(bw_val n) {
    bw_list *l = bw_array(n); if (!l->n) return bw_num(0);
    double m = bw_n(l->v[0]);
    for (int i = 1; i < l->n; i++) if (bw_n(l->v[i]) < m) m = bw_n(l->v[i]);
    return bw_num(m);
}
static inline bw_val arrays_max(bw_val n) {
    bw_list *l = bw_array(n); if (!l->n) return bw_num(0);
    double m = bw_n(l->v[0]);
    for (int i = 1; i < l->n; i++) if (bw_n(l->v[i]) > m) m = bw_n(l->v[i]);
    return bw_num(m);
}
static inline bw_val arrays_index_of(bw_val n, bw_val v) {
    bw_list *l = bw_array(n);
    for (int i = 0; i < l->n; i++) if (bw_cmp(l->v[i], v) == 0) return bw_num(i);
    return bw_num(-1);
}
static inline bw_val arrays_contains(bw_val n, bw_val v) {
    return bw_bool(bw_n(arrays_index_of(n, v)) >= 0);
}
/* Matches json.dumps on the Python side, separators and all, so the two
 * targets print the same thing. */
static inline bw_val arrays_to_text(bw_val n) {
    bw_list *l = bw_array(n);
    bw_val out = bw_str("[");
    for (int i = 0; i < l->n; i++) {
        if (i) out = bw_join(out, bw_str(", "));
        out = l->v[i].is_str
            ? bw_join(bw_join(out, bw_str("\\"")), bw_join(l->v[i], bw_str("\\"")))
            : bw_join(out, l->v[i]);
    }
    return bw_join(out, bw_str("]"));
}
`;

const WAIT = `/* A wait is real time, not a busy loop, so a generated program behaves like
 * the project rather than pinning a core. POSIX; swap for Sleep() on Windows. */
static inline void bw_wait(bw_val secs) {
    double d = bw_n(secs);
    if (d <= 0) return;
    struct timespec ts;
    ts.tv_sec = (time_t)d;
    ts.tv_nsec = (long)((d - (double)ts.tv_sec) * 1e9);
    nanosleep(&ts, 0);
}
`;

const ASK = `/* \`ask and wait\` reads a line; \`answer\` then holds it, as in Scratch. */
static inline bw_val bw_ask(bw_val question) {
    static char line[512];
    printf("%s ", bw_s(question));
    fflush(stdout);
    if (!fgets(line, sizeof line, stdin)) return bw_str("");
    size_t n = strlen(line);
    while (n && (line[n - 1] == '\\n' || line[n - 1] == '\\r')) line[--n] = 0;
    return bw_str(bw_intern(line, n));
}
`;

const MATHOP = `/* Scratch's [abs v] of () menu. Trig is in degrees, as the blocks are. */
static inline bw_val bw_mathop(const char *op, bw_val x) {
    double d = bw_n(x);
    if (!strcmp(op, "abs")) return bw_num(fabs(d));
    if (!strcmp(op, "floor")) return bw_num(floor(d));
    if (!strcmp(op, "ceiling")) return bw_num(ceil(d));
    if (!strcmp(op, "sqrt")) return bw_num(sqrt(d));
    if (!strcmp(op, "sin")) return bw_num(sin(d * 3.14159265358979323846 / 180.0));
    if (!strcmp(op, "cos")) return bw_num(cos(d * 3.14159265358979323846 / 180.0));
    if (!strcmp(op, "tan")) return bw_num(tan(d * 3.14159265358979323846 / 180.0));
    if (!strcmp(op, "asin")) return bw_num(asin(d) * 180.0 / 3.14159265358979323846);
    if (!strcmp(op, "acos")) return bw_num(acos(d) * 180.0 / 3.14159265358979323846);
    if (!strcmp(op, "atan")) return bw_num(atan(d) * 180.0 / 3.14159265358979323846);
    if (!strcmp(op, "ln")) return bw_num(log(d));
    if (!strcmp(op, "log")) return bw_num(log10(d));
    if (!strcmp(op, "e ^")) return bw_num(exp(d));
    if (!strcmp(op, "10 ^")) return bw_num(pow(10.0, d));
    return bw_num(fabs(d));
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
    { name: '#type', always: true, code: TYPE },
    { name: 'bw_intern', code: ARENA },
    { name: 'bw_num', code: NUM },
    { name: 'bw_str', code: STR },
    { name: 'bw_bool', code: BOOL },
    { name: 'bw_n', code: N },
    { name: 'bw_s', code: S },
    { name: 'bw_change', code: CHANGE },
    { name: 'bw_numeric', code: NUMERIC },
    { name: 'bw_cmp', code: CMP },
    { name: 'bw_join', code: JOIN },
    { name: 'bw_letter', code: LETTER },
    { name: 'bw_length', code: LENGTH },
    { name: 'bw_contains', code: CONTAINS },
    { name: 'bw_mod', code: MOD },
    { name: 'bw_random', code: RANDOM },
    { name: 'bw_multiple', code: MULTIPLE },
    { name: 'bw_pi', code: PI },
    { name: 'bw_e', code: E },
    { name: 'bw_sumdigits', code: SUMDIGITS },
    { name: 'bw_wait', code: WAIT },
    { name: 'bw_ask', code: ASK },
    { name: 'bw_mathop', code: MATHOP },
    ...listChunks(),
    // after the list chunks: the registry is built on bw_list. Split per
    // function for the same reason the list is — a project that only pushes
    // must not carry `mean` and `index of`.
    ...arrayChunks(),
];

/** ARRAYS, cut into the registry base plus one chunk per operation. */
function arrayChunks() {
    const first = ARRAYS.indexOf('static inline bw_val arrays_create1d');
    const base = ARRAYS.slice(0, first);
    const rest = ARRAYS.slice(first);
    const out = [{ name: 'bw_array', code: base }];
    for (const piece of rest.split(/\n(?=static inline |\/\* )/).filter(Boolean)) {
        const name = (piece.match(/\b(arrays_\w+)\(/) || [])[1];
        if (name) out.push({ name, code: piece.trimEnd() + '\n' });
    }
    return out;
}

// Cut a block of C into one entry per `static inline ... bw_foo(` definition,
// keeping each function's own leading comment with it.
function listChunks() {
    const head = LIST.slice(0, LIST.indexOf('static inline void bw_list_grow'));
    const rest = LIST.slice(LIST.indexOf('static inline void bw_list_grow'));
    const pieces = rest.split(/\n(?=static inline )/).filter(Boolean);
    const out = [{ name: 'bw_list_grow',
                   code: head + pieces[0] + '\n' }];   // typedef + grow
    for (const piece of pieces.slice(1)) {
        const name = (piece.match(/\b(bw_list_\w+)\(/) || [])[1];
        if (!name) continue;
        out.push({ name, code: piece.trimEnd() + '\n' });
    }
    return out;
}

/**
 * The chunks this program needs, by fixed point rather than a dependency list.
 * Start with everything, then repeatedly drop any chunk whose function nobody
 * calls -- not the body, not another surviving chunk. A hand-written `deps`
 * table would be a second copy of the truth, and would go stale the first time
 * a helper stopped calling another. clang counts an unused `static inline` in a
 * .c file as a warning, so this is what lets a two-block project build cleanly
 * under -Werror.
 */
function neededChunks(body) {
    let keep = CHUNKS.slice();
    for (;;) {
        const dropped = [];
        const survivors = keep.filter((c) => {
            if (c.always) return true;
            const others = keep.filter((o) => o !== c).map((o) => o.code).join('\n');
            // One chunk holds the whole arrays registry, so any arrays_* call
            // keeps it; every other chunk is one function and answers to its
            // own name.
            const probe = c.name === 'bw_array'
                ? /\barrays_\w+\s*\(/ : new RegExp('\\b' + c.name + '\\s*\\(');
            if (probe.test(body) || probe.test(others)) return true;
            dropped.push(c);
            return false;
        });
        if (!dropped.length) return keep;
        keep = survivors;
    }
}

/**
 * The whole runtime for one generated program: values, lists, and the shim.
 * `used` is the set of shim names the program actually calls; passing it emits
 * only those (plus the handful the runtime itself needs), so a two-line project
 * does not carry 59 stubs. Pass null for all of them.
 */
export function cHostRuntime(body = '', used = null) {
    // Build the shim first: `scratch_say` calls bw_s, so the pruning below has to
    // see the shim text as well as the program, or a project whose only string
    // coercion happens inside a shim loses the helper it needs.
    const shim = [];
    for (const { name, argc } of [...shimSignatures(), ...STRUCT_SHIMS]) {
        if (used ? !used.has(name) : !new RegExp('\\b' + name + '\\s*\\(').test(body)) continue;
        const params = argc === 0 ? 'void'
            : Array.from({ length: argc }, (_, i) => `bw_val a${i}`).join(', ');
        const say = name === 'scratch_say' || name === 'scratch_think';
        const sayFor = name === 'scratch_say_for' || name === 'scratch_think_for';
        const inner = say ? ' printf("%s\\n", bw_s(a0));'
            : sayFor ? ' printf("%s\\n", bw_s(a0)); (void)a1;'
                : Array.from({ length: argc }, (_, i) => ` (void)a${i};`).join('');
        shim.push(`static inline bw_val ${name}(${params}) {${inner} return bw_num(0); }`);
    }

    const out = [];
    for (const chunk of neededChunks(body + '\n' + shim.join('\n'))) out.push(chunk.code);
    if (shim.length) {
        out.push('/* ---- Scratch stage shim ---------------------------------------------------');
        out.push(' * No-ops that report what they were asked to do, so a generated program runs');
        out.push(' * and prints something without a renderer. Replace the bodies to drive one.');
        out.push(' * Generated from the same OP_TO_SCRATCH table as the Python and JS targets,');
        out.push(' * so this list cannot fall behind them.');
        out.push(' */');
        out.push(...shim);
    }
    out.push('');
    return out.join('\n');
}

// Structural markers (sprite/stage/local/costume/defblock) are not blocks, so they
// are not in OP_TO_SCRATCH -- but Python emits them into the program so the project
// structure round-trips, and `__getattr__` makes them exist for free there. Here they
// have to be declared like everything else.
export const STRUCT_SHIMS = [
    { name: 'scratch_stage', argc: 0 }, { name: 'scratch_sprite', argc: 1 },
    { name: 'scratch_sprite_shape', argc: 2 }, { name: 'scratch_local', argc: 1 },
    { name: 'scratch_local_list', argc: 1 }, { name: 'scratch_costume', argc: 1 },
    { name: 'scratch_sound', argc: 1 }, { name: 'scratch_defblock', argc: 2 },
    { name: 'scratch_global_var', argc: 1 }, { name: 'scratch_global_list', argc: 1 },
];

/** The headers the runtime above needs. */
export const C_HOST_INCLUDES = ['stdio.h', 'stdlib.h', 'string.h', 'math.h', 'ctype.h', 'time.h'];

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
#define BW_NUM  0
#define BW_STR  1
#define BW_LIST 2                     /* reverse/sort/slice/... return one */

struct bw_list_s;
typedef struct { int kind; double n; const char *s; struct bw_list_s *l; } bw_val;

/* Scratch lists are 1-based and silently ignore out-of-range writes; both are
 * modelled rather than corrected, because a project may rely on either. */
typedef struct bw_list_s { bw_val *v; int n, cap; } bw_list;

/* Mutually recursive: a list prints its elements and an element may be a list. */
static inline const char *bw_s(bw_val v);
static const char *bw_list_text(bw_list *l, int json);
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

const NUM = `static inline bw_val bw_num(double n) { bw_val v; v.kind = BW_NUM; v.n = n; v.s = 0; v.l = 0; return v; }
`;
const STR = `static inline bw_val bw_str(const char *s) { bw_val v; v.kind = BW_STR; v.n = 0; v.s = s; v.l = 0; return v; }
`;
const BOOL = `static inline bw_val bw_bool(int b) { return bw_num(b ? 1 : 0); }
`;
const N = `/* Number coercion: a non-numeric string is 0, which is Scratch's rule. */
static inline double bw_n(bw_val v) {
    if (v.kind == BW_NUM) return v.n;
    if (v.kind == BW_LIST) return 0;
    if (!v.s || !*v.s) return 0;
    char *end;
    double d = strtod(v.s, &end);
    while (*end == ' ') end++;
    return *end ? 0 : d;
}
`;
const S = `/* String coercion. Integers print without a decimal point, as Scratch shows them. */
static inline const char *bw_s(bw_val v) {
    if (v.kind == BW_LIST) return bw_list_text(v.l, 0);   /* Python's str(list) */
    if (v.kind == BW_STR) return v.s ? v.s : "";
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
    if (v.kind == BW_NUM) return 1;
    if (v.kind == BW_LIST) return 0;
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
static inline bw_val arrays_to_text(bw_val n) { return bw_str(bw_list_text(bw_array(n), 1)); }

/* The list-valued operations. Each hands back a fresh list rather than mutating
 * the named one, which is what the Python side does and what \`say (reverse of
 * array "v")\` therefore has to print. */
static inline bw_val arrays_reverse(bw_val n) {
    bw_list *src = bw_array(n), *out = bw_new_list();
    for (int i = src->n - 1; i >= 0; i--) bw_list_add(out, src->v[i]);
    return bw_listval(out);
}

static inline bw_val arrays_sort(bw_val n, bw_val order) {
    bw_list *src = bw_array(n), *out = bw_new_list();
    for (int i = 0; i < src->n; i++) bw_list_add(out, src->v[i]);
    int desc = strcmp(bw_s(order), "ascending") != 0;
    for (int i = 1; i < out->n; i++) {            /* insertion sort: lists are small */
        bw_val key = out->v[i];
        int j = i - 1;
        while (j >= 0 && (desc ? bw_cmp(out->v[j], key) < 0 : bw_cmp(out->v[j], key) > 0)) {
            out->v[j + 1] = out->v[j]; j--;
        }
        out->v[j + 1] = key;
    }
    return bw_listval(out);
}

static inline bw_val arrays_slice(bw_val n, bw_val from, bw_val to) {
    bw_list *src = bw_array(n), *out = bw_new_list();
    long a = (long)bw_n(from), b = (long)bw_n(to);
    if (a < 0) a = 0;
    if (b > src->n) b = src->n;
    for (long i = a; i < b; i++) bw_list_add(out, src->v[i]);
    return bw_listval(out);
}

static inline bw_val arrays_flatten(bw_val n) {
    bw_list *src = bw_array(n), *out = bw_new_list();
    for (int i = 0; i < src->n; i++) {
        if (src->v[i].kind == BW_LIST) {
            bw_list *row = src->v[i].l;
            for (int j = 0; j < row->n; j++) bw_list_add(out, row->v[j]);
        } else bw_list_add(out, src->v[i]);
    }
    return bw_listval(out);
}

/* \`[[1, 2], [3, 4]]\` — the same text parser as the 1-D case, one level deeper. */
static const char *bw_array_load2d(bw_list *l, const char *p) {
    l->n = 0;
    while (*p && *p != '[') p++;
    if (*p == '[') p++;
    while (*p) {
        while (*p == ' ' || *p == ',') p++;
        if (*p == ']' || !*p) break;
        if (*p == '[') {
            bw_list *row = bw_new_list();
            p = bw_array_load2d(row, p);
            bw_list_add(l, bw_listval(row));
            continue;
        }
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
    return *p == ']' ? p + 1 : p;
}

static inline bw_val arrays_create2d(bw_val n, bw_val j) {
    bw_array_load2d(bw_array(n), bw_s(j));
    return bw_num(0);
}

static inline bw_val arrays_get2d(bw_val n, bw_val r, bw_val c) {
    bw_list *l = bw_array(n);
    long i = (long)bw_n(r), k = (long)bw_n(c);
    if (i < 0 || i >= l->n || l->v[i].kind != BW_LIST) return bw_str("");
    bw_list *row = l->v[i].l;
    return (k >= 0 && k < row->n) ? row->v[k] : bw_str("");
}

static inline bw_val arrays_set2d(bw_val n, bw_val r, bw_val c, bw_val v) {
    bw_list *l = bw_array(n);
    long i = (long)bw_n(r), k = (long)bw_n(c);
    while (l->n <= i) bw_list_add(l, bw_listval(bw_new_list()));
    if (l->v[i].kind != BW_LIST) l->v[i] = bw_listval(bw_new_list());
    bw_list *row = l->v[i].l;
    while (row->n <= k) bw_list_add(row, bw_num(0));
    row->v[k] = v;
    return bw_num(0);
}

static inline bw_val arrays_transpose(bw_val n) {
    bw_list *l = bw_array(n), *out = bw_new_list();
    int cols = 0;
    for (int i = 0; i < l->n; i++)
        if (l->v[i].kind == BW_LIST && l->v[i].l->n > cols) cols = l->v[i].l->n;
    for (int c = 0; c < cols; c++) {
        bw_list *row = bw_new_list();
        for (int i = 0; i < l->n; i++) {
            if (l->v[i].kind != BW_LIST || c >= l->v[i].l->n) break;   /* zip() stops short */
            bw_list_add(row, l->v[i].l->v[c]);
        }
        if (row->n == l->n) bw_list_add(out, bw_listval(row));
    }
    return bw_listval(out);
}

static bw_list *bw_reshape(bw_list *flat, int *taken, bw_list *dims, int d) {
    bw_list *out = bw_new_list();
    long count = (long)bw_n(dims->v[d]);
    for (long i = 0; i < count; i++) {
        if (d == dims->n - 1) {
            bw_list_add(out, *taken < flat->n ? flat->v[(*taken)++] : bw_num(0));
        } else {
            bw_list_add(out, bw_listval(bw_reshape(flat, taken, dims, d + 1)));
        }
    }
    return out;
}

static void bw_flat_into(bw_list *src, bw_list *dst) {
    for (int i = 0; i < src->n; i++) {
        if (src->v[i].kind == BW_LIST) bw_flat_into(src->v[i].l, dst);
        else bw_list_add(dst, src->v[i]);
    }
}

static inline bw_val arrays_reshape(bw_val n, bw_val shape) {
    bw_list dims = {0, 0, 0};
    bw_array_load(&dims, shape);
    if (!dims.n) return bw_listval(bw_new_list());
    bw_list *flat = bw_new_list();
    bw_flat_into(bw_array(n), flat);
    int taken = 0;
    return bw_listval(bw_reshape(flat, &taken, &dims, 0));
}

/* ---- the lambda subset -----------------------------------------------------
 * map/filter/reduce take their function as text -- "(x) => x * 2" -- and the
 * Python target eval()s it. C cannot, so this is a small recursive-descent
 * evaluator over the subset those blocks actually contain: numbers, string
 * literals, the parameters, ( ), unary -, * / %, + -, comparisons, and && ||.
 * Anything outside that yields 0 and is reported by the emitter rather than
 * guessed at, because a lambda that silently evaluates to 0 would make the C
 * disagree with Python without saying so.
 */
typedef struct {
    const char *p;
    const char *names[2];
    bw_val args[2];
    int argc;
    int failed;
} bw_lam;

static bw_val bw_lam_or(bw_lam *L);

static void bw_lam_ws(bw_lam *L) { while (*L->p == ' ' || *L->p == '\t') L->p++; }

static int bw_lam_eat(bw_lam *L, const char *tok) {
    bw_lam_ws(L);
    size_t n = strlen(tok);
    if (strncmp(L->p, tok, n)) return 0;
    /* \`<\` must not swallow the \`<\` of \`<=\` */
    if ((tok[0] == '<' || tok[0] == '>') && n == 1 && L->p[1] == '=') return 0;
    L->p += n;
    return 1;
}

static bw_val bw_lam_atom(bw_lam *L) {
    bw_lam_ws(L);
    if (*L->p == '(') {
        L->p++;
        bw_val v = bw_lam_or(L);
        bw_lam_ws(L);
        if (*L->p == ')') L->p++; else L->failed = 1;
        return v;
    }
    if (*L->p == '-') { L->p++; return bw_num(-bw_n(bw_lam_atom(L))); }
    if (*L->p == '"' || *L->p == 0x27) {
        char q = *L->p++;
        const char *start = L->p;
        while (*L->p && *L->p != q) L->p++;
        bw_val v = bw_str(bw_intern(start, (size_t)(L->p - start)));
        if (*L->p == q) L->p++;
        return v;
    }
    if ((*L->p >= '0' && *L->p <= '9') || *L->p == '.') {
        char *end;
        double d = strtod(L->p, &end);
        L->p = end;
        return bw_num(d);
    }
    const char *start = L->p;
    while ((*L->p >= 'a' && *L->p <= 'z') || (*L->p >= 'A' && *L->p <= 'Z')
           || (*L->p >= '0' && *L->p <= '9') || *L->p == '_') L->p++;
    size_t len = (size_t)(L->p - start);
    for (int i = 0; i < L->argc; i++)
        if (strlen(L->names[i]) == len && !strncmp(L->names[i], start, len)) return L->args[i];
    L->failed = 1;
    return bw_num(0);
}

static bw_val bw_lam_mul(bw_lam *L) {
    bw_val v = bw_lam_atom(L);
    for (;;) {
        bw_lam_ws(L);
        if (bw_lam_eat(L, "*")) v = bw_num(bw_n(v) * bw_n(bw_lam_atom(L)));
        else if (bw_lam_eat(L, "/")) { double d = bw_n(bw_lam_atom(L)); v = bw_num(d ? bw_n(v) / d : 0); }
        else if (bw_lam_eat(L, "%")) v = bw_mod(v, bw_lam_atom(L));
        else return v;
    }
}

static bw_val bw_lam_add(bw_lam *L) {
    bw_val v = bw_lam_mul(L);
    for (;;) {
        bw_lam_ws(L);
        if (bw_lam_eat(L, "+")) {
            bw_val r = bw_lam_mul(L);
            /* Python's + is concatenation when either side is a string. */
            v = (v.kind == BW_STR || r.kind == BW_STR) ? bw_join(v, r) : bw_num(bw_n(v) + bw_n(r));
        } else if (bw_lam_eat(L, "-")) v = bw_num(bw_n(v) - bw_n(bw_lam_mul(L)));
        else return v;
    }
}

static bw_val bw_lam_cmp(bw_lam *L) {
    bw_val v = bw_lam_add(L);
    bw_lam_ws(L);
    if (bw_lam_eat(L, "==")) return bw_bool(bw_cmp(v, bw_lam_add(L)) == 0);
    if (bw_lam_eat(L, "!=")) return bw_bool(bw_cmp(v, bw_lam_add(L)) != 0);
    if (bw_lam_eat(L, "<=")) return bw_bool(bw_cmp(v, bw_lam_add(L)) <= 0);
    if (bw_lam_eat(L, ">=")) return bw_bool(bw_cmp(v, bw_lam_add(L)) >= 0);
    if (bw_lam_eat(L, "<")) return bw_bool(bw_cmp(v, bw_lam_add(L)) < 0);
    if (bw_lam_eat(L, ">")) return bw_bool(bw_cmp(v, bw_lam_add(L)) > 0);
    return v;
}

static bw_val bw_lam_and(bw_lam *L) {
    bw_val v = bw_lam_cmp(L);
    while (bw_lam_eat(L, "&&") || bw_lam_eat(L, "and")) {
        bw_val r = bw_lam_cmp(L);
        v = bw_bool(bw_n(v) != 0 && bw_n(r) != 0);
    }
    return v;
}

static bw_val bw_lam_or(bw_lam *L) {
    bw_val v = bw_lam_and(L);
    while (bw_lam_eat(L, "||") || bw_lam_eat(L, "or")) {
        bw_val r = bw_lam_and(L);
        v = bw_bool(bw_n(v) != 0 || bw_n(r) != 0);
    }
    return v;
}

/* Apply "(a, b) => body" to up to two arguments. */
static bw_val bw_lam_call(bw_val fn, bw_val a0, bw_val a1, int argc) {
    const char *text = bw_s(fn);
    const char *arrow = strstr(text, "=>");
    if (!arrow) return bw_num(0);
    bw_lam L;
    L.argc = 0; L.failed = 0;
    /* parameter list, with or without its parentheses */
    const char *q = text;
    while (q < arrow && L.argc < 2) {
        while (q < arrow && (*q == ' ' || *q == '(' || *q == ',')) q++;
        const char *start = q;
        while (q < arrow && *q != ' ' && *q != ',' && *q != ')') q++;
        if (q > start) {
            L.names[L.argc] = bw_intern(start, (size_t)(q - start));
            L.argc++;
        }
        while (q < arrow && (*q == ')' || *q == ' ')) q++;
    }
    L.args[0] = a0; L.args[1] = a1;
    if (argc < L.argc) L.argc = argc;
    L.p = arrow + 2;
    bw_val v = bw_lam_or(&L);
    return L.failed ? bw_num(0) : v;
}

static inline bw_val arrays_map(bw_val n, bw_val fn) {
    bw_list *src = bw_array(n), *out = bw_new_list();
    for (int i = 0; i < src->n; i++) bw_list_add(out, bw_lam_call(fn, src->v[i], bw_num(0), 1));
    return bw_listval(out);
}

static inline bw_val arrays_filter(bw_val n, bw_val fn) {
    bw_list *src = bw_array(n), *out = bw_new_list();
    for (int i = 0; i < src->n; i++)
        if (bw_n(bw_lam_call(fn, src->v[i], bw_num(0), 1)) != 0) bw_list_add(out, src->v[i]);
    return bw_listval(out);
}

static inline bw_val arrays_reduce(bw_val n, bw_val fn, bw_val init) {
    bw_list *src = bw_array(n);
    bw_val acc = init;
    for (int i = 0; i < src->n; i++) acc = bw_lam_call(fn, acc, src->v[i], 2);
    return acc;
}

`;

const LISTTEXT = `/* A list as text. \`json\` picks the extension's \`as text\` form, which is
 * json.dumps on the Python side ("a"); everything else is Python's str(list),
 * which quotes strings with apostrophes ('a'). Two spellings, one function,
 * because the two targets have to print the same bytes. */
static const char *bw_list_text(bw_list *l, int json) {
    char buf[4096];
    size_t k = 0;
    buf[k++] = '[';
    for (int i = 0; i < l->n && k < sizeof buf - 80; i++) {
        if (i) { buf[k++] = ','; buf[k++] = ' '; }
        bw_val e = l->v[i];
        if (e.kind == BW_LIST) {
            const char *inner = bw_list_text(e.l, json);
            size_t n = strlen(inner);
            if (k + n >= sizeof buf - 8) break;
            memcpy(buf + k, inner, n); k += n;
        } else if (e.kind == BW_STR) {
            const char *t = e.s ? e.s : "";
            size_t n = strlen(t);
            if (k + n >= sizeof buf - 8) break;
            buf[k++] = json ? '"' : 0x27;
            memcpy(buf + k, t, n); k += n;
            buf[k++] = json ? '"' : 0x27;
        } else {
            const char *t = bw_s(e);
            size_t n = strlen(t);
            if (k + n >= sizeof buf - 8) break;
            memcpy(buf + k, t, n); k += n;
        }
    }
    buf[k++] = ']';
    buf[k] = 0;
    return bw_intern(buf, k);
}

`;

const NEWLIST = `static inline bw_list *bw_new_list(void) {
    bw_list *l = (bw_list *)calloc(1, sizeof(bw_list));
    return l;
}

static inline bw_val bw_listval(bw_list *l) {
    bw_val v; v.kind = BW_LIST; v.n = 0; v.s = 0; v.l = l; return v;
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

const LIST = `static inline void bw_list_grow(bw_list *l, int need) {
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
    { name: 'bw_list_text', code: LISTTEXT },
    { name: 'bw_new_list', code: NEWLIST },
    ...arrayChunks(),
];

/** ARRAYS, cut into the registry base plus one chunk per operation. */
function arrayChunks() {
    const first = ARRAYS.indexOf('static inline bw_val arrays_create1d');
    const base = ARRAYS.slice(0, first);
    const rest = ARRAYS.slice(first);
    const out = [{ name: 'bw_array', code: base }];
    let prefix = '';
    for (const piece of rest.split(/\n(?=static inline |static \w|\/\* )/).filter(Boolean)) {
        // Name a piece by the first function it defines, whatever that is: the
        // registry has private helpers (bw_array_load2d, bw_reshape) as well as
        // arrays_* entry points, and dropping the ones that did not match an
        // arrays_ name is how create2d ended up calling something undeclared.
        const name = (piece.match(/^(?:static\s+(?:inline\s+)?[\w *]+?)\b(\w+)\s*\(/m) || [])[1];
        // A piece with no function of its own is a preamble -- a typedef, a
        // forward declaration -- and belongs to what comes NEXT, not to what
        // came before, which may well be pruned away from under it.
        if (name) { out.push({ name, code: prefix + piece.trimEnd() + '\n' }); prefix = ''; }
        else prefix += piece;
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

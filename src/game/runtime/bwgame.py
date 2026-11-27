"""bwgame.py — Brickwright game runtime, contract "bwgame-v1" (Python).

Generated game modules (src/game/emit.js, Python profile) call this API. It is the
Python twin of bwgame.js: the same cooperative Scratch-style scheduler, sprites and
clones, costumes, layers, pen, keyboard/mouse input, sounds, monitors and
ask/answer, the same seeded PRNG (mulberry32), the same deterministic clock and the
same JavaScript value semantics (Number() parsing, Number#toString, Scratch
compare, Math.round, JS `%`, ...). An identical input trace therefore yields a
byte-identical state trace in both languages (see ``Game.run_trace`` and the CLI).

Scripts are Python generators; the scheduler calls ``next(gen)`` once per frame.
A loop yields once per iteration, a wait yields ``WAIT`` until its time has passed.

The headless core needs only the standard library. ``run_window`` is a pygame host
(pygame is imported lazily, only there).

CLI:
    python bwgame.py trace <export_dir> <trace.json>   # print run_trace() as JSON
    python bwgame.py run <export_dir> [--scale N] [--seed N]
"""

import itertools
import math
import re
import sys
import time
from decimal import Decimal, ROUND_HALF_UP

CONTRACT = 'bwgame-v1'
STAGE_W = 480
STAGE_H = 360
FPS = 30

_INF = float('inf')
_NAN = float('nan')
INF = _INF
NAN = _NAN


class _WaitSentinel:
    __slots__ = ()

    def __repr__(self):
        return 'WAIT'


# A yielded WAIT survives run-without-screen-refresh; a bare yield does not.
WAIT = _WaitSentinel()


class _Undefined:
    """JavaScript `undefined` (a missing variable reads as this, like in JS)."""
    __slots__ = ()

    def __repr__(self):
        return 'undefined'

    def __bool__(self):
        return False


UNDEFINED = _Undefined()
_MISSING = object()


class StopThread(Exception):
    pass


class Vars(dict):
    """A target's variables: a missing name reads as JS `undefined` instead of raising."""

    def __missing__(self, key):
        return UNDEFINED


# ---------------------------------------------------------------- JS number semantics

_JS_WS = ('\t\n\v\f\r           '
          '       　﻿')
_DEC_RE = re.compile(r'[+-]?(?:Infinity|(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?[0-9]+)?)')
_RADIX_RE = {16: re.compile(r'[0-9a-fA-F]+'), 2: re.compile(r'[01]+'), 8: re.compile(r'[0-7]+')}
_SURR_RE = re.compile('[\ud800-\udfff]')


def _is_num(v):
    return (type(v) is float or type(v) is int) or (isinstance(v, (int, float)) and not isinstance(v, bool))


def _int_to_float(v):
    try:
        return float(v)
    except OverflowError:
        return _INF if v > 0 else -_INF


def _str_to_number(s):
    """JS StringToNumber (Number("...")): NaN where JS gives NaN."""
    s = s.strip(_JS_WS)
    if s == '':
        return 0.0
    if _DEC_RE.fullmatch(s):
        if s.endswith('Infinity'):
            return -_INF if s[0] == '-' else _INF
        return float(s)
    if len(s) > 2 and s[0] == '0' and s[1] in 'xXbBoO':
        base = {'x': 16, 'b': 2, 'o': 8}[s[1].lower()]
        digits = s[2:]
        if _RADIX_RE[base].fullmatch(digits):
            return _int_to_float(int(digits, base))
    return _NAN


def _to_number(v):
    """JS Number(v)."""
    t = type(v)
    if t is float:
        return v
    if t is bool:
        return 1.0 if v else 0.0
    if t is int:
        return _int_to_float(v)
    if t is str:
        return _str_to_number(v)
    if v is None:
        return 0.0
    if isinstance(v, bool):
        return 1.0 if v else 0.0
    if isinstance(v, (int, float)):
        return _int_to_float(v)
    if isinstance(v, str):
        return _str_to_number(str(v))
    if isinstance(v, list):
        return _str_to_number(str_(v))
    return _NAN


def _num_to_str(x):
    """JS Number.prototype.toString() for a double."""
    if x != x:
        return 'NaN'
    if x == _INF:
        return 'Infinity'
    if x == -_INF:
        return '-Infinity'
    if x == 0:
        return '0'
    if x.is_integer() and abs(x) < 9007199254740992.0:
        return str(int(x))
    sign = '-' if x < 0 else ''
    r = repr(abs(x))
    mant, _, exp = r.partition('e')
    e = int(exp) if exp else 0
    ip, _, fp = mant.partition('.')
    allds = ip + fp
    stripped = allds.lstrip('0')
    n = len(ip) + e - (len(allds) - len(stripped))
    digits = stripped.rstrip('0')
    k = len(digits)
    if k <= n <= 21:
        return sign + digits + '0' * (n - k)
    if 0 < n <= 21:
        return sign + digits[:n] + '.' + digits[n:]
    if -6 < n <= 0:
        return sign + '0.' + '0' * (-n) + digits
    ee = n - 1
    es = ('+' if ee >= 0 else '-') + str(abs(ee))
    if k == 1:
        return sign + digits + 'e' + es
    return sign + digits[0] + '.' + digits[1:] + 'e' + es


def _js_trim(s):
    return s.strip(_JS_WS)


def _is_white(v):
    return v is None or (isinstance(v, str) and len(_js_trim(v)) == 0)


def _u16(s):
    return s.encode('utf-16-be', 'surrogatepass')


def _u16len(s):
    return len(s) if s.isascii() else len(_u16(s)) // 2


def _u16fix(s):
    """Recombine adjacent surrogate halves (JS strings are UTF-16 code units)."""
    if _SURR_RE.search(s):
        return s.encode('utf-16-le', 'surrogatepass').decode('utf-16-le', 'surrogatepass')
    return s


def _js_lt(a, b):
    """JS string `<` (UTF-16 code unit order)."""
    if a.isascii() and b.isascii():
        return a < b
    return _u16(a) < _u16(b)


def _jsfloor(x):
    if x != x or x in (_INF, -_INF):
        return x
    r = float(math.floor(x))
    return x if r == 0 and x == 0 else r


def _jsceil(x):
    if x != x or x in (_INF, -_INF):
        return x
    r = float(math.ceil(x))
    if r == 0 and (x < 0 or (x == 0 and math.copysign(1.0, x) < 0)):
        return -0.0
    return r


def _jsround(x):
    """JS Math.round: nearest integer, ties toward +Infinity."""
    x = float(x)
    if x != x or x in (_INF, -_INF):
        return x
    f = float(math.floor(x))
    r = f + 1.0 if (x - f) >= 0.5 else f
    if r == 0 and (x < 0 or (x == 0 and math.copysign(1.0, x) < 0)):
        return -0.0
    return r


def _jsdiv(a, b):
    if b == 0:
        if a != a or a == 0:
            return _NAN
        neg = (a < 0) != (math.copysign(1.0, b) < 0)
        return -_INF if neg else _INF
    return a / b


def _jsfmod(n, m):
    if n != n or m != m or n in (_INF, -_INF) or m == 0:
        return _NAN
    if m in (_INF, -_INF) or n == 0:
        return n
    return math.fmod(n, m)


def _jsmin(a, b):
    if a != a or b != b:
        return _NAN
    if a < b:
        return a
    if b < a:
        return b
    if a == 0 and math.copysign(1.0, a) < 0:
        return a
    return b


def _jsmax(a, b):
    if a != a or b != b:
        return _NAN
    if a > b:
        return a
    if b > a:
        return b
    if a == 0 and math.copysign(1.0, a) > 0:
        return a
    return b


def _truthy_num(v):
    return v if (v and v == v) else 0


def _is_finite(v):
    return v == v and v not in (_INF, -_INF)


def _to_uint32(x):
    if not _is_finite(x):
        return 0
    return int(x) % 4294967296


# ---------------------------------------------------------------- fdlibm (V8 base::ieee754) ports
# V8 implements Math.sin/cos/tan/asin/acos/atan/atan2/exp/log with fdlibm; the platform
# libm differs in the last bit for a few percent of inputs, so the runtime uses these
# pure-Python ports for bit-exact parity with bwgame.js.
import struct as _struct
_pk = _struct.Struct('<d').pack
_upk = _struct.Struct('<d').unpack
_pkq = _struct.Struct('<Q').pack
_upkq = _struct.Struct('<Q').unpack


def _bits(x):
    return _upkq(_pk(x))[0]


def _hi(x):
    """signed high word"""
    h = _bits(x) >> 32
    return h - 0x100000000 if h & 0x80000000 else h


def _lo(x):
    return _bits(x) & 0xFFFFFFFF


def _words(hi, lo):
    return _upk(_pkq(((hi & 0xFFFFFFFF) << 32) | (lo & 0xFFFFFFFF)))[0]


def _set_lo0(x):
    return _upk(_pkq(_bits(x) & 0xFFFFFFFF00000000))[0]


_S1, _S2, _S3 = -1.66666666666666324348e-01, 8.33333333332248946124e-03, -1.98412698298579493134e-04
_S4, _S5, _S6 = 2.75573137070700676789e-06, -2.50507602534068634195e-08, 1.58969099521155010221e-10
_C1, _C2, _C3 = 4.16666666666666019037e-02, -1.38888888888741095749e-03, 2.48015872894767294178e-05
_C4, _C5, _C6 = -2.75573143513906633035e-07, 2.08757232129817482790e-09, -1.13596475577881948265e-11


def _k_sin(x, y, iy):
    ix = _hi(x) & 0x7fffffff
    if ix < 0x3e400000 and int(x) == 0:
        return x
    z = x * x
    v = z * x
    r = _S2 + z * (_S3 + z * (_S4 + z * (_S5 + z * _S6)))
    if iy == 0:
        return x + v * (_S1 + z * r)
    return x - ((z * (0.5 * y - v * r) - y) - v * _S1)


def _k_cos(x, y):
    ix = _hi(x) & 0x7fffffff
    if ix < 0x3e400000 and int(x) == 0:
        return 1.0
    z = x * x
    r = z * (_C1 + z * (_C2 + z * (_C3 + z * (_C4 + z * (_C5 + z * _C6)))))
    if ix < 0x3FD33333:
        return 1.0 - (0.5 * z - (z * r - x * y))
    qx = 0.28125 if ix > 0x3fe90000 else _words(ix - 0x00200000, 0)
    hz = 0.5 * z - qx
    a = 1.0 - qx
    return a - (hz - (z * r - x * y))


_T = (3.33333333333334091986e-01, 1.33333333333201242699e-01, 5.39682539762260521377e-02,
      2.18694882948595424599e-02, 8.86323982359930005737e-03, 3.59207910759131235356e-03,
      1.45620945432529025516e-03, 5.88041240820264096874e-04, 2.46463134818469906812e-04,
      7.81794442939557092300e-05, 7.14072491382608190305e-05, -1.85586374855275456654e-05,
      2.59073051863633712884e-05)
_PIO4, _PIO4LO = 7.85398163397448278999e-01, 3.06161699786838301793e-17


def _k_tan(x, y, iy):
    hx = _hi(x)
    ix = hx & 0x7fffffff
    if ix < 0x3e300000 and int(x) == 0:
        if ((ix | _lo(x)) | (iy + 1)) == 0:
            return 1.0 / abs(x)
        if iy == 1:
            return x
        w = x + y
        z = _set_lo0(w)
        v = y - (z - x)
        t = a = -1.0 / w
        t = _set_lo0(t)
        s = 1.0 + t * z
        return t + a * (s + t * v)
    if ix >= 0x3FE59428:
        if hx < 0:
            x = -x
            y = -y
        z = _PIO4 - x
        w = _PIO4LO - y
        x = z + w
        y = 0.0
    T = _T
    z = x * x
    w = z * z
    r = T[1] + w * (T[3] + w * (T[5] + w * (T[7] + w * (T[9] + w * T[11]))))
    v = z * (T[2] + w * (T[4] + w * (T[6] + w * (T[8] + w * (T[10] + w * T[12])))))
    s = z * x
    r = y + z * (s * (r + v) + y)
    r += T[0] * s
    w = x + r
    if ix >= 0x3FE59428:
        v = float(iy)
        return float(1 - ((hx >> 30) & 2)) * (v - 2.0 * (x - (w * w / (w + v) - r)))
    if iy == 1:
        return w
    z = _set_lo0(w)
    v = r - (z - x)
    t = a = -1.0 / w
    t = _set_lo0(t)
    s = 1.0 + t * z
    return t + a * (s + t * v)


_NPIO2_HW = (0x3FF921FB, 0x400921FB, 0x4012D97C, 0x401921FB, 0x401F6A7A, 0x4022D97C, 0x4025FDBB, 0x402921FB,
             0x402C463A, 0x402F6A7A, 0x4031475C, 0x4032D97C, 0x40346B9C, 0x4035FDBB, 0x40378FDB, 0x403921FB,
             0x403AB41B, 0x403C463A, 0x403DD85A, 0x403F6A7A, 0x40407E4C, 0x4041475C, 0x4042106C, 0x4042D97C,
             0x4043A28C, 0x40446B9C, 0x404534AC, 0x4045FDBB, 0x4046C6CB, 0x40478FDB, 0x404858EB, 0x404921FB)
_INVPIO2 = 6.36619772367581382433e-01
_PIO2_1, _PIO2_1T = 1.57079632673412561417e+00, 6.07710050650619224932e-11
_PIO2_2, _PIO2_2T = 6.07710050630396597660e-11, 2.02226624879595063154e-21
_PIO2_3, _PIO2_3T = 2.02226624871116645580e-21, 8.47842766036889956997e-32


def _rem_pio2(x):
    """returns (n, y0, y1), or None for |x| >= 2^19*pi/2 (not ported)"""
    hx = _hi(x)
    ix = hx & 0x7fffffff
    if ix <= 0x3fe921fb:
        return 0, x, 0.0
    if ix < 0x4002d97c:
        if hx > 0:
            z = x - _PIO2_1
            if ix != 0x3ff921fb:
                y0 = z - _PIO2_1T
                return 1, y0, (z - y0) - _PIO2_1T
            z -= _PIO2_2
            y0 = z - _PIO2_2T
            return 1, y0, (z - y0) - _PIO2_2T
        z = x + _PIO2_1
        if ix != 0x3ff921fb:
            y0 = z + _PIO2_1T
            return -1, y0, (z - y0) + _PIO2_1T
        z += _PIO2_2
        y0 = z + _PIO2_2T
        return -1, y0, (z - y0) + _PIO2_2T
    if ix <= 0x413921fb:
        t = abs(x)
        n = int(t * _INVPIO2 + 0.5)
        fn = float(n)
        r = t - fn * _PIO2_1
        w = fn * _PIO2_1T
        if n < 32 and ix != _NPIO2_HW[n - 1]:
            y0 = r - w
        else:
            j = ix >> 20
            y0 = r - w
            i = j - ((_hi(y0) >> 20) & 0x7ff)
            if i > 16:
                t = r
                w = fn * _PIO2_2
                r = t - w
                w = fn * _PIO2_2T - ((t - r) - w)
                y0 = r - w
                i = j - ((_hi(y0) >> 20) & 0x7ff)
                if i > 49:
                    t = r
                    w = fn * _PIO2_3
                    r = t - w
                    w = fn * _PIO2_3T - ((t - r) - w)
                    y0 = r - w
        y1 = (r - y0) - w
        if hx < 0:
            return -n, -y0, -y1
        return n, y0, y1
    return None


def fd_sin(x):
    if x != x or x in (_INF, -_INF):
        return _NAN
    if (_hi(x) & 0x7fffffff) <= 0x3fe921fb:
        return _k_sin(x, 0.0, 0)
    r = _rem_pio2(x)
    if r is None:
        return math.sin(x)
    n, a, b = r
    n &= 3
    if n == 0:
        return _k_sin(a, b, 1)
    if n == 1:
        return _k_cos(a, b)
    if n == 2:
        return -_k_sin(a, b, 1)
    return -_k_cos(a, b)


def fd_cos(x):
    if x != x or x in (_INF, -_INF):
        return _NAN
    if (_hi(x) & 0x7fffffff) <= 0x3fe921fb:
        return _k_cos(x, 0.0)
    r = _rem_pio2(x)
    if r is None:
        return math.cos(x)
    n, a, b = r
    n &= 3
    if n == 0:
        return _k_cos(a, b)
    if n == 1:
        return -_k_sin(a, b, 1)
    if n == 2:
        return -_k_cos(a, b)
    return _k_sin(a, b, 1)


def fd_tan(x):
    if x != x or x in (_INF, -_INF):
        return _NAN
    if (_hi(x) & 0x7fffffff) <= 0x3fe921fb:
        return _k_tan(x, 0.0, 1)
    r = _rem_pio2(x)
    if r is None:
        return math.tan(x)
    n, a, b = r
    return _k_tan(a, b, 1 - ((n & 1) << 1))


_PIO2_HI, _PIO2_LO, _PIO4_HI = 1.57079632679489655800e+00, 6.12323399573676603587e-17, 7.85398163397448278999e-01
_PI = 3.14159265358979311600e+00
_pS0, _pS1, _pS2 = 1.66666666666666657415e-01, -3.25565818622400915405e-01, 2.01212532134862925881e-01
_pS3, _pS4, _pS5 = -4.00555345006794114027e-02, 7.91534994289814532176e-04, 3.47933107596021167570e-05
_qS1, _qS2, _qS3, _qS4 = -2.40339491173441421878e+00, 2.02094576023350569471e+00, -6.88283971605453293030e-01, 7.70381505559019352791e-02


def _pq(t):
    p = t * (_pS0 + t * (_pS1 + t * (_pS2 + t * (_pS3 + t * (_pS4 + t * _pS5)))))
    q = 1.0 + t * (_qS1 + t * (_qS2 + t * (_qS3 + t * _qS4)))
    return p, q


def fd_asin(x):
    hx = _hi(x)
    ix = hx & 0x7fffffff
    if ix >= 0x3ff00000:
        if ((ix - 0x3ff00000) | _lo(x)) == 0:
            return x * _PIO2_HI + x * _PIO2_LO
        return _NAN
    if ix < 0x3fe00000:
        if ix < 0x3e400000 and 1e300 + x > 1.0:
            return x
        t = x * x
        p, q = _pq(t)
        return x + x * (p / q)
    w = 1.0 - abs(x)
    t = w * 0.5
    p, q = _pq(t)
    s = math.sqrt(t)
    if ix >= 0x3FEF3333:
        w = p / q
        t = _PIO2_HI - (2.0 * (s + s * w) - _PIO2_LO)
    else:
        w = _set_lo0(s)
        c = (t - w * w) / (s + w)
        r = p / q
        p = 2.0 * s * r - (_PIO2_LO - 2.0 * c)
        q = _PIO4_HI - 2.0 * w
        t = _PIO4_HI - (p - q)
    return t if hx > 0 else -t


def fd_acos(x):
    hx = _hi(x)
    ix = hx & 0x7fffffff
    if ix >= 0x3ff00000:
        if ((ix - 0x3ff00000) | _lo(x)) == 0:
            return 0.0 if hx > 0 else _PI + 2.0 * _PIO2_LO
        return _NAN
    if ix < 0x3fe00000:
        if ix <= 0x3c600000:
            return _PIO2_HI + _PIO2_LO
        z = x * x
        p, q = _pq(z)
        r = p / q
        return _PIO2_HI - (x - (_PIO2_LO - x * r))
    if hx < 0:
        z = (1.0 + x) * 0.5
        p, q = _pq(z)
        s = math.sqrt(z)
        r = p / q
        w = r * s - _PIO2_LO
        return _PI - 2.0 * (s + w)
    z = (1.0 - x) * 0.5
    s = math.sqrt(z)
    df = _set_lo0(s)
    c = (z - df * df) / (s + df)
    p, q = _pq(z)
    r = p / q
    w = r * s + c
    return 2.0 * (df + w)


_ATANHI = (4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00)
_ATANLO = (2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17)
_AT = (3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01,
       -1.11111104054623557880e-01, 9.09088713343650656196e-02, -7.69187620504482999495e-02,
       6.66107313738753120669e-02, -5.83357013379057348645e-02, 4.97687799461593236017e-02,
       -3.65315727442169155270e-02, 1.62858201153657823623e-02)


def fd_atan(x):
    hx = _hi(x)
    ix = hx & 0x7fffffff
    if ix >= 0x44100000:
        if x != x:
            return x
        return _ATANHI[3] + _ATANLO[3] if hx > 0 else -_ATANHI[3] - _ATANLO[3]
    if ix < 0x3fdc0000:
        if ix < 0x3e400000 and 1e300 + x > 1.0:
            return x
        idn = -1
    else:
        x = abs(x)
        if ix < 0x3ff30000:
            if ix < 0x3fe60000:
                idn = 0
                x = (2.0 * x - 1.0) / (2.0 + x)
            else:
                idn = 1
                x = (x - 1.0) / (x + 1.0)
        elif ix < 0x40038000:
            idn = 2
            x = (x - 1.5) / (1.0 + 1.5 * x)
        else:
            idn = 3
            x = -1.0 / x
    a = _AT
    z = x * x
    w = z * z
    s1 = z * (a[0] + w * (a[2] + w * (a[4] + w * (a[6] + w * (a[8] + w * a[10])))))
    s2 = w * (a[1] + w * (a[3] + w * (a[5] + w * (a[7] + w * a[9]))))
    if idn < 0:
        return x - x * (s1 + s2)
    z = _ATANHI[idn] - ((x * (s1 + s2) - _ATANLO[idn]) - x)
    return -z if hx < 0 else z


_PI_O_4, _PI_O_2, _PI_LO = 7.8539816339744827900e-01, 1.5707963267948965580e+00, 1.2246467991473531772e-16


def fd_atan2(y, x):
    if x != x or y != y:
        return x + y
    hx = _hi(x)
    ix = hx & 0x7fffffff
    lx = _lo(x)
    hy = _hi(y)
    iy = hy & 0x7fffffff
    ly = _lo(y)
    if ((hx - 0x3ff00000) | lx) == 0:
        return fd_atan(y)
    m = ((hy >> 31) & 1) | ((hx >> 30) & 2)
    tiny = 1.0e-300
    if (iy | ly) == 0:
        if m in (0, 1):
            return y
        return _PI + tiny if m == 2 else -_PI - tiny
    if (ix | lx) == 0:
        return -_PI_O_2 - tiny if hy < 0 else _PI_O_2 + tiny
    if ix == 0x7ff00000:
        if iy == 0x7ff00000:
            return (_PI_O_4 + tiny, -_PI_O_4 - tiny, 3.0 * _PI_O_4 + tiny, -3.0 * _PI_O_4 - tiny)[m]
        return (0.0, -0.0, _PI + tiny, -_PI - tiny)[m]
    if iy == 0x7ff00000:
        return -_PI_O_2 - tiny if hy < 0 else _PI_O_2 + tiny
    k = (iy - ix) >> 20
    if k > 60:
        z = _PI_O_2 + 0.5 * _PI_LO
        m &= 1
    elif hx < 0 and k < -60:
        z = 0.0
    else:
        z = fd_atan(abs(y / x))
    if m == 0:
        return z
    if m == 1:
        return -z
    if m == 2:
        return _PI - (z - _PI_LO)
    return (z - _PI_LO) - _PI


_LN2HI = (6.93147180369123816490e-01, -6.93147180369123816490e-01)
_LN2LO = (1.90821492927058770002e-10, -1.90821492927058770002e-10)
_P1, _P2, _P3 = 1.66666666666666019037e-01, -2.77777777770155933842e-03, 6.61375632143793436117e-05
_P4, _P5 = -1.65339022054652515390e-06, 4.13813679705723846039e-08


def fd_exp(x):
    hx = _hi(x)
    xsb = (hx >> 31) & 1
    hx &= 0x7fffffff
    if hx >= 0x40862E42:
        if hx >= 0x7ff00000:
            if x != x:
                return x
            return 0.0 if xsb else x
        if x > 7.09782712893383973096e+02:
            return _INF
        if x < -7.45133219101941108420e+02:
            return 0.0
    if hx > 0x3fd62e42:
        if hx < 0x3FF0A2B2:
            if x == 1.0:
                return 2.718281828459045
            hi = x - _LN2HI[xsb]
            lo = _LN2LO[xsb]
            k = 1 - xsb - xsb
        else:
            k = int(1.44269504088896338700e+00 * x + (0.5, -0.5)[xsb])
            t = float(k)
            hi = x - t * _LN2HI[0]
            lo = t * _LN2LO[0]
        x = hi - lo
    elif hx < 0x3e300000:
        if 1e300 + x > 1.0:
            return 1.0 + x
        k = 0
    else:
        k = 0
    t = x * x
    if k >= -1021:
        twopk = _words(0x3ff00000 + (k << 20), 0)
    else:
        twopk = _words(0x3ff00000 + ((k + 1000) << 20), 0)
    c = x - t * (_P1 + t * (_P2 + t * (_P3 + t * (_P4 + t * _P5))))
    if k == 0:
        return 1.0 - ((x * c) / (c - 2.0) - x)
    y = 1.0 - ((lo - (x * c) / (2.0 - c)) - hi)
    if k >= -1021:
        if k == 1024:
            return y * 2.0 * 8.98846567431157953865e+307
        return y * twopk
    return y * twopk * 9.33263618503218878990e-302


_Lg1, _Lg2, _Lg3 = 6.666666666666735130e-01, 3.999999999940941908e-01, 2.857142874366239149e-01
_Lg4, _Lg5, _Lg6, _Lg7 = 2.222219843214978396e-01, 1.818357216161805012e-01, 1.531383769920937332e-01, 1.479819860511658591e-01
_LN2_HI, _LN2_LO = 6.93147180369123816490e-01, 1.90821492927058770002e-10


def fd_log(x):
    hx = _hi(x)
    lx = _lo(x)
    k = 0
    if hx < 0x00100000:
        if ((hx & 0x7fffffff) | lx) == 0:
            return -_INF
        if hx < 0:
            return _NAN
        k -= 54
        x *= 1.80143985094819840000e+16
        hx = _hi(x)
    if hx >= 0x7ff00000:
        return x + x
    k += (hx >> 20) - 1023
    hx &= 0x000fffff
    i = (hx + 0x95f64) & 0x100000
    x = _words(hx | (i ^ 0x3ff00000), _lo(x))
    k += (i >> 20)
    f = x - 1.0
    if (0x000fffff & (2 + hx)) < 3:
        if f == 0:
            if k == 0:
                return 0.0
            dk = float(k)
            return dk * _LN2_HI + dk * _LN2_LO
        R = f * f * (0.5 - 0.33333333333333333 * f)
        if k == 0:
            return f - R
        dk = float(k)
        return dk * _LN2_HI - ((R - dk * _LN2_LO) - f)
    s = f / (2.0 + f)
    dk = float(k)
    z = s * s
    i = hx - 0x6147a
    w = z * z
    j = 0x6b851 - hx
    t1 = w * (_Lg2 + w * (_Lg4 + w * _Lg6))
    t2 = z * (_Lg1 + w * (_Lg3 + w * (_Lg5 + w * _Lg7)))
    i |= j
    R = t2 + t1
    if i > 0:
        hfsq = 0.5 * f * f
        if k == 0:
            return f - (hfsq - s * (hfsq + R))
        return dk * _LN2_HI - ((hfsq - (s * (hfsq + R) + dk * _LN2_LO)) - f)
    if k == 0:
        return f - s * (f - R)
    return dk * _LN2_HI - ((s * (f - R) - dk * _LN2_LO) - f)


# ---------------------------------------------------------------- casts (public helpers)

def num(v):
    n = _to_number(v)
    return 0.0 if n != n else n


def str_(v):
    t = type(v)
    if t is str:
        return v
    if t is bool:
        return 'true' if v else 'false'
    if t is float:
        return _num_to_str(v)
    if t is int:
        return _num_to_str(_int_to_float(v))
    if v is None:
        return 'null'
    if v is UNDEFINED:
        return 'undefined'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return _num_to_str(_int_to_float(v))
    if isinstance(v, str):
        return str(v)
    if isinstance(v, (list, tuple)):
        return ','.join('' if (x is None or x is UNDEFINED) else str_(x) for x in v)
    return str(v)


def bool_(v):
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        if v == '' or v == '0' or v.lower() == 'false':
            return False
        return True
    if isinstance(v, (int, float)):
        return not (v == 0 or v != v)
    if v is None or v is UNDEFINED:
        return False
    return True


def compare(a, b):
    n1 = _to_number(a)
    n2 = _to_number(b)
    if n1 == 0 and _is_white(a):
        n1 = _NAN
    elif n2 == 0 and _is_white(b):
        n2 = _NAN
    if isinstance(a, bool):
        n1 = _NAN
    if isinstance(b, bool):
        n2 = _NAN
    if n1 != n1 or n2 != n2:
        s1 = str_(a).lower()
        s2 = str_(b).lower()
        return -1 if _js_lt(s1, s2) else (1 if _js_lt(s2, s1) else 0)
    if n1 == _INF and n2 == _INF:
        return 0
    if n1 == -_INF and n2 == -_INF:
        return 0
    return n1 - n2


def eq(a, b):
    return compare(a, b) == 0


def lt(a, b):
    return compare(a, b) < 0


def gt(a, b):
    return compare(a, b) > 0


def add(a, b):
    return num(a) + num(b)


def sub(a, b):
    return num(a) - num(b)


def mul(a, b):
    return num(a) * num(b)


def div(a, b):
    return _jsdiv(num(a), num(b))


def mod(a, b):
    n = num(a)
    m = num(b)
    r = _jsfmod(n, m)
    if _jsdiv(r, m) < 0:
        r += m
    return r


def round_(a):
    return _jsround(num(a))


def times(n):
    """repeat N: Scratch rounds the count once, before the loop starts."""
    c = _jsround(num(n))
    if c != c or c <= 0:
        return ()
    if c == _INF:
        return itertools.count()
    return range(int(c))


def join(a, b):
    return _u16fix(str_(a) + str_(b))


def letter_of(i, s):
    s = str_(s)
    k = num(i) - 1
    if k < 0 or k >= _u16len(s):
        return ''
    k = int(k)
    if s.isascii():
        return s[k]
    return _u16(s)[2 * k:2 * k + 2].decode('utf-16-be', 'surrogatepass')


def length(s):
    return _u16len(str_(s))


def contains(s, sub_):
    return str_(sub_).lower() in str_(s).lower()


def _radians(d):
    return math.pi * d / 180


def _to_fixed10(x):
    """parseFloat(x.toFixed(10))."""
    if x != x:
        return _NAN
    if x == 0:
        return 0.0
    if abs(x) >= 1e21:
        return x
    return float(Decimal(x).quantize(Decimal('1e-10'), rounding=ROUND_HALF_UP))


_sin = fd_sin
_cos = fd_cos


_LN10 = 2.302585092994046


def _ln(n):
    if n != n or n < 0:
        return _NAN
    if n == 0:
        return -_INF
    if n == _INF:
        return _INF
    return fd_log(n)


def mathop(op, v):
    n = num(v)
    o = str_(op).lower()
    if o == 'abs':
        return abs(n)
    if o == 'floor':
        return _jsfloor(n)
    if o == 'ceiling':
        return _jsceil(n)
    if o == 'sqrt':
        return _NAN if n < 0 else math.sqrt(n)
    if o == 'sin':
        return _to_fixed10(_sin(_radians(n)))
    if o == 'cos':
        return _to_fixed10(_cos(_radians(n)))
    if o == 'tan':
        return _tan_deg(n)
    if o == 'asin':
        return fd_asin(n) * 180 / math.pi
    if o == 'acos':
        return fd_acos(n) * 180 / math.pi
    if o == 'atan':
        return fd_atan(n) * 180 / math.pi
    if o == 'ln':
        return _ln(n)
    if o == 'log':
        return _ln(n) / _LN10
    if o == 'e ^':
        return fd_exp(n)
    if o == '10 ^':
        try:
            return math.pow(10.0, n)
        except OverflowError:
            return _INF
    return 0.0


def _tan_deg(a):
    a = _jsfmod(a, 360)
    if a == -270 or a == 90:
        return _INF
    if a == -90 or a == 270:
        return -_INF
    r = _radians(a)
    return _to_fixed10(fd_tan(r))


# mulberry32: tiny, exact in both JS and Python (32-bit integer arithmetic).
_M32 = 0xFFFFFFFF


def make_rng(seed):
    state = [_to_uint32(num(seed)) if not isinstance(seed, int) or isinstance(seed, bool) else seed & _M32]

    def next_():
        s = (state[0] + 0x6D2B79F5) & _M32
        state[0] = s
        t = s
        t = ((t ^ (t >> 15)) * (t | 1)) & _M32
        t = (t ^ ((t + (((t ^ (t >> 7)) * (t | 61)) & _M32)) & _M32)) & _M32
        return ((t ^ (t >> 14)) & _M32) / 4294967296
    return next_


def _wrap_clamp(v, lo, hi):
    rng = (hi - lo) + 1
    return v - (_jsfloor(_jsdiv(v - lo, rng)) * rng)


def _limit_precision(c):
    r = _jsround(c)
    return r if abs(c - r) < 1e-9 else c


def _idx(v):
    return int(v) if _is_finite(v) else v


# ---------------------------------------------------------------- pen colour (HSV 0..100)

def hsv_to_rgb(h, s, v):
    h = _jsfmod(_jsfmod(h, 360) + 360, 360)
    s = _jsmax(0, _jsmin(1, s))
    v = _jsmax(0, _jsmin(1, v))
    i = int(_jsfloor(h / 60)) if _is_finite(h) else 0
    f = (h / 60) - i
    p = v * (1 - s)
    q = v * (1 - (s * f))
    t = v * (1 - (s * (1 - f)))
    r, g, b = [(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)][i % 6]
    return [int(_jsfloor(r * 255)), int(_jsfloor(g * 255)), int(_jsfloor(b * 255))]


def rgb_to_hsv(r, g, b):
    r /= 255
    g /= 255
    b /= 255
    x = min(r, g, b)
    v = max(r, g, b)
    h = 0
    s = 0
    if x != v:
        f = (g - b) if r == x else ((b - r) if g == x else (r - g))
        i = 3 if r == x else (5 if g == x else 1)
        h = _jsfmod((i - (f / (v - x))) * 60, 360)
        s = (v - x) / v
    return [h, s, v]


_HEX6 = re.compile(r'#?([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})')
_HEX3 = re.compile(r'#?([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])')


def color_to_rgb(c):
    if isinstance(c, str) and c.startswith('#'):
        m = _HEX6.fullmatch(c)
        if m:
            return [int(m.group(1), 16), int(m.group(2), 16), int(m.group(3), 16), 255]
        m = _HEX3.fullmatch(c)
        if m:
            return [int(m.group(1) * 2, 16), int(m.group(2) * 2, 16), int(m.group(3) * 2, 16), 255]
        return [0, 0, 0, 255]
    n = _to_uint32(num(c))
    a = (n >> 24) & 0xFF
    return [(n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF, a if a > 0 else 255]


# ---------------------------------------------------------------- key names

_KEY_ALIASES = {' ': 'space', 'arrowleft': 'left arrow', 'arrowright': 'right arrow', 'arrowup': 'up arrow',
                'arrowdown': 'down arrow', 'enter': 'enter', 'left': 'left arrow', 'right': 'right arrow',
                'up': 'up arrow', 'down': 'down arrow', 'return': 'enter'}


def scratch_key(k):
    low = str_(k).lower()
    if low in _KEY_ALIASES:
        return _KEY_ALIASES[low]
    return low


# ---------------------------------------------------------------- targets

class Bounds:
    __slots__ = ('left', 'right', 'top', 'bottom')

    def __init__(self, left, right, top, bottom):
        self.left = left
        self.right = right
        self.top = top
        self.bottom = bottom


class Bubble:
    __slots__ = ('kind', 'text')

    def __init__(self, kind, text):
        self.kind = kind
        self.text = text


class Target:
    def __init__(self, game, d, is_stage):
        self.game = game
        self.def_ = d
        self.name = d.get('name')
        self.is_stage = is_stage
        self.is_clone = False
        self.original = self
        self.vars = Vars(d.get('variables') or {})
        self.lists = {k: list(v) for k, v in (d.get('lists') or {}).items()}
        self.costumes = d.get('costumes') or []
        self.costume_index = d.get('currentCostume') or 0
        self.sounds = d.get('sounds') or []
        vol = d.get('volume')
        self.volume = 100 if vol is None else vol
        self.effects = {}
        self.alive = True

    @property
    def costume(self):
        i = self.costume_index
        if isinstance(i, int) and 0 <= i < len(self.costumes):
            return self.costumes[i]
        return None

    def costume_number(self):
        return self.costume_index + 1

    def costume_name(self):
        c = self.costume
        return c['name'] if c else ''

    def _set_costume(self, req):
        n = len(self.costumes)
        if not n:
            return
        if _is_num(req):
            self.costume_index = _idx(_wrap_clamp(_jsround(_to_number(req)) - 1, 0, n - 1))
            return
        s = str_(req)
        for i, c in enumerate(self.costumes):
            if c['name'] == s:
                self.costume_index = i
                return
        if s == 'next costume' or s == 'next backdrop':
            self.costume_index = (self.costume_index + 1) % n
            return
        if s == 'previous costume' or s == 'previous backdrop':
            self.costume_index = (self.costume_index + n - 1) % n
            return
        if s == 'random backdrop':
            if n > 1:
                while True:
                    r = int(_jsfloor(self.game.random() * n))
                    if r != self.costume_index:
                        break
                self.costume_index = r
            return
        if not _is_white(s) and _to_number(s) == _to_number(s):
            self.costume_index = _idx(_wrap_clamp(_jsround(_to_number(s)) - 1, 0, n - 1))

    def set_effect(self, name, v):
        self.effects[str_(name).lower()] = num(v)

    def change_effect(self, name, v):
        k = str_(name).lower()
        self.effects[k] = _truthy_num(self.effects.get(k, 0)) + num(v)

    def clear_effects(self):
        self.effects = {}

    def set_volume(self, v):
        self.volume = _jsmax(0, _jsmin(100, num(v)))

    def change_volume(self, v):
        self.set_volume(self.volume + num(v))

    def create_clone(self, what):
        w = str_(what)
        src = (None if self.is_stage else self) if w == '_myself_' else self.game.sprite(w)
        if src:
            self.game._clone(src)

    # sounds
    def _sound(self, req):
        if not self.sounds:
            return None
        s = str_(req)
        for x in self.sounds:
            if x['name'] == s:
                return x
        if not _is_white(s) and _to_number(s) == _to_number(s):
            n = len(self.sounds)
            i = _wrap_clamp(_jsround(_to_number(s)) - 1, 0, n - 1)
            return self.sounds[int(i)] if _is_finite(i) else None
        return None

    def start_sound(self, req):
        s = self._sound(req)
        if s:
            self.game.audio.play(s, self.volume)

    def play_sound_until_done(self, req):
        s = self._sound(req)
        if not s:
            return
        self.game.audio.play(s, self.volume)
        yield from self.game.wait(s.get('duration') or 0)


class Stage(Target):
    def __init__(self, game, d):
        super().__init__(game, d, True)

    def backdrop_number(self):
        return self.costume_number()

    def backdrop_name(self):
        return self.costume_name()

    def switch_backdrop(self, req):
        self._set_costume(req)
        self.game._fire_backdrop(self.costume_name())

    def next_backdrop(self):
        self.switch_backdrop('next backdrop')

    def switch_backdrop_and_wait(self, req):
        self._set_costume(req)
        threads = self.game._fire_backdrop(self.costume_name())
        yield from self.game.wait_threads(threads)


class Sprite(Target):
    def __init__(self, game, d):
        super().__init__(game, d, False)
        self.x = d.get('x') or 0
        self.y = d.get('y') or 0
        dr = d.get('direction')
        self.direction = 90 if dr is None else dr
        sz = d.get('size')
        self.size = 100 if sz is None else sz
        self.visible = d.get('visible') is not False
        self.rotation_style = d.get('rotationStyle') or 'all around'
        self.draggable = bool(d.get('draggable'))
        self.bubble = None
        self._bubble_token = 0
        self.pen = {'down': False, 'size': 1, 'hue': 66.66, 'saturation': 100, 'brightness': 100, 'transparency': 0}

    # --- geometry
    def bounds(self):
        c = self.costume
        if not c:
            return Bounds(self.x, self.x, self.y, self.y)
        s = self.size / 100
        # the costume's drawn content (manifest bounds), else its whole canvas
        bl, bt, br, bb = c.get('bounds') or [0, 0, c['width'], c['height']]
        deg = 0
        flip = False
        if self.rotation_style == 'all around':
            deg = self.direction - 90
        elif self.rotation_style == 'left-right' and self.direction < 0:
            flip = True
        ccx = c['cx']
        ccy = c['cy']
        pts = [(bl - ccx, ccy - bt), (br - ccx, ccy - bt), (br - ccx, ccy - bb), (bl - ccx, ccy - bb)]
        pts = [((-px if flip else px) * s, py * s) for px, py in pts]
        r = _radians(-deg)
        cos = _cos(r)
        sin = _sin(r)
        left = _INF
        right = -_INF
        top = -_INF
        bottom = _INF
        for px, py in pts:
            X = self.x + (px * cos) - (py * sin)
            Y = self.y + (px * sin) + (py * cos)
            left = _jsmin(left, X)
            right = _jsmax(right, X)
            top = _jsmax(top, Y)
            bottom = _jsmin(bottom, Y)
        return Bounds(left, right, top, bottom)

    def _fenced(self, nx, ny):
        # scratch-render getFencedPositionOfDrawable: keep a sliver (<=15px) on stage.
        b = self.bounds()
        dx = nx - self.x
        dy = ny - self.y
        FW = 15
        sx = (STAGE_W / 2) - _jsmin(FW, _jsfloor((b.right - b.left) / 2))
        if b.right + dx < -sx:
            nx = _jsceil(self.x - (sx + b.right))
        elif b.left + dx > sx:
            nx = _jsfloor(self.x + (sx - b.left))
        sy = (STAGE_H / 2) - _jsmin(FW, _jsfloor((b.top - b.bottom) / 2))
        if b.top + dy < -sy:
            ny = _jsceil(self.y - (sy + b.top))
        elif b.bottom + dy > sy:
            ny = _jsfloor(self.y + (sy - b.bottom))
        return nx, ny

    def go_to(self, x, y):
        ox, oy = self.x, self.y
        self.x, self.y = self._fenced(num(x), num(y))
        if self.pen['down']:
            self.game.pen.line(self, ox, oy, self.x, self.y)

    def get_x(self):
        return _limit_precision(self.x)

    def get_y(self):
        return _limit_precision(self.y)

    def set_x(self, x):
        self.go_to(x, self.y)

    def set_y(self, y):
        self.go_to(self.x, y)

    def change_x(self, dx):
        self.go_to(self.x + num(dx), self.y)

    def change_y(self, dy):
        self.go_to(self.x, self.y + num(dy))

    def move(self, steps):
        r = _radians(90 - self.direction)
        n = num(steps)
        self.go_to(self.x + (n * _cos(r)), self.y + (n * _sin(r)))

    def point_in_direction(self, d):
        n = num(d)
        if _is_finite(n):
            self.direction = _wrap_clamp(n, -179, 180)

    def turn_right(self, d):
        self.point_in_direction(self.direction + num(d))

    def turn_left(self, d):
        self.point_in_direction(self.direction - num(d))

    def _target_xy(self, what):
        w = str_(what)
        if w == '_mouse_':
            return [self.game.mouse.x, self.game.mouse.y]
        if w == '_random_':
            rx = _jsround(STAGE_W * (self.game.random() - 0.5))
            ry = _jsround(STAGE_H * (self.game.random() - 0.5))
            return [rx, ry]
        t = self.game.sprite(w)
        return [t.x, t.y] if t else None

    def go_to_target(self, what):
        p = self._target_xy(what)
        if p:
            self.go_to(p[0], p[1])

    def point_towards(self, what):
        p = self._target_xy(what)
        if not p:
            return
        if str_(what) == '_random_':
            self.point_in_direction(_jsround(self.game.random() * 360) - 180)
            return
        dx = p[0] - self.x
        dy = p[1] - self.y
        self.point_in_direction(90 - (fd_atan2(dy, dx) * 180 / math.pi))

    def distance_to(self, what):
        p = self._target_xy(what)
        if not p:
            return 10000
        ddx = self.x - p[0]
        ddy = self.y - p[1]
        return math.sqrt((ddx * ddx) + (ddy * ddy))

    def glide_to(self, secs, x, y):
        # scratch-vm motion_glidesecstoxy: the first tick only starts the timer.
        dur = 1000 * num(secs)
        sx, sy = self.x, self.y
        ex, ey = num(x), num(y)
        t0 = self.game.now_ms()
        if dur <= 0:
            self.go_to(ex, ey)
            return
        yield WAIT
        while True:
            elapsed = self.game.now_ms() - t0
            if elapsed >= dur:
                self.go_to(ex, ey)
                return
            f = elapsed / dur
            self.go_to(sx + ((ex - sx) * f), sy + ((ey - sy) * f))
            yield WAIT

    def glide_to_target(self, secs, what):
        p = self._target_xy(what)
        if p:
            yield from self.glide_to(secs, p[0], p[1])

    def if_on_edge_bounce(self):
        b = self.bounds()
        dists = [('left', _jsmax(0, (STAGE_W / 2) + b.left)), ('top', _jsmax(0, (STAGE_H / 2) - b.top)),
                 ('right', _jsmax(0, (STAGE_W / 2) - b.right)), ('bottom', _jsmax(0, (STAGE_H / 2) + b.bottom))]
        edge = ''
        mn = _INF
        for e, d in dists:
            if d < mn:
                mn = d
                edge = e
        if mn > 0:
            return
        r = _radians(90 - self.direction)
        dx = _cos(r)
        dy = -_sin(r)
        if edge == 'left':
            dx = _jsmax(0.2, abs(dx))
        elif edge == 'top':
            dy = _jsmax(0.2, abs(dy))
        elif edge == 'right':
            dx = 0 - _jsmax(0.2, abs(dx))
        elif edge == 'bottom':
            dy = 0 - _jsmax(0.2, abs(dy))
        self.point_in_direction((fd_atan2(dy, dx) * 180 / math.pi) + 90)
        # keepInFence: move fully back inside the stage
        nb = self.bounds()
        mx = 0
        my = 0
        if nb.left < -STAGE_W / 2:
            mx += (-STAGE_W / 2) - nb.left
        if nb.right > STAGE_W / 2:
            mx += (STAGE_W / 2) - nb.right
        if nb.top > STAGE_H / 2:
            my += (STAGE_H / 2) - nb.top
        if nb.bottom < -STAGE_H / 2:
            my += (-STAGE_H / 2) - nb.bottom
        self.go_to(self.x + mx, self.y + my)

    def set_rotation_style(self, s):
        self.rotation_style = str_(s)

    # --- looks
    def switch_costume(self, req):
        self._set_costume(req)

    def next_costume(self):
        self._set_costume('next costume')

    def show(self):
        self.visible = True

    def hide(self):
        self.visible = False

    def set_size(self, v):
        c = self.costume
        s = num(v)
        if c and c['width'] > 0 and c['height'] > 0:
            min_s = _jsmin(1, _jsmax(5 / c['width'], 5 / c['height']))
            max_s = _jsmin(1.5 * STAGE_W / c['width'], 1.5 * STAGE_H / c['height'])
            s = _jsmax(min_s, _jsmin(max_s, s / 100)) * 100
        self.size = s

    def change_size(self, v):
        self.set_size(self.size + num(v))

    def get_size(self):
        return _jsround(self.size)

    def say(self, text):
        self.bubble = None if (text is None or (isinstance(text, str) and text == '')) else Bubble('say', str_(text))
        self._bubble_token += 1

    def think(self, text):
        self.bubble = None if (text is None or (isinstance(text, str) and text == '')) else Bubble('think', str_(text))
        self._bubble_token += 1

    def say_for(self, text, secs):
        self.say(text)
        tok = self._bubble_token
        yield from self.game.wait(secs)
        if tok == self._bubble_token:
            self.bubble = None

    def think_for(self, text, secs):
        self.think(text)
        tok = self._bubble_token
        yield from self.game.wait(secs)
        if tok == self._bubble_token:
            self.bubble = None

    def go_to_front(self):
        self.game._layer(self, 'front')

    def go_to_back(self):
        self.game._layer(self, 'back')

    def go_forward(self, n):
        self.game._layer(self, 'forward', num(n))

    def go_backward(self, n):
        self.game._layer(self, 'backward', num(n))

    # --- sensing
    def touching(self, what):
        w = str_(what)
        if not self.visible:
            return False
        b = self.bounds()
        if w == '_mouse_':
            m = self.game.mouse
            return m.x >= b.left and m.x <= b.right and m.y >= b.bottom and m.y <= b.top
        if w == '_edge_':
            return b.left < -STAGE_W / 2 or b.right > STAGE_W / 2 or b.top > STAGE_H / 2 or b.bottom < -STAGE_H / 2
        for o in self.game.sprites_named(w):
            if o is self or not o.visible or not o.alive:
                continue
            ob = o.bounds()
            if b.left < ob.right and b.right > ob.left and b.bottom < ob.top and b.top > ob.bottom:
                return True
        return False

    # --- pen
    def pen_down(self):
        self.pen['down'] = True
        self.game.pen.dot(self)

    def pen_up(self):
        self.pen['down'] = False

    def stamp(self):
        self.game.pen.stamp(self)

    def set_pen_color(self, c):
        r, g, b, a = color_to_rgb(c)
        h, s, v = rgb_to_hsv(r, g, b)
        self.pen.update({'hue': h / 3.6, 'saturation': s * 100, 'brightness': v * 100,
                         'transparency': 100 * (1 - (a / 255))})

    def _pen_param(self, p, v, change):
        k = {'color': 'hue', 'saturation': 'saturation', 'brightness': 'brightness',
             'transparency': 'transparency'}.get(str_(p).lower())
        if not k:
            return
        n = (self.pen[k] if change else 0) + num(v)
        if k == 'hue':
            n = _wrap_clamp(n, 0, 100)
        else:
            n = _jsmax(0, _jsmin(100, n))
        self.pen[k] = n

    def set_pen_param(self, p, v):
        self._pen_param(p, v, False)

    def change_pen_param(self, p, v):
        self._pen_param(p, v, True)

    def set_pen_size(self, v):
        self.pen['size'] = _jsmax(1, _jsmin(1200, num(v)))

    def change_pen_size(self, v):
        self.set_pen_size(self.pen['size'] + num(v))

    def pen_rgba(self):
        r, g, b = hsv_to_rgb(self.pen['hue'] * 3.6, self.pen['saturation'] / 100, self.pen['brightness'] / 100)
        return [r, g, b, 1 - (self.pen['transparency'] / 100)]

    # --- clones
    def delete_this_clone(self):
        if not self.is_clone:
            return
        self.game._remove_clone(self)
        raise StopThread()


# ---------------------------------------------------------------- pen & audio adapters

class NullPen:
    def __init__(self):
        self.ops = 0

    def clear(self):
        self.ops += 1

    def dot(self, sprite):
        self.ops += 1

    def line(self, sprite, x0, y0, x1, y1):
        self.ops += 1

    def stamp(self, sprite):
        self.ops += 1


class NullAudio:
    def __init__(self):
        self.played = []

    def play(self, sound, volume=100):
        self.played.append(sound['name'])

    def stop_all(self):
        pass


# ---------------------------------------------------------------- game

class Mouse:
    __slots__ = ('x', 'y', 'down')

    def __init__(self):
        self.x = 0.0
        self.y = 0.0
        self.down = False


class Script:
    __slots__ = ('target', 'hat', 'arg', 'fn')

    def __init__(self, target, hat, arg, fn):
        self.target = target
        self.hat = hat
        self.arg = arg
        self.fn = fn


class Thread:
    __slots__ = ('target', 'script', 'gen', 'done')

    def __init__(self, target, script, gen):
        self.target = target
        self.script = script
        self.gen = gen
        self.done = False


class AskEntry:
    __slots__ = ('target', 'question', 'done', 'typed')

    def __init__(self, target, question):
        self.target = target
        self.question = question
        self.done = False
        self.typed = ''


class Game:
    def __init__(self, manifest, *, deterministic=True, realtime=False, seed=None, pen=None, audio=None,
                 on_ask=None, on_error=None):
        self.manifest = manifest
        self.contract = CONTRACT
        self.deterministic = deterministic is not False and realtime is not True
        self.seed = 1 if seed is None else seed
        self.pen = pen or NullPen()
        self.audio = audio or NullAudio()
        self.scripts = []
        self.procs = {}
        self.on_ask = on_ask
        self.on_error = on_error
        self.current = None
        self.idle = False
        self.stage = None
        self._init()

    def _init(self):
        self.random = make_rng(self.seed)
        self.frame = 0
        self.timer_start_ms = 0
        self.threads = []
        self.keys = set()
        self.mouse = Mouse()
        self.answer = ''
        self.asking = None
        self.ask_queue = []
        # Reset the stage in place: generated setup() captured `stage = game.stage`.
        stage = Stage(self, self.manifest['stage'])
        if self.stage is not None:
            self.stage.__dict__.clear()
            self.stage.__dict__.update(stage.__dict__)
        else:
            self.stage = stage
        self.sprites = [Sprite(self, d) for d in self.manifest['sprites']]
        # drawing order, back to front; manifest lists sprites by layerOrder
        self.layers = sorted(self.sprites, key=lambda s: s.def_.get('layerOrder') or 0)
        self.monitors = [dict(m) for m in (self.manifest.get('monitors') or [])]
        self.clone_count = 0
        self.stopped = False
        self.pen.clear()

    # --- registration (called by generated code)
    def on(self, target_name, hat, arg, fn):
        self.scripts.append(Script(target_name, hat, None if arg is None else str_(arg), fn))

    # --- clock (milliseconds, like scratch-vm; deterministic mode counts frames)
    def now_ms(self):
        return (self.frame * 1000) / FPS if self.deterministic else time.perf_counter() * 1000

    def now(self):
        return self.now_ms() / 1000

    def timer(self):
        return (self.now_ms() - self.timer_start_ms) / 1000

    def reset_timer(self):
        self.timer_start_ms = self.now_ms()

    # scratch-vm control_wait: start a timer, yield once, then yield until
    # elapsed >= duration (compared in milliseconds, float error included).
    def wait(self, secs):
        start = self.now_ms()
        dur = _jsmax(0, 1000 * num(secs))
        yield WAIT
        while self.now_ms() - start < dur:
            yield WAIT

    def wait_until(self, cond):
        while not bool_(cond()):
            yield WAIT

    def warp(self, gen):
        while True:
            try:
                v = next(gen)
            except StopIteration as e:
                return e.value
            if v is WAIT:
                yield WAIT

    def wait_threads(self, threads):
        yield WAIT
        while any(not t.done for t in threads):
            yield WAIT

    # --- lookup
    def target(self, name):
        return self.stage if (name == '_stage_' or name == self.stage.name) else self.sprite(name)

    def sprite(self, name):
        for s in self.sprites:
            if s.name == name and not s.is_clone and s.alive:
                return s
        return None

    def sprites_named(self, name):
        return [s for s in self.layers if s.name == name and s.alive]

    # --- hats
    def _hat_targets(self, name):
        if name == self.stage.name or name == '_stage_':
            return [self.stage]
        return [s for s in reversed(self.layers) if s.name == name and s.alive]

    def _start(self, match, restart, only=None):
        started = []
        order = list(reversed(self.layers)) + [self.stage]
        for t in order:
            if only is not None and t is not only:
                continue
            if not t.alive:
                continue
            key = '_stage_' if t.is_stage else t.name
            for sc in self.scripts:
                if sc.target != key:
                    continue
                if not match(sc):
                    continue
                existing = None
                for th in self.threads:
                    if th.target is t and th.script is sc and not th.done:
                        existing = th
                        break
                if existing is not None:
                    if not restart:
                        continue
                    existing.gen = sc.fn(t)
                    started.append(existing)
                    continue
                th = Thread(t, sc, sc.fn(t))
                self.threads.append(th)
                started.append(th)
        return started

    def green_flag(self):
        self.stop_all()
        self.stopped = False
        self.reset_timer()
        return self._start(lambda sc: sc.hat == 'flag', True)

    def restart(self):
        self._init()
        return self.green_flag()

    def broadcast(self, name):
        n = str_(name).lower()
        return self._start(lambda sc: sc.hat == 'broadcast' and sc.arg is not None and sc.arg.lower() == n, True)

    def broadcast_and_wait(self, name):
        yield from self.wait_threads(self.broadcast(name))

    def _fire_backdrop(self, name):
        return self._start(lambda sc: sc.hat == 'backdrop' and sc.arg == name, False)

    def key_down(self, key):
        k = scratch_key(key)
        self.keys.add(k)
        if self.asking:
            self._ask_key(key)
            return
        self._start(lambda sc: sc.hat == 'key' and (sc.arg == k or sc.arg == 'any'), False)

    def key_up(self, key):
        self.keys.discard(scratch_key(key))

    def key_pressed(self, key):
        k = scratch_key(key)
        if k == 'any':
            return len(self.keys) > 0
        return k in self.keys

    def mouse_move(self, x, y):
        self.mouse.x = num(x)
        self.mouse.y = num(y)

    def mouse_down(self, x=_MISSING, y=_MISSING):
        if x is not _MISSING:
            self.mouse_move(x, UNDEFINED if y is _MISSING else y)
        self.mouse.down = True
        # topmost visible sprite under the pointer receives the click
        for s in list(reversed(self.layers)):
            if not s.alive or not s.visible:
                continue
            b = s.bounds()
            m = self.mouse
            if m.x >= b.left and m.x <= b.right and m.y >= b.bottom and m.y <= b.top:
                self._start(lambda sc: sc.hat == 'clicked', True, s)
                return
        self._start(lambda sc: sc.hat == 'clicked' and sc.target == '_stage_', True, self.stage)

    def mouse_up(self):
        self.mouse.down = False

    # --- clones and layers
    def _clone(self, src):
        if self.clone_count >= 300:
            return None
        c = Sprite(self, src.def_)
        c.x = src.x
        c.y = src.y
        c.direction = src.direction
        c.size = src.size
        c.visible = src.visible
        c.rotation_style = src.rotation_style
        c.costume_index = src.costume_index
        c.volume = src.volume
        c.is_clone = True
        c.original = src.original
        c.vars = Vars(src.vars)
        c.lists = {k: list(v) for k, v in src.lists.items()}
        c.effects = dict(src.effects)
        c.pen = dict(src.pen)
        self.sprites.append(c)
        # a clone sits directly behind its parent (JS indexOf -1 → splice(-1) quirk kept)
        i = _index_of(self.layers, src)
        self.layers.insert(i, c)
        self.clone_count += 1
        self._start(lambda sc: sc.hat == 'clone', False, c)
        return c

    def _remove_clone(self, c):
        c.alive = False
        for th in self.threads:
            if th.target is c:
                th.done = True
        self.sprites = [s for s in self.sprites if s is not c]
        self.layers = [s for s in self.layers if s is not c]
        self.clone_count -= 1

    def _layer(self, s, how, n=1):
        i = _index_of(self.layers, s)
        if i < 0:
            return
        del self.layers[i]
        L = len(self.layers)
        if how == 'front':
            j = L
        elif how == 'back':
            j = 0
        elif how == 'forward':
            j = _jsmax(0, _jsmin(L, i + _jsround(n)))
        else:
            j = _jsmax(0, _jsmin(L, i - _jsround(n)))
        self.layers.insert(int(j), s)

    # --- stopping
    def stop_all(self):
        for th in self.threads:
            th.done = True
        self.threads = []
        for s in list(self.sprites):
            if s.is_clone:
                self._remove_clone(s)
        for s in self.sprites:
            s.clear_effects()
            s.bubble = None
        self.stage.clear_effects()
        self.audio.stop_all()
        self.asking = None
        self.ask_queue = []
        self.stopped = True

    def stop_all_and_throw(self):
        self.stop_all()
        raise StopThread()

    def stop_other_scripts(self, target):
        for th in self.threads:
            if th.target is target and th is not self.current:
                th.done = True

    # --- ask / answer
    def ask(self, target, question):
        entry = AskEntry(target, str_(question))
        self.ask_queue.append(entry)
        if not self.asking:
            self._next_ask()
        while not entry.done:
            yield WAIT

    def _next_ask(self):
        self.asking = self.ask_queue[0] if self.ask_queue else None
        if not self.asking:
            return
        self.asking.typed = ''
        if not self.asking.target.is_stage and self.asking.target.visible:
            self.asking.target.say(self.asking.question)
        if self.on_ask:
            self.on_ask(self.asking)

    def _ask_key(self, key):
        a = self.asking
        if key in ('Enter', 'enter', 'Return'):
            self.submit_answer(a.typed)
            return
        if key in ('Backspace', 'backspace'):
            if a.typed:
                # JS slice(0, -1) drops one UTF-16 code unit
                u = _u16(a.typed)
                a.typed = u[:-2].decode('utf-16-be', 'surrogatepass')
            return
        ks = str_(key)
        if _u16len(ks) == 1:
            a.typed = _u16fix(a.typed + ks)
        elif scratch_key(key) == 'space':
            a.typed += ' '

    def submit_answer(self, text):
        a = self.asking
        if not a:
            return
        self.answer = str_(text)
        if not a.target.is_stage:
            a.target.say('')
        a.done = True
        self.ask_queue.pop(0)
        self._next_ask()

    # --- monitors
    def show_variable(self, target, name, show):
        m = None
        for x in self.monitors:
            if x.get('kind') == 'var' and x.get('target') == target and x.get('name') == name:
                m = x
                break
        if m is None:
            m = {'id': '%s:%s' % (target, name), 'kind': 'var', 'target': target, 'name': name,
                 'label': name if target == '_stage_' else '%s: %s' % (target, name), 'visible': False,
                 'mode': 'default', 'x': 5, 'y': 5 + (27 * len(self.monitors))}
            self.monitors.append(m)
        m['visible'] = bool(show)

    def monitor_value(self, m):
        t = self.stage if m.get('target') == '_stage_' else self.sprite(m.get('target'))
        if not t:
            return ''
        if m.get('kind') == 'list':
            return lists.join(t.lists.get(m.get('name')) or [])
        if m.get('name') not in t.vars:
            return ''
        v = t.vars[m.get('name')]
        if v is UNDEFINED:
            return ''
        return _fmt_num(v) if _is_num(v) else str_(v)

    # --- one frame
    def step(self):
        self.frame += 1
        threads = self.threads
        i = 0
        while i < len(threads):
            th = threads[i]
            i += 1
            if th.done:
                continue
            self.current = th
            try:
                next(th.gen)
            except StopIteration:
                th.done = True
            except StopThread:
                th.done = True
            except Exception as e:  # noqa: BLE001 - mirrors bwgame.js onError
                th.done = True
                if self.on_error:
                    self.on_error(e, th)
                else:
                    raise
        self.current = None
        self.threads = [t for t in self.threads if not t.done]
        if len(self.threads) == 0 and not self.stopped and self.frame > 0:
            self.idle = True

    def run(self, frames):
        for _ in range(int(frames)):
            self.step()

    def apply_event(self, e):
        """Apply one input-trace event (shared by run_trace and the window's trace replay)."""
        typ = e.get('type')
        if typ == 'flag':
            self.green_flag()
        elif typ == 'keydown':
            self.key_down(e.get('key', UNDEFINED))
        elif typ == 'keyup':
            self.key_up(e.get('key', UNDEFINED))
        elif typ == 'mousemove':
            self.mouse_move(e.get('x', UNDEFINED), e.get('y', UNDEFINED))
        elif typ == 'mousedown':
            self.mouse_down(e.get('x', UNDEFINED), e.get('y', UNDEFINED)) if 'x' in e else self.mouse_down()
        elif typ == 'mouseup':
            self.mouse_up()
        elif typ == 'answer':
            self.submit_answer(e.get('text', UNDEFINED))

    # Drive the game from a scripted input trace (identical in bwgame.js):
    # { frames, sample: [frame...], events: [{ frame, type, key?, x?, y?, text? }] }.
    # Events for frame f are applied before the step that produces frame f + 1.
    def run_trace(self, trace):
        out = []
        sample = set(trace.get('sample') or [])
        events = trace.get('events') or []
        for f in range(int(trace['frames'])):
            for e in events:
                if e.get('frame') != f or isinstance(e.get('frame'), bool):
                    continue
                self.apply_event(e)
            self.step()
            if (f + 1) in sample:
                out.append(self.snapshot())
        return out

    # --- state snapshot (identical shape in bwgame.js)
    def snapshot(self):
        def sprite(s):
            return {
                'name': s.name, 'clone': s.is_clone, 'x': _fmt_num(s.x), 'y': _fmt_num(s.y),
                'direction': _fmt_num(s.direction), 'size': _fmt_num(s.size), 'costume': s.costume_index + 1,
                'visible': s.visible, 'vars': _fmt_vars(s.vars), 'lists': _fmt_lists(s.lists),
                'bubble': s.bubble.text if s.bubble else None,
            }
        return {
            'frame': self.frame,
            'backdrop': self.stage.costume_index + 1,
            'vars': _fmt_vars(self.stage.vars),
            'lists': _fmt_lists(self.stage.lists),
            'layers': [sprite(s) for s in self.layers if s.alive],
            'threads': len([t for t in self.threads if not t.done]),
            'answer': self.answer,
        }


def _index_of(lst, item):
    for i, x in enumerate(lst):
        if x is item:
            return i
    return -1


# Round to 6 decimals so JS and Python agree despite last-bit trig differences.
def _fmt_num(n):
    return _jsround(_to_number(n) * 1e6) / 1e6 if _is_num(n) else n


def _fmt_val(v):
    if isinstance(v, bool):
        return str_(v)
    if _is_num(v):
        return _fmt_num(v)
    return v


def _js_sorted_keys(d):
    # JS Array#sort default: UTF-16 code unit order (== UTF-16-BE byte order)
    return sorted(d.keys(), key=_u16)


def _fmt_vars(vs):
    return {k: _fmt_val(vs[k]) for k in _js_sorted_keys(vs)}


def _fmt_lists(ls):
    return {k: [_fmt_val(x) for x in ls[k]] for k in _js_sorted_keys(ls)}


# ---------------------------------------------------------------- JSON.stringify twin

_IDX_RE = re.compile(r'0|[1-9][0-9]*')
_JSON_ESC = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'}
_JSON_ESC_RE = re.compile('["\\\\\x00-\x1f\ud800-\udfff]')


def _json_str(s):
    s = _u16fix(s)
    return '"' + _JSON_ESC_RE.sub(lambda m: _JSON_ESC.get(m.group(0)) or '\\u%04x' % ord(m.group(0)), s) + '"'


def _js_key_order(d):
    idx = []
    rest = []
    for k in d:
        if _IDX_RE.fullmatch(k) and int(k) < 4294967295:
            idx.append(k)
        else:
            rest.append(k)
    idx.sort(key=int)
    return idx + rest


def js_json(v):
    """JSON.stringify(v) with JavaScript number formatting and key order."""
    if v is None or v is UNDEFINED:
        return 'null'
    if v is True:
        return 'true'
    if v is False:
        return 'false'
    if isinstance(v, (int, float)):
        x = _to_number(v)
        return _num_to_str(x) if _is_finite(x) else 'null'
    if isinstance(v, str):
        return _json_str(v)
    if isinstance(v, (list, tuple)):
        return '[' + ','.join(js_json(x) for x in v) + ']'
    if isinstance(v, dict):
        parts = []
        for k in _js_key_order(v):
            x = v[k]
            if x is UNDEFINED or callable(x):
                continue
            parts.append(_json_str(k) + ':' + js_json(x))
        return '{' + ','.join(parts) + '}'
    return _json_str(str(v))


# ---------------------------------------------------------------- list helpers

def list_index(idx, length_, rng):
    if not _is_num(idx):
        s = str_(idx)
        if s == 'all':
            return 'all'
        if s == 'last':
            return length_ if length_ > 0 else 0
        if s == 'random' or s == 'any':
            return 1 + int(_jsfloor(rng() * length_)) if length_ > 0 else 0
    n = _jsfloor(num(idx))
    return 0 if (n < 1 or n > length_) else int(n)


class _Lists:
    @staticmethod
    def add(l, v):
        l.append(v)

    @staticmethod
    def delete(game, l, i):
        k = list_index(i, len(l), game.random)
        if k == 'all':
            l.clear()
            return
        if k:
            del l[k - 1]

    @staticmethod
    def clear(l):
        l.clear()

    @staticmethod
    def insert(game, l, i, v):
        k = list_index(i, len(l) + 1, game.random)
        if k and k != 'all':
            l.insert(k - 1, v)

    @staticmethod
    def replace(game, l, i, v):
        k = list_index(i, len(l), game.random)
        if k and k != 'all':
            l[k - 1] = v

    @staticmethod
    def item(game, l, i):
        k = list_index(i, len(l), game.random)
        return l[k - 1] if (k and k != 'all') else ''

    @staticmethod
    def index_of(l, v):
        for i, x in enumerate(l):
            if eq(x, v):
                return i + 1
        return 0

    @staticmethod
    def length(l):
        return len(l)

    @staticmethod
    def contains(l, v):
        return any(eq(x, v) for x in l)

    @staticmethod
    def join(l):
        # Scratch joins with spaces unless every item is a single character
        parts = [str_(x) for x in l]
        all_single = all(_u16len(p) == 1 for p in parts)
        return _u16fix(('' if all_single else ' ').join(parts))


lists = _Lists()


def random_(game, a, b):
    lo = num(a)
    hi = num(b)
    low = _jsmin(lo, hi)
    high = _jsmax(lo, hi)

    def is_int(v):
        if _is_num(v):
            x = _to_number(v)
            return _is_finite(x) and x == math.floor(x)
        return '.' not in str_(v)
    if low == high:
        return low
    if is_int(a) and is_int(b):
        return low + _jsfloor(game.random() * ((high + 1) - low))
    return (game.random() * (high - low)) + low


def attribute_of(game, attr, obj_name):
    a = str_(attr)
    if isinstance(obj_name, str) and obj_name == '_stage_':
        st = game.stage
        if a == 'backdrop #':
            return st.backdrop_number()
        if a == 'backdrop name':
            return st.backdrop_name()
        if a == 'volume':
            return st.volume
        return st.vars[a] if a in st.vars else 0
    s = game.sprite(str_(obj_name))
    if not s:
        return 0
    if a == 'x position':
        return s.get_x()
    if a == 'y position':
        return s.get_y()
    if a == 'direction':
        return s.direction
    if a == 'costume #':
        return s.costume_number()
    if a == 'costume name':
        return s.costume_name()
    if a == 'size':
        return s.get_size()
    if a == 'volume':
        return s.volume
    return s.vars[a] if a in s.vars else 0


def current(what):
    import datetime
    d = datetime.datetime.now()
    w = str_(what).lower()
    if w == 'year':
        return d.year
    if w == 'month':
        return d.month
    if w == 'date':
        return d.day
    if w == 'dayofweek':
        return (d.isoweekday() % 7) + 1
    if w == 'hour':
        return d.hour
    if w == 'minute':
        return d.minute
    if w == 'second':
        return d.second
    return 0


def days_since_2000():
    return (math.floor(time.time() * 1000) - 946684800000) / 86400000


# ---------------------------------------------------------------- loading an export

def load_manifest(path):
    import json
    with open(path, 'r', encoding='utf-8') as fh:
        return json.load(fh)


def load_setup(export_dir):
    """Import <export_dir>/game.py and return its setup(game). Makes `import bwgame` resolve to
    this very module, so WAIT/StopThread identities are shared."""
    import importlib.util
    import os
    me = sys.modules.get(__name__)
    if me is not None:
        sys.modules.setdefault('bwgame', me)
        if sys.modules['bwgame'] is not me and __name__ == '__main__':
            sys.modules['bwgame'] = me
    path = os.path.join(export_dir, 'game.py')
    spec = importlib.util.spec_from_file_location('bwgame_export_game', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.setup


# ---------------------------------------------------------------- pygame host

class _Renderer:
    """Draws a Game onto a pygame surface. Coordinates: stage units × scale."""

    def __init__(self, pygame, game_dir, manifest, scale):
        self.pg = pygame
        self.dir = game_dir
        self.manifest = manifest
        self.scale = scale
        self.W = int(STAGE_W * scale)
        self.H = int(STAGE_H * scale)
        self.base = {}
        self.cache = {}
        self.pen_layer = pygame.Surface((self.W, self.H), pygame.SRCALPHA)
        self.font = pygame.font.Font(None, max(10, int(17 * scale)))
        self.small = pygame.font.Font(None, max(9, int(15 * scale)))

    # --- assets
    def _load_costume(self, c):
        key = c.get('file')
        if key in self.base:
            return self.base[key]
        import os
        pg = self.pg
        path = os.path.join(self.dir, c.get('file') or '')
        surf = None
        tw = max(1, int(round(c['width'] * self.scale)))
        th = max(1, int(round(c['height'] * self.scale)))
        try:
            if c.get('format') == 'svg' and self.scale != 1:
                surf = self._load_svg_scaled(path, c)
            if surf is None:
                surf = pg.image.load(path)
            surf = surf.convert_alpha() if pg.display.get_surface() else surf
            if surf.get_size() != (tw, th):
                surf = pg.transform.smoothscale(surf, (tw, th))
        except Exception:  # noqa: BLE001 - a missing/broken asset draws nothing
            surf = None
        self.base[key] = surf
        return surf

    def _load_svg_scaled(self, path, c):
        import io
        try:
            with open(path, 'rb') as fh:
                text = fh.read().decode('utf-8', 'replace')
        except OSError:
            return None
        m = re.search(r'<svg\b[^>]*>', text, re.I)
        if not m:
            return None
        tag = m.group(0)
        res = c.get('resolution') or 1
        w0, h0 = c['width'] * res, c['height'] * res
        new = re.sub(r'\s(width|height)\s*=\s*["\'][^"\']*["\']', '', tag)
        extra = ' width="%g" height="%g"' % (c['width'] * self.scale, c['height'] * self.scale)
        if not re.search(r'viewBox', tag, re.I):
            extra += ' viewBox="0 0 %g %g"' % (w0, h0)
        new = new[:4] + extra + new[4:]
        try:
            return self.pg.image.load(io.BytesIO((text[:m.start()] + new + text[m.end():]).encode('utf-8')), 'x.svg')
        except Exception:  # noqa: BLE001
            return None

    # --- sprites
    def _sprite_surface(self, s):
        c = s.costume
        if not c:
            return None
        base = self._load_costume(c)
        if base is None:
            return None
        f = s.size / 100
        flip = s.rotation_style == 'left-right' and s.direction < 0
        deg = (s.direction - 90) if s.rotation_style == 'all around' else 0
        ghost = _jsmax(0, _jsmin(100, s.effects.get('ghost', 0) or 0))
        bright = _jsmax(-100, _jsmin(100, s.effects.get('brightness', 0) or 0))
        key = (c.get('file'), round(f, 4), round(deg, 3), flip, round(ghost, 2), round(bright, 2))
        hit = self.cache.get(key)
        if hit is not None:
            return hit
        pg = self.pg
        w = max(1, int(round(base.get_width() * f)))
        h = max(1, int(round(base.get_height() * f)))
        img = base if (w, h) == base.get_size() else pg.transform.smoothscale(base, (w, h))
        cx = c['cx'] * self.scale * f
        cy = c['cy'] * self.scale * f
        if flip:
            img = pg.transform.flip(img, True, False)
            cx = w - cx
        if bright or ghost:
            img = img.copy()
            if bright > 0:
                v = int(255 * bright / 100)
                img.fill((v, v, v, 0), special_flags=pg.BLEND_RGB_ADD)
            elif bright < 0:
                v = int(255 * -bright / 100)
                img.fill((v, v, v, 0), special_flags=pg.BLEND_RGB_SUB)
            if ghost:
                img.fill((255, 255, 255, int(round(255 * (1 - ghost / 100)))), special_flags=pg.BLEND_RGBA_MULT)
        # offset of the image centre from the rotation centre (screen coords, y down)
        dx, dy = (w / 2) - cx, (h / 2) - cy
        if deg:
            img = pg.transform.rotate(img, -deg)
            t = math.radians(deg)
            dx, dy = dx * math.cos(t) - dy * math.sin(t), dx * math.sin(t) + dy * math.cos(t)
        out = (img, dx, dy)
        if len(self.cache) > 600:
            self.cache.clear()
        self.cache[key] = out
        return out

    def to_screen(self, x, y):
        return ((STAGE_W / 2 + x) * self.scale, (STAGE_H / 2 - y) * self.scale)

    def draw_sprite(self, dest, s):
        r = self._sprite_surface(s)
        if not r:
            return
        img, dx, dy = r
        if not (_is_finite(s.x) and _is_finite(s.y)):
            return
        px, py = self.to_screen(s.x, s.y)
        rect = img.get_rect(center=(round(px + dx), round(py + dy)))
        dest.blit(img, rect)

    # --- pen adapter callbacks
    def pen_clear(self):
        self.pen_layer.fill((0, 0, 0, 0))

    def _pen_color(self, s):
        r, g, b, a = s.pen_rgba()
        return (r, g, b, int(round(255 * _jsmax(0, _jsmin(1, a)))))

    def _with_alpha(self, color, draw):
        pg = self.pg
        if color[3] >= 255:
            draw(self.pen_layer, color)
        else:
            tmp = pg.Surface(self.pen_layer.get_size(), pg.SRCALPHA)
            draw(tmp, color[:3] + (255,))
            tmp.fill((255, 255, 255, color[3]), special_flags=pg.BLEND_RGBA_MULT)
            self.pen_layer.blit(tmp, (0, 0))

    def pen_dot(self, s):
        col = self._pen_color(s)
        p = self.to_screen(s.x, s.y)
        rad = max(0.5, s.pen['size'] / 2) * self.scale
        self._with_alpha(col, lambda surf, c: self.pg.draw.circle(surf, c, (round(p[0]), round(p[1])), max(1, round(rad))))

    def pen_line(self, s, x0, y0, x1, y1):
        if not all(_is_finite(v) for v in (x0, y0, x1, y1)):
            return
        col = self._pen_color(s)
        a = self.to_screen(x0, y0)
        b = self.to_screen(x1, y1)
        wid = max(1, round(s.pen['size'] * self.scale))
        pg = self.pg

        def draw(surf, c):
            pg.draw.line(surf, c, a, b, wid)
            if wid > 2:
                for q in (a, b):
                    pg.draw.circle(surf, c, (round(q[0]), round(q[1])), wid / 2)
        self._with_alpha(col, draw)

    def pen_stamp(self, s):
        if s.visible or True:
            self.draw_sprite(self.pen_layer, s)

    # --- frame
    def draw(self, screen, game):
        screen.fill((255, 255, 255))
        st = game.stage
        c = st.costume
        if c:
            base = self._load_costume(c)
            if base is not None:
                screen.blit(base, ((STAGE_W / 2 - c['cx']) * self.scale, (STAGE_H / 2 - c['cy']) * self.scale))
        screen.blit(self.pen_layer, (0, 0))
        for s in game.layers:
            if s.alive and s.visible:
                self.draw_sprite(screen, s)
        for s in game.layers:
            if s.alive and s.visible and s.bubble:
                self._bubble(screen, s)
        for m in game.monitors:
            if m.get('visible'):
                self._monitor(screen, game, m)
        if game.asking:
            self._ask(screen, game)

    def _wrap(self, font, text, width):
        words = text.split(' ')
        lines = []
        cur = ''
        for w in words:
            t = (cur + ' ' + w) if cur else w
            if font.size(t)[0] <= width or not cur:
                cur = t
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)
        return lines[:8]

    def _bubble(self, screen, s):
        pg = self.pg
        sc = self.scale
        b = s.bounds()
        lines = self._wrap(self.small, s.bubble.text, 160 * sc)
        lh = self.small.get_linesize()
        tw = max(self.small.size(l)[0] for l in lines) if lines else 0
        bw = max(tw, 20 * sc) + 16 * sc
        bh = lh * len(lines) + 12 * sc
        x, y = self.to_screen(b.right, b.top)
        x = min(max(0, x), self.W - bw)
        y = min(max(0, y - bh - 8 * sc), self.H - bh)
        rect = pg.Rect(int(x), int(y), int(bw), int(bh))
        pg.draw.rect(screen, (255, 255, 255), rect, border_radius=int(10 * sc))
        pg.draw.rect(screen, (160, 160, 170), rect, max(1, int(2 * sc)), border_radius=int(10 * sc))
        if s.bubble.kind == 'think':
            for i, r in enumerate((4, 3)):
                pg.draw.circle(screen, (160, 160, 170), (int(x + (10 + 6 * i) * sc), int(y + bh + (5 + 6 * i) * sc)), max(1, int(r * sc)), 1)
        else:
            tip = [(x + 14 * sc, y + bh - 1), (x + 26 * sc, y + bh - 1), (x + 10 * sc, y + bh + 9 * sc)]
            pg.draw.polygon(screen, (255, 255, 255), tip)
            pg.draw.lines(screen, (160, 160, 170), False, [tip[1], tip[2], tip[0]], max(1, int(2 * sc)))
        for i, l in enumerate(lines):
            screen.blit(self.small.render(l, True, (40, 40, 50)), (x + 8 * sc, y + 6 * sc + i * lh))

    def _monitor(self, screen, game, m):
        pg = self.pg
        sc = self.scale
        val = game.monitor_value(m)
        vs = str_(val)
        x = (m.get('x') or 0) * sc
        y = (m.get('y') or 0) * sc
        vimg = self.small.render(vs, True, (255, 255, 255))
        pad = 4 * sc
        vw = max(vimg.get_width() + 2 * pad, 30 * sc)
        vh = vimg.get_height() + 2 * pad
        if m.get('mode') == 'large':
            r = pg.Rect(int(x), int(y), int(vw), int(vh))
            pg.draw.rect(screen, (255, 140, 26), r, border_radius=int(4 * sc))
            screen.blit(vimg, vimg.get_rect(center=r.center))
            return
        limg = self.small.render(str_(m.get('label') or m.get('name') or ''), True, (87, 94, 117))
        w = limg.get_width() + vw + 4 * pad
        h = vh + 2 * pad
        outer = pg.Rect(int(x), int(y), int(w), int(h))
        pg.draw.rect(screen, (230, 240, 255), outer, border_radius=int(4 * sc))
        pg.draw.rect(screen, (196, 204, 220), outer, 1, border_radius=int(4 * sc))
        screen.blit(limg, (x + pad, y + (h - limg.get_height()) / 2))
        vr = pg.Rect(int(x + limg.get_width() + 2 * pad), int(y + pad), int(vw), int(vh))
        pg.draw.rect(screen, (255, 140, 26), vr, border_radius=int(4 * sc))
        screen.blit(vimg, vimg.get_rect(center=vr.center))

    def _ask(self, screen, game):
        pg = self.pg
        sc = self.scale
        a = game.asking
        h = 34 * sc + (18 * sc if a.target.is_stage else 0)
        r = pg.Rect(int(6 * sc), int(self.H - h - 6 * sc), int(self.W - 12 * sc), int(h))
        pg.draw.rect(screen, (255, 255, 255), r, border_radius=int(8 * sc))
        pg.draw.rect(screen, (133, 92, 214), r, max(1, int(2 * sc)), border_radius=int(8 * sc))
        y = r.y + 6 * sc
        if a.target.is_stage:
            screen.blit(self.small.render(a.question, True, (60, 60, 70)), (r.x + 8 * sc, y))
            y += 18 * sc
        box = pg.Rect(int(r.x + 8 * sc), int(y), int(r.w - 16 * sc), int(22 * sc))
        pg.draw.rect(screen, (245, 245, 250), box, border_radius=int(11 * sc))
        caret = '|' if (pg.time.get_ticks() // 500) % 2 == 0 else ''
        screen.blit(self.small.render(a.typed + caret, True, (30, 30, 40)), (box.x + 8 * sc, box.y + 4 * sc))


class _WindowPen:
    def __init__(self):
        self.r = None
        self.ops = 0

    def clear(self):
        self.ops += 1
        if self.r:
            self.r.pen_clear()

    def dot(self, s):
        self.ops += 1
        if self.r:
            self.r.pen_dot(s)

    def line(self, s, x0, y0, x1, y1):
        self.ops += 1
        if self.r:
            self.r.pen_line(s, x0, y0, x1, y1)

    def stamp(self, s):
        self.ops += 1
        if self.r:
            self.r.pen_stamp(s)


class _WindowAudio:
    def __init__(self, pygame, game_dir):
        import os
        self.pg = pygame
        self.dir = game_dir
        self.os = os
        self.sounds = {}
        self.played = []
        self.ok = False
        try:
            if not pygame.mixer.get_init():
                pygame.mixer.init()
            pygame.mixer.set_num_channels(32)
            self.ok = True
        except Exception:  # noqa: BLE001 - no audio device: run silently
            self.ok = False

    def play(self, sound, volume=100):
        self.played.append(sound.get('name'))
        if not self.ok:
            return
        f = sound.get('file')
        snd = self.sounds.get(f)
        if snd is None and f not in self.sounds:
            try:
                snd = self.pg.mixer.Sound(self.os.path.join(self.dir, f))
            except Exception:  # noqa: BLE001
                snd = None
            self.sounds[f] = snd
        if snd is not None:
            try:
                snd.set_volume(max(0.0, min(1.0, float(num(volume)) / 100)))
                snd.play()
            except Exception:  # noqa: BLE001
                pass

    def stop_all(self):
        if self.ok:
            try:
                self.pg.mixer.stop()
            except Exception:  # noqa: BLE001
                pass


_PG_KEYS = None


def _pg_key_name(pygame, event):
    global _PG_KEYS
    if _PG_KEYS is None:
        _PG_KEYS = {pygame.K_SPACE: 'space', pygame.K_LEFT: 'left arrow', pygame.K_RIGHT: 'right arrow',
                    pygame.K_UP: 'up arrow', pygame.K_DOWN: 'down arrow', pygame.K_RETURN: 'enter',
                    pygame.K_KP_ENTER: 'enter'}
    if event.key in _PG_KEYS:
        return _PG_KEYS[event.key]
    if pygame.K_a <= event.key <= pygame.K_z or pygame.K_0 <= event.key <= pygame.K_9:
        return chr(event.key)
    u = getattr(event, 'unicode', '')
    if u and len(u) == 1 and u.isprintable():
        return u.lower()
    return pygame.key.name(event.key)


def run_window(manifest_path, setup, *, scale=1, seed=None, title=None, deterministic=False,
               frames=None, screenshot=None, trace=None):
    """Open a pygame window and play the exported game.

    manifest_path: path to manifest.json (assets resolve relative to it).
    setup: the generated module's setup(game), or a path to the export dir / game.py.
    F5 or Ctrl+R: green flag; Ctrl+Shift+R: restart(); Esc: close.
    frames / screenshot / trace are for headless checks: stop after N frames, save a PNG of the
    last frame, replay an input trace dict (events applied as in Game.run_trace).
    """
    import os
    import pygame
    game_dir = os.path.dirname(os.path.abspath(manifest_path))
    manifest = load_manifest(manifest_path)
    if isinstance(setup, str):
        setup = load_setup(setup if os.path.isdir(setup) else os.path.dirname(os.path.abspath(setup)))
    pygame.init()
    screen = pygame.display.set_mode((int(STAGE_W * scale), int(STAGE_H * scale)))
    pygame.display.set_caption(title or manifest.get('title') or 'Brickwright game')
    pygame.key.set_repeat(400, 40)
    renderer = _Renderer(pygame, game_dir, manifest, scale)
    pen = _WindowPen()
    pen.r = renderer
    audio = _WindowAudio(pygame, game_dir)
    game = Game(manifest, deterministic=deterministic, seed=seed if seed is not None else (trace or {}).get('seed'),
                pen=pen, audio=audio)
    setup(game)
    events = (trace or {}).get('events') or []
    if trace is None:
        game.green_flag()
    clock = pygame.time.Clock()
    sent = {}
    f = 0
    running = True
    try:
        while running:
            for e in events:
                if e.get('frame') == f:
                    game.apply_event(e)
            for ev in pygame.event.get():
                if ev.type == pygame.QUIT:
                    running = False
                elif ev.type == pygame.KEYDOWN:
                    mods = ev.mod
                    ctrl = mods & (pygame.KMOD_CTRL | pygame.KMOD_META)
                    if ev.key == pygame.K_ESCAPE:
                        running = False
                    elif ev.key == pygame.K_r and ctrl and (mods & pygame.KMOD_SHIFT):
                        renderer.pen_clear()
                        game.restart()
                    elif ev.key == pygame.K_F5 or (ev.key == pygame.K_r and ctrl):
                        game.green_flag()
                    elif game.asking:
                        if ev.key in (pygame.K_RETURN, pygame.K_KP_ENTER):
                            k = 'Enter'
                        elif ev.key == pygame.K_BACKSPACE:
                            k = 'Backspace'
                        elif ev.unicode and ev.unicode.isprintable():
                            k = ev.unicode
                        else:
                            k = None
                        if k is not None:
                            sent[ev.key] = k
                            game.key_down(k)
                    else:
                        k = _pg_key_name(pygame, ev)
                        sent[ev.key] = k
                        game.key_down(k)
                elif ev.type == pygame.KEYUP:
                    k = sent.pop(ev.key, None)
                    if k is not None:
                        game.key_up(k)
                    game.key_up(_pg_key_name(pygame, ev))
                elif ev.type == pygame.MOUSEMOTION:
                    game.mouse_move(ev.pos[0] / scale - STAGE_W / 2, STAGE_H / 2 - ev.pos[1] / scale)
                elif ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
                    game.mouse_down(ev.pos[0] / scale - STAGE_W / 2, STAGE_H / 2 - ev.pos[1] / scale)
                elif ev.type == pygame.MOUSEBUTTONUP and ev.button == 1:
                    game.mouse_up()
            game.step()
            f += 1
            renderer.draw(screen, game)
            pygame.display.flip()
            if frames is not None and f >= frames:
                running = False
            elif not (deterministic and frames is not None):
                clock.tick(FPS)
        if screenshot:
            pygame.image.save(screen, screenshot)
    finally:
        pygame.quit()
    return game


# ---------------------------------------------------------------- CLI

def _main(argv):
    import json
    import os
    if len(argv) >= 4 and argv[1] == 'trace':
        export_dir, trace_path = argv[2], argv[3]
        setup = load_setup(export_dir)
        manifest = load_manifest(os.path.join(export_dir, 'manifest.json'))
        with open(trace_path, 'r', encoding='utf-8') as fh:
            trace = json.load(fh)
        game = Game(manifest, seed=trace.get('seed'))
        setup(game)
        out = js_json(game.run_trace(trace)) + '\n'
        sys.stdout.buffer.write(out.encode('utf-8', 'surrogatepass'))
        return 0
    if len(argv) >= 3 and argv[1] == 'run':
        import argparse
        ap = argparse.ArgumentParser(prog='bwgame.py run')
        ap.add_argument('export_dir')
        ap.add_argument('--scale', type=float, default=1)
        ap.add_argument('--seed', type=int, default=None)
        ap.add_argument('--title', default=None)
        ap.add_argument('--frames', type=int, default=None)
        ap.add_argument('--screenshot', default=None)
        ap.add_argument('--trace', default=None)
        a = ap.parse_args(argv[2:])
        trace = None
        if a.trace:
            with open(a.trace, 'r', encoding='utf-8') as fh:
                trace = json.load(fh)
        run_window(os.path.join(a.export_dir, 'manifest.json'), load_setup(a.export_dir), scale=a.scale,
                   seed=a.seed, title=a.title, deterministic=trace is not None, frames=a.frames,
                   screenshot=a.screenshot, trace=trace)
        return 0
    sys.stderr.write(__doc__)
    return 2


if __name__ == '__main__':
    sys.exit(_main(sys.argv))

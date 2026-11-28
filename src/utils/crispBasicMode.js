/** Durable source requirement for the explicit CrispBASIC round-trip dialect.
 * Keep this module dependency-free: editors must check before loading a parser,
 * mutating blocks, or choosing another execution backend. */
export const CRISPBASIC_PSEUDOCODE_MARKER = '# @crispbasic-portable 1';
// Match the parser's full-line comment whitespace, including UTF-8 BOM and
// Unicode spaces. A saved marker must not become an ordinary comment merely
// because a text editor adds a BOM or changes its leading whitespace.
const directivePattern = () => /^[^\S\r\n]*#[^\S\r\n]*@crispbasic-portable\b([^\r\n]*)$/gm;
const directives = source => [...String(source || '').matchAll(directivePattern())];

/** Consume a validated directive as metadata, using the same admission rule. */
export const stripCrispBasicPseudocodeMarker = source => String(source || '').replace(directivePattern(), '');

/** Any version counts as marked; an unknown version must never escape the guard. */
export function isCrispBasicPseudocode(source) {
    return directives(source).length !== 0;
}

export function crispBasicModeError(target = 'this target') {
    return Object.assign(new Error(`This source requires CrispBASIC mode and a fresh portable simulation host; ${target} is not qualified to preserve its clock, electrical reads and output latches.`),
        {code: 'crispbasic-runtime-required'});
}

/** Returns false for ordinary source, true for the one supported directive.
 * Duplicate/malformed/future markers refuse before any parser side effects. */
export function validateCrispBasicPseudocode(source) {
    const found = directives(source);
    if (!found.length) return false;
    if (found.length !== 1 || found[0][1].trim() !== '1') {
        throw Object.assign(new Error('Unsupported or duplicate CrispBASIC portable source marker; expected exactly "# @crispbasic-portable 1".'),
            {code: 'crispbasic-source-version'});
    }
    return true;
}

export function isCrispBasicProject(project) {
    return Boolean(project && Object.hasOwn(project, 'crispbasicSource'));
}

export function validateCrispBasicProject(project) {
    if (!isCrispBasicProject(project)) return false;
    if (project.crispbasicSource?.schemaVersion !== 1 || project.crispbasicSource?.requiredRuntime !== 'crispbasic') {
        throw Object.assign(new Error('Unsupported CrispBASIC project source requirement.'), {code: 'crispbasic-source-version'});
    }
    return true;
}

/** Language-level maps for the supported digital simulation profiles. The
 * connected host must additionally verify that its actual package exposes a
 * requested terminal; these maps do not claim native firmware or physical I/O. */
export const CRISPBASIC_DIGITAL_DEVICES = Object.freeze([
    'arduino-uno', 'arduino-nano', 'arduino-mega', 'pico',
    'stc12c5a60s2', 'stc12c5a16s2', 'stc89c52rc', 'stc89c52', 'stc15f2k60s2', 'stc15w408as',
    'microbit', 'calliopemini', 'cpx', 'pybadge', 'attiny85', 'attiny88', 'stm32f030', 'esp8266', 'eater6502'
]);
export const hasCrispBasicPinMap = device => CRISPBASIC_DIGITAL_DEVICES.includes(String(device).toLowerCase());
export function crispBasicLogicalPin(device, terminal) {
    device = String(device).toLowerCase();
    const where = String(terminal).toUpperCase();
    if (!hasCrispBasicPinMap(device)) return null;
    let m;
    if (/^arduino-/.test(device) && (m = /^([DA])(\d+)$/.exec(where))) {
        const n = Number(m[2]), mega = device === 'arduino-mega';
        if (m[1] === 'D' && n <= (mega ? 53 : 13)) return n;
        if (m[1] === 'A' && n <= (mega ? 15 : 5)) return n + (mega ? 54 : 14);
    } else if (device === 'pico' && (m = /^GP(\d+)$/.exec(where))) {
        const n = Number(m[1]); if (n <= 22 || n >= 25 && n <= 28) return n;
    } else if (/^stc(?:12|15|89)/.test(device) && (m = /^P([0-7])\.([0-7])$/.exec(where))) {
        return Number(m[1]) * 8 + Number(m[2]);
    } else if (device === 'microbit' && (m = /^P(0|1|2|8|12|16)$/.exec(where))) return Number(m[1]);
    else if (device === 'calliopemini' && (m = /^P([0-3])$/.exec(where))) return Number(m[1]);
    else if (device === 'cpx' && (m = /^A([0-7])$/.exec(where))) return Number(m[1]);
    // Keep the source dialect's existing D/A vocabulary. The circuit profile
    // also exposes named RX/TX/FREE/SPI pads; they are not parser aliases for
    // these terminals, and SDA/SCL overlap other modeled electrical pads.
    else if (device === 'pybadge' && (m = /^D(2|3|5|6|9|10|11|12|13)$/.exec(where))) return Number(m[1]);
    else if (device === 'pybadge' && (m = /^A([0-5])$/.exec(where))) return 14 + Number(m[1]);
    else if (device === 'attiny85' && (m = /^PB([0-4])$/.exec(where))) return 8 + Number(m[1]);
    else if (device === 'attiny88' && /^(PB[0-7]|PC[0-5]|PC7|PD[0-7])$/.test(where)) return (where.charCodeAt(1) - 65) * 8 + Number(where.slice(2));
    else if (device === 'stm32f030' && /^(PA[0-7]|PA9|PA10|PB1)$/.test(where)) return (where.charCodeAt(1) - 65) * 16 + Number(where.slice(2));
    else if (device === 'esp8266' && (m = /^GP([0-5]|1[2-5])$/.exec(where))) return Number(m[1]);
    else if (device === 'eater6502' && (m = /^P([AB])([0-7])$/.exec(where))) return (m[1] === 'B' ? 8 : 0) + Number(m[2]);
    return null;
}

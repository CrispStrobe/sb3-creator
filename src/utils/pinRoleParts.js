// Parts that are nothing but named pins with a protocol behind them: a
// sensor whose whole wiring is "this role on that pin". One table drives the
// declaration, its decompiled text, the C header marker, the C reader and
// the retarget, so a new kind is a row here plus its driver -- not five
// hand-copied branches that drift apart.
//
//   PART sonar = HCSR04 TRIG D7 ECHO D8
//   PART probe = DS18B20 ON D4
//
// `dir` is how the pin is set up before the driver first runs: TRIG is an
// output held low, ECHO an input, and a 1-Wire DQ is released (an input; the
// bus pull-up is external, so nothing on the chip pulls it).
export const PIN_ROLE_PARTS = Object.freeze({
    hcsr04: Object.freeze({
        word: 'HCSR04',
        roles: Object.freeze([['trig', 'TRIG', 'output'], ['echo', 'ECHO', 'input']])
    }),
    ds18b20: Object.freeze({
        word: 'DS18B20',
        roles: Object.freeze([['dq', 'ON', 'input']])
    })
});

const at = (pin) => pin.where || `P${pin.port}.${pin.bit}`;

/** `PART <name> = <WORD> <KEY> <pin> ...` — the declaration's own text. */
export function pinRoleDeclText(part) {
    const kind = PIN_ROLE_PARTS[part.type];
    return `PART ${part.name} = ${kind.word} ${kind.roles.map(([role, key]) => `${key} ${at(part[role])}`).join(' ')}`;
}

/** `part <name> <type> <role> <pin> ...` — the C header marker line. */
export function pinRoleMarkerText(part) {
    const kind = PIN_ROLE_PARTS[part.type];
    return `part ${part.name} ${part.type} ${kind.roles.map(([role]) => `${role} ${at(part[role])}`).join(' ')}`;
}

const pinOf = (text) => {
    const m = String(text).match(/^P(\d)\.(\d)$/i);
    return m ? { port: +m[1], bit: +m[2] } : { where: String(text).toUpperCase() };
};

/** Read a marker line's rest (after `part `) back into a part, or null. */
export function parsePinRoleMarker(rest) {
    const m = String(rest).match(/^(\w+)\s+(\w+)\s+(.*)$/);
    if (!m || !PIN_ROLE_PARTS[m[2].toLowerCase()]) return null;
    const type = m[2].toLowerCase();
    const part = { name: m[1], type };
    const words = m[3].trim().split(/\s+/);
    for (const [role] of PIN_ROLE_PARTS[type].roles) {
        const i = words.findIndex((w) => w.toLowerCase() === role);
        if (i < 0 || !words[i + 1]) return null;
        part[role] = pinOf(words[i + 1]);
    }
    return part;
}

/** Match a declaration line: { name, type, wheres: { role: 'D7' } } or null. */
export function matchPinRoleDecl(line) {
    const m = String(line).match(/^PART\s+([A-Za-z_]\w*)\s*=\s*(\w+)\s+(.*)$/i);
    if (!m) return null;
    const type = Object.keys(PIN_ROLE_PARTS).find((k) => PIN_ROLE_PARTS[k].word === m[2].toUpperCase());
    if (!type) return null;
    const roles = PIN_ROLE_PARTS[type].roles;
    const re = new RegExp(`^${roles.map(([, key]) => `${key}\\s+(\\S+)`).join('\\s+')}$`, 'i');
    const r = m[3].trim().match(re);
    if (!r) return { name: m[1], type, error: `${PIN_ROLE_PARTS[type].word} is written ${roles.map(([, key]) => `${key} <pin>`).join(' ')}` };
    const wheres = {};
    roles.forEach(([role], i) => { wheres[role] = r[i + 1].toUpperCase(); });
    return { name: m[1], type, wheres };
}

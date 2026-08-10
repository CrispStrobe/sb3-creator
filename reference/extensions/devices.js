// Name: Devices
// ID: devices
// Description: Servo, motor, relay, sensor, display and NeoPixel blocks for circuit projects.
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  const Cast = Scratch.Cast;
  const num = (v) => Cast.toNumber(v);

  // Stubs: blocks with no real C driver.  Hidden from palette, methods
  // still exist so saved projects load.  Remove from this set when a
  // driver replaces the stub.
  const STUB = true;

  class Devices {
    constructor() {
      this._runtime = null;
    }

    /** Is the current target a 12T core (STC89)? WS2812 is unavailable. */
    _is12T() {
      if (!this._runtime) return false;
      const stc = this._runtime.stc;
      if (!stc || !stc.device) return false;
      return /stc89/i.test(stc.device);
    }

    getInfo() {
      const str = (name, def) => ({ [name]: { type: Scratch.ArgumentType.STRING, defaultValue: def || '' } });
      const n = (name, def) => ({ [name]: { type: Scratch.ArgumentType.NUMBER, defaultValue: def ?? 0 } });
      const is12T = this._is12T();

      return {
        id: 'devices',
        name: 'Devices',
        color1: '#CF6A1D',
        blocks: [
          // ---- Commands: real drivers ----
          { opcode: 'setservo', blockType: Scratch.BlockType.COMMAND,
            text: 'set [SERVO] angle to [ANGLE]',
            arguments: { ...str('SERVO', 'servo1'), ...n('ANGLE', 90) } },
          { opcode: 'setmotor', blockType: Scratch.BlockType.COMMAND,
            text: 'set [MOTOR] speed to [SPEED]',
            arguments: { ...str('MOTOR', 'motor1'), ...n('SPEED', 50) } },
          { opcode: 'setdirection', blockType: Scratch.BlockType.COMMAND,
            text: 'set [MOTOR] direction [DIR]',
            arguments: { ...str('MOTOR', 'motor1'),
              DIR: { type: Scratch.ArgumentType.STRING, defaultValue: 'forward',
                menu: 'dirMenu' } } },
          { opcode: 'setrelay', blockType: Scratch.BlockType.COMMAND,
            text: 'set relay [RELAY] [STATE]',
            arguments: { ...str('RELAY', 'relay1'),
              STATE: { type: Scratch.ArgumentType.STRING, defaultValue: 'on',
                menu: 'onoffMenu' } } },
          { opcode: 'activate', blockType: Scratch.BlockType.COMMAND,
            text: 'activate [DEVICE]', arguments: str('DEVICE', 'device1') },
          { opcode: 'deactivate', blockType: Scratch.BlockType.COMMAND,
            text: 'deactivate [DEVICE]', arguments: str('DEVICE', 'device1') },
          { opcode: 'lcdprint', blockType: Scratch.BlockType.COMMAND,
            text: 'lcd print [TEXT] on [DISPLAY]',
            arguments: { ...str('TEXT', 'Hello'), ...str('DISPLAY', 'display1') } },
          { opcode: 'lcdcursor', blockType: Scratch.BlockType.COMMAND,
            text: 'lcd set cursor [ROW] [COL] on [DISPLAY]',
            arguments: { ...n('ROW', 0), ...n('COL', 0), ...str('DISPLAY', 'display1') } },
          { opcode: 'lcdclear', blockType: Scratch.BlockType.COMMAND,
            text: 'lcd clear [DISPLAY]', arguments: str('DISPLAY', 'display1') },
          // NeoPixel: 1T only — hidden on 12T targets
          { opcode: 'setneopixel', blockType: Scratch.BlockType.COMMAND,
            hideFromPalette: is12T,
            text: 'set neopixel [INDEX] to R [R] G [G] B [B] on [STRIP]',
            arguments: { ...n('INDEX', 0), ...n('R', 255), ...n('G', 0), ...n('B', 0), ...str('STRIP', 'strip1') } },
          { opcode: 'clearneopixels', blockType: Scratch.BlockType.COMMAND,
            hideFromPalette: is12T,
            text: 'clear neopixels on [STRIP]', arguments: str('STRIP', 'strip1') },

          // ---- Commands: stubs (hidden from palette) ----
          { opcode: 'showdigit', blockType: Scratch.BlockType.COMMAND,
            hideFromPalette: STUB,
            text: 'show digit [DIGIT] on [DISPLAY]',
            arguments: { ...n('DIGIT', 0), ...str('DISPLAY', 'display1') } },
          { opcode: 'setrgb', blockType: Scratch.BlockType.COMMAND,
            hideFromPalette: STUB,
            text: 'set [LED] colour to R [R] G [G] B [B]',
            arguments: { ...str('LED', 'led1'), ...n('R', 255), ...n('G', 0), ...n('B', 0) } },
          { opcode: 'setpixel', blockType: Scratch.BlockType.COMMAND,
            hideFromPalette: STUB,
            text: 'set pixel [X] [Y] to [BRIGHTNESS] on [MATRIX]',
            arguments: { ...n('X', 0), ...n('Y', 0), ...n('BRIGHTNESS', 100), ...str('MATRIX', 'matrix1') } },
          { opcode: 'clearmatrix', blockType: Scratch.BlockType.COMMAND,
            hideFromPalette: STUB,
            text: 'clear matrix [MATRIX]', arguments: str('MATRIX', 'matrix1') },

          // ---- Reporters: real drivers ----
          { opcode: 'servoangle', blockType: Scratch.BlockType.REPORTER,
            text: 'angle of [SERVO]', arguments: str('SERVO', 'servo1') },
          { opcode: 'motorspeed', blockType: Scratch.BlockType.REPORTER,
            text: 'speed of [MOTOR]', arguments: str('MOTOR', 'motor1') },
          { opcode: 'motordirection', blockType: Scratch.BlockType.REPORTER,
            text: 'direction of [MOTOR]', arguments: str('MOTOR', 'motor1') },
          { opcode: 'temperature', blockType: Scratch.BlockType.REPORTER,
            text: 'temperature from [SENSOR]', arguments: str('SENSOR', 'sensor1') },
          { opcode: 'light', blockType: Scratch.BlockType.REPORTER,
            text: 'light from [SENSOR]', arguments: str('SENSOR', 'sensor1') },
          { opcode: 'distance', blockType: Scratch.BlockType.REPORTER,
            text: 'distance from [SENSOR]', arguments: str('SENSOR', 'sensor1') },
          { opcode: 'flex', blockType: Scratch.BlockType.REPORTER,
            text: 'flex of [SENSOR]', arguments: str('SENSOR', 'sensor1') },
          { opcode: 'force', blockType: Scratch.BlockType.REPORTER,
            text: 'force on [SENSOR]', arguments: str('SENSOR', 'sensor1') },

          // ---- Reporters: stubs (hidden) ----
          { opcode: 'devicestate', blockType: Scratch.BlockType.REPORTER,
            hideFromPalette: STUB,
            text: 'state of [DEVICE]', arguments: str('DEVICE', 'device1') },
          { opcode: 'ircode', blockType: Scratch.BlockType.REPORTER,
            hideFromPalette: STUB,
            text: 'ir code from [SENSOR]', arguments: str('SENSOR', 'sensor1') },

          // ---- Booleans: real drivers ----
          { opcode: 'pressed', blockType: Scratch.BlockType.BOOLEAN,
            text: '[BUTTON] pressed?', arguments: str('BUTTON', 'btn1') },
          { opcode: 'above', blockType: Scratch.BlockType.BOOLEAN,
            text: '[SENSOR] above [THRESHOLD]',
            arguments: { ...str('SENSOR', 'sensor1'), ...n('THRESHOLD', 30) } },
          { opcode: 'closer', blockType: Scratch.BlockType.BOOLEAN,
            text: '[SENSOR] closer than [DISTANCE]',
            arguments: { ...str('SENSOR', 'sensor1'), ...n('DISTANCE', 20) } },
          { opcode: 'motion', blockType: Scratch.BlockType.BOOLEAN,
            text: 'motion detected on [SENSOR]', arguments: str('SENSOR', 'sensor1') },
          { opcode: 'tilted', blockType: Scratch.BlockType.BOOLEAN,
            text: '[SENSOR] tilted?', arguments: str('SENSOR', 'sensor1') },
          { opcode: 'energised', blockType: Scratch.BlockType.BOOLEAN,
            text: '[DEVICE] energised?', arguments: str('DEVICE', 'device1') },

          // ---- Hats: real drivers ----
          { opcode: 'whenabove', blockType: Scratch.BlockType.HAT,
            text: 'when [SENSOR] above [THRESHOLD]',
            arguments: { ...str('SENSOR', 'sensor1'), ...n('THRESHOLD', 30) },
            isEdgeActivated: true },
          { opcode: 'whencloser', blockType: Scratch.BlockType.HAT,
            text: 'when [SENSOR] closer than [DISTANCE]',
            arguments: { ...str('SENSOR', 'sensor1'), ...n('DISTANCE', 20) },
            isEdgeActivated: true },
          { opcode: 'whenmotion', blockType: Scratch.BlockType.HAT,
            text: 'when motion on [SENSOR]', arguments: str('SENSOR', 'sensor1'),
            isEdgeActivated: true },
          { opcode: 'whentilted', blockType: Scratch.BlockType.HAT,
            text: 'when [SENSOR] tilted', arguments: str('SENSOR', 'sensor1'),
            isEdgeActivated: true },
          // whenirreceived: stub (hidden)
          { opcode: 'whenirreceived', blockType: Scratch.BlockType.HAT,
            hideFromPalette: STUB,
            text: 'when IR received on [SENSOR]', arguments: str('SENSOR', 'sensor1'),
            isEdgeActivated: true }
        ],
        menus: {
          dirMenu: { acceptReporters: false, items: ['forward', 'reverse', 'brake', 'coast'] },
          onoffMenu: { acceptReporters: false, items: ['on', 'off'] }
        }
      };
    }

    // ---- Board access (same pattern as the circuit extension) ----
    _board() {
      return (this._runtime && this._runtime.circuitBoard) || null;
    }
    _state(name) {
      const b = this._board();
      return b && b.getDeviceState ? b.getDeviceState(String(name)) : null;
    }

    // ---- Commands (real) ----
    setservo(a) { const b = this._board(); if (b && b.setDeviceControl) b.setDeviceControl(a.SERVO, 'angle', num(a.ANGLE)); }
    setmotor(a) { const b = this._board(); if (b && b.setDeviceControl) b.setDeviceControl(a.MOTOR, 'speed', num(a.SPEED)); }
    setdirection(a) { const b = this._board(); if (b && b.setDeviceControl) b.setDeviceControl(a.MOTOR, 'direction', String(a.DIR)); }
    setrelay(a) { const b = this._board(); if (b && b.setDeviceControl) b.setDeviceControl(a.RELAY, 'state', a.STATE === 'on' ? 1 : 0); }
    activate(a) { const b = this._board(); if (b && b.setDeviceControl) b.setDeviceControl(a.DEVICE, 'state', 1); }
    deactivate(a) { const b = this._board(); if (b && b.setDeviceControl) b.setDeviceControl(a.DEVICE, 'state', 0); }
    lcdprint(a) { const b = this._board(); if (b && b.setDeviceControl) b.setDeviceControl(a.DISPLAY, 'print', String(a.TEXT)); }
    lcdcursor(a) { const b = this._board(); if (b && b.setDeviceControl) b.setDeviceControl(a.DISPLAY, 'cursor', [num(a.ROW), num(a.COL)]); }
    lcdclear(a) { const b = this._board(); if (b && b.setDeviceControl) b.setDeviceControl(a.DISPLAY, 'clear', 1); }
    setneopixel(a) { const b = this._board(); if (b && b.setDeviceControl) b.setDeviceControl(a.STRIP, 'neopixel', [num(a.INDEX), num(a.R), num(a.G), num(a.B)]); }
    clearneopixels(a) { const b = this._board(); if (b && b.setDeviceControl) b.setDeviceControl(a.STRIP, 'clearNeopixels', 1); }

    // ---- Commands (stubs — methods exist so saved projects load) ----
    showdigit() {}
    setrgb() {}
    setpixel() {}
    clearmatrix() {}

    // ---- Reporters (real) ----
    servoangle(a) { const st = this._state(a.SERVO); return st ? (st.targetAngle ?? 0) : 0; }
    motorspeed(a) { const st = this._state(a.MOTOR); return st ? (st.omega ?? 0) : 0; }
    motordirection(a) { const st = this._state(a.MOTOR); return st ? (st.direction ?? 'stopped') : 'stopped'; }
    temperature(a) { const st = this._state(a.SENSOR); return st ? (st.temperature ?? 0) : 0; }
    light(a) { const st = this._state(a.SENSOR); return st ? (st.lux ?? 0) : 0; }
    distance(a) { const st = this._state(a.SENSOR); return st ? (st.distance ?? 0) : 0; }
    flex(a) { const st = this._state(a.SENSOR); return st ? (st.flex ?? 0) : 0; }
    force(a) { const st = this._state(a.SENSOR); return st ? (st.force ?? 0) : 0; }

    // ---- Reporters (stubs) ----
    devicestate(a) { const st = this._state(a.DEVICE); if (!st) return 'unknown'; return ('energized' in st) ? (st.energized ? 'on' : 'off') : 'unknown'; }
    ircode(a) { const st = this._state(a.SENSOR); return st ? (st.code ?? 0) : 0; }

    // ---- Booleans (real) ----
    pressed(a) { const st = this._state(a.BUTTON); return !!(st && st.pressed); }
    above(a) { const st = this._state(a.SENSOR); return ((st && st.value) ?? 0) > num(a.THRESHOLD); }
    closer(a) { const st = this._state(a.SENSOR); return ((st && st.distance) ?? 999) < num(a.DISTANCE); }
    motion(a) { const st = this._state(a.SENSOR); return !!(st && st.motion); }
    tilted(a) { const st = this._state(a.SENSOR); return !!(st && st.tilted); }
    energised(a) { const st = this._state(a.DEVICE); return !!(st && st.energized); }

    // ---- Hats (edge-activated, polled by the runtime) ----
    whenabove(a) { return this.above(a); }
    whencloser(a) { return this.closer(a); }
    whenmotion(a) { return this.motion(a); }
    whentilted(a) { return this.tilted(a); }
    whenirreceived(a) { const st = this._state(a.SENSOR); return !!(st && st.irReceived); }
  }

  Scratch.extensions.register(new Devices());
})(Scratch);

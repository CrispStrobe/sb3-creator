// Device → designer part kind. One table, three consumers.
export const DEVPART = {
  'pico': 'pi_pico',
  'stc12c5a60s2': 'mcu', 'stc89c52rc': 'mcu', 'stc15f2k60s2': 'stc15_mcu',
  'arduino-uno': 'arduino_uno', 'arduino-nano': 'arduino_nano',
  'arduino-mega': 'arduino_mega', 'atmega168p': 'arduino_uno',
  'attiny88': 'attiny88', 'attiny85': 'attiny85',
  'stm32f030': 'stm32f030',
};

// A device can have more than one electrically equivalent package in the
// designer. DEVPART remains the default generated-bench package; authored
// circuits may deliberately use one of these real package variants.
export const DEVICE_PART_KINDS = {
  'attiny88': new Set(['attiny88', 'attiny88_qfn32']),
};

export const partKindsForDevice = device =>
  DEVICE_PART_KINDS[device] || new Set(DEVPART[device] ? [DEVPART[device]] : []);

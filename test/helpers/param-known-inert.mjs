/**
 * The tier-2 ratchet of test/circuit-params-are-read*.test.mjs, in one place
 * so every shard of the sweep reads the same list.
 */
/**
 * RATCHET — tier 2. (kind, key) pairs that no bench in the corpus responds to.
 *
 * Two different things live here and the verdicts keep them apart:
 *
 *   BLIND SPOT — the engine does read the key; no shipped bench is in a state
 *   where it matters. Removing one of these means finding or building a bench
 *   that exercises it, which is a coverage gain, not a bug fix.
 *
 *   ENGINE — the key is declared, documented, and the model ignores it. The
 *   fix belongs in bw-board, so it cannot land in this repo; it is recorded in
 *   PLAN.md rather than papered over by deleting the declaration.
 *
 * May only SHRINK.
 */
export const KNOWN_INERT = new Map([
    ['ldr.ohms',
        'ENGINE: the reviewed PRECHIN A2 source declares ohms: 10000, but bw-board computes '
        + 'LDR resistance only from rDark/rLight and the light control. The exact source is retained '
        + 'for provenance; its producer must migrate this legacy field to an explicit supported '
        + 'range before this exception can be removed.'],

    ['ntc.ohms',
        'ENGINE: the reviewed PRECHIN A2 source declares ohms: 10000, but bw-board computes '
        + 'NTC resistance only from rCold/rHot and the temperature control. The exact source is '
        + 'retained for provenance; its producer must migrate this legacy field to an explicit '
        + 'supported range before this exception can be removed.'],

    ['xpt2046.vbatDivider',
        'BLIND SPOT: bw-board reads vbatDivider while handling the XPT2046 VBAT SPI command, '
        + 'but the imported PRECHIN A2 board carries no program that issues that transaction. '
        + 'The generic static sweep cannot invent SPI traffic; a focused device transaction test '
        + 'must make this declaration observable before this exception can be removed.'],




    ['28c256.readOnly',
        'BLIND SPOT: no bench writes. readOnly refuses /WE writes, and both probed sites tie /WE high — '
        + 'a control store is never written. Flipping it changes nothing because nothing writes, '
        + 'which is the point of a control store. A bench that pulses /WE would move it.'],

    // Read off the solve path — geometry, rendering, export, load-time migration.
    ['arduino_mega.pins', 'BLIND SPOT: the controller pin table is consumed by terminal resolution and the exporters, not by a DC solve.'],
    ['arduino_nano.pins', 'BLIND SPOT: as arduino_mega.pins.'],
    ['arduino_uno.pins',  'BLIND SPOT: as arduino_mega.pins.'],
    ['mcu.pins',          'BLIND SPOT: as arduino_mega.pins.'],
    ['pi_pico.pins',      'BLIND SPOT: as arduino_mega.pins.'],
    ['breadboard.size',   'BLIND SPOT: read by bw-circuit-ui hit-testing and layout, never by the solver.'],
    ['led.color',         'BLIND SPOT: read by the renderer; the LED model uses vf.'],
    ['vsource.variant',   'BLIND SPOT: read only by bw-circuit-ui starter-migration at load time; volts carries the electrical meaning and is live.'],
    ['vsource.gain',      'BLIND SPOT: PCM input control; the shipped source has no samples until the debugger injects a waveform.'],
    ['dc_motor.airflowGain',
        'BLIND SPOT: bw-board BoardImpl._airflowMs reads it (m/s of air per rad/s of shaft speed). '
        + 'Its one bench, lab-airflow-sensor, starts the fan only once the thermostat sees a warm '
        + 'room (world temperatureC 32 and seconds of thermal settling); this sweep runs 40 ms at the '
        + 'authored world, where the fan is still. test/lab-circuits-6.test.mjs drives that scenario '
        + 'and asserts the fan cycles on its own air (measured: without the gain it runs flat out).'],
    ['vsource.loop',      'BLIND SPOT: PCM input control; an empty sample buffer cannot loop during this static probe.'],
    ['vsource.rate',      'BLIND SPOT: PCM input control; the shipped source has no samples until the debugger injects a waveform.'],
    ['vsource.samples',   'BLIND SPOT: the static probe cannot synthesize a replacement PCM array; debugger integration covers waveform injection.'],
    ['vsource.start',     'BLIND SPOT: PCM input control; start time has no effect before the debugger injects samples.'],

    // Read by the model, but no shipped bench reaches the state that uses it.
    ['zener.vf',    'BLIND SPOT: the zener benches operate in reverse breakdown, where vz sets the voltage and vf does not.'],
    ['field_probe.rodVolts',
        'BLIND SPOT: bw-board src/fields.js reads it as the charged ruler\'s potential, which only couples while the '
        + 'probe\'s knob is above 0; every charge bench starts with the ruler far away (position 0), and the induced '
        + 'charge is a path in time (a hand moving), not one solve. test/lab-circuits-fields.test.mjs moves the knob and '
        + 'flips rodVolts\' sign (lab-electroscope).'],
    ['field_probe.skinOhms',
        'BLIND SPOT: the finger\'s skin contact is skinOhms/position, open at the knob\'s rest position 0 '
        + '(lab-body-hum starts untouched); test/lab-circuits-fields.test.mjs touches the plate.'],
    ['ssd1306.address',   'BLIND SPOT: read by the I2C address decoder; the probe drives no I2C traffic.'],
    // The sensor PARTs' bench stimulus (2026-10-05). Each answers only to a
    // protocol the static probe cannot drive: a TRIG pulse, a 1-Wire reset and
    // conversion. test/chain-sensors.test.mjs moves both on the emulated chips
    // (5-300 cm and -10.5-85 C read back exactly on nine boards).
    ['ultrasonic.distance', 'BLIND SPOT: read when TRIG falls; the probe sends no trigger. chain-sensors moves it.'],
    // Optics benches (bw-board optics.js). The heated LED and phototransistor
    // of lab-led-heat-light, a rough cut, another material and the comb's
    // knob left this list on 2026-11-26: the driven pass throws the heater's
    // slide switch, and PERTURB_BY_KEY moves those keys inside their range.
    ['light_path.shield', 'BLIND SPOT: shield scales ROOM light at the receiver, and lab-light-guide authors none (0); lab-circuits-optics adds room light and measures the shield.'],
    ['air_coil.dropHeightM', 'BLIND SPOT: the magnet falls only after a drop (setControl verb or params.drops), and lab-magnet-drop authors none, so the coil carries no EMF at either probe instant. lab-circuits-8 drops it and times the pulse.'],
    ['air_coil.magnetAm2', 'BLIND SPOT: same as dropHeightM: without a drop the magnet never moves and its moment induces nothing. lab-circuits-8 drops it and times the pulse.'],
    ['speaker.ringOnS', 'BLIND SPOT: a ring cadence starts with a burst at t = 0 and lab-ring-relay rings for 1 s; the probe reads 1 and 20 ms, inside the first burst, where neither the burst length nor the pause can show. MEASURED 2026-11-26: a burst shortened to 10 ms does not move the bench either. lab-circuits-8 runs the cadence for seconds.'],
    ['speaker.ringOffS', 'BLIND SPOT: the pause after the first 1 s burst; the probe never leaves the first burst (see ringOnS). lab-circuits-8 runs the cadence for seconds.'],
    ['earphone.strikeHz', 'BLIND SPOT: lab-knock-flicker authors its crystal pickup silent (soundDb 0, the Sound slider at zero), so no knock reaches it at either probe instant and the knock rate has nothing to time. test/lab-circuits-r10a.test.mjs raises the slider and measures the LED flashes.'],
    ['earphone.decayS', 'BLIND SPOT: as earphone.strikeHz — how fast a knock dies away, on a pickup authored silent.'],
    ['earphone.ringOnS', 'BLIND SPOT: as earphone.strikeHz — the knocking cadence of a pickup authored silent.'],
    ['earphone.ringOffS', 'BLIND SPOT: as earphone.strikeHz — the pause in the knocking cadence of a pickup authored silent.'],
    ['ds18b20.temperature', 'BLIND SPOT: read when a READ SCRATCHPAD follows a conversion; the probe drives no 1-Wire. chain-sensors moves it.'],
    // Round-6 r6e benches (2026-11-24). Each key is read by bw-board but only
    // acts on an event or a ramp the static probe never produces. (The
    // bounce keys left on 2026-11-26: the driven pass's press is a change.)
    ['spark_gap.gapMm', 'BLIND SPOT: the gap sets the breakdown voltage (4.35 kV at 1 mm), and lab-comb-jet-spark\'s comb is resting (no charging current) as authored, so no voltage ever reaches the gap in the probe window. test/lab-circuits-r6e.test.mjs combs for a second and counts sparks 430 ms apart.'],
    // 2026-11-26. hall_analog.threshold, relay.pullInV and switchTimeMs and
    // the CP1 connector's clockHz and expansion left this list the same day:
    // the driven pass places the magnet and drives the GPIO, and the
    // attach-time view carries the machine extractor's verdict.
    // relay.dropOutV left it on 2026-11-27: lab-relay-hysteresis parks its
    // coil at 3.1 V, between drop-out (2.5 V) and pull-in (6 V), and the
    // driven pass presses TAP, a push through a capacitor that pulls the
    // relay in and lets the coil fall back into that band; the probe reaches
    // it since it takes one site per bench before a second (probeOrder).
    // npn.thermalCoupling left it the same day: with one site per bench
    // first, the probe reaches lab-tone-thermometer (coupling 0.2 -> 1.74
    // moves it), which lab-resistor-heating's two transistors had crowded out.
]);

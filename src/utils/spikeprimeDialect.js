/**
 * Exact boundary of the BrickWright pseudocode <-> canonical SPIKE block map.
 *
 * The canonical 84-opcode surface comes from the immutable extension source
 * recorded by runtimeRegistry.generated.js. This ledger prevents a partial
 * hand-written map from being described as family-wide support: every opcode
 * is either mapped in both directions or assigned one explicit exclusion
 * class. The census test requires the union to equal the pinned surface.
 */
export const SPIKE_DIALECT_OPS = Object.freeze([
    'displayClear', 'displayText', 'getAcceleration', 'getAngle',
    'getBatteryLevel', 'getColor', 'getDistance', 'getForce',
    'getHubTemperature', 'getOrientation', 'getPosition', 'getReflection',
    'getSpeed', 'getTimer', 'isButtonPressed', 'isColor',
    'isForceSensorPressed', 'isGesture', 'motorRunFor', 'motorSetSpeed',
    'motorStart', 'motorStop', 'moveForward', 'playBeep', 'playNote',
    'resetTimer', 'resetYaw', 'setPixel', 'stopMovement', 'stopSound'
]);

export const SPIKE_DIALECT_EXCLUSIONS = Object.freeze({
    // Editor/deployment controls act on files, the hub REPL, or the current
    // editor session. They are not deterministic program statements and must
    // not silently become portable .bw verbs.
    'host-control': Object.freeze([
        'transpileProject', 'showCode', 'downloadCode', 'getTranspiledCode',
        'uploadScriptToHub', 'runScriptOnHub', 'renameScriptOnHub',
        'deleteScriptOnHub', 'listScriptsOnHub', 'stopRunningScript',
        'writeLogFile', 'readLogFile', 'deleteLogFile', 'listFiles',
        'runReplCommand', 'getReplOutput', 'clearReplOutput', 'getReplHistory',
        'runPythonCommand', 'runHubCommand', 'exitScript'
    ]),
    // Extension hats need an event grammar and callback scheduling contract;
    // pretending they are polled booleans changes edge/level semantics.
    'event-hat': Object.freeze([
        'whenGesture', 'whenColor', 'whenForceSensor', 'whenButtonPressed'
    ]),
    // These are genuine learner operations still outside the completed slice.
    // Keeping them enumerated makes the denominator honest and gives the next
    // expansion a finite list instead of an implied blanket promise.
    'learner-gap': Object.freeze([
        'setMovementMotors', 'steer', 'startTank', 'setMovementSpeed',
        'motorRunToPosition', 'motorSetStopAction', 'getRelativePosition',
        'getAbsolutePosition', 'resetMotorPosition', 'displayImage',
        'displayPattern', 'rotateDisplay', 'setCenterButtonColor', 'getGyroRate',
        'getFilteredGyroRate', 'getFilteredAcceleration', 'presetYaw',
        'setMatrix3x3ColorGrid', 'setMatrix3x3Custom',
        'setMatrix3x3SolidColor', 'clearMatrix3x3', 'playHubSound',
        'playWaveBeep', 'setVolume', 'getBatteryTemperature', 'getHubCurrent',
        'getHubVoltage', 'setDistanceLights', 'getAmbientLight'
    ])
});

export const SPIKE_DIALECT_EXCLUSION_REASONS = Object.freeze({
    'host-control': 'editor, deployment, file or REPL control; not a portable program statement',
    'event-hat': 'requires an event/callback scheduling contract before it can round-trip',
    'learner-gap': 'canonical learner block not yet mapped by the completed dialect slice'
});


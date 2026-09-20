/**
 * Exact boundary of the BrickWright pseudocode <-> canonical SPIKE block map.
 *
 * The canonical 101-opcode surface comes from the immutable extension source
 * recorded by runtimeRegistry.generated.js. This ledger prevents a partial
 * hand-written map from being described as family-wide support: every opcode
 * is either mapped in both directions or assigned one explicit exclusion
 * class. The census test requires the union to equal the pinned surface.
 *
 * IT WAS 84 UNTIL 2026-09-20. Upstream consolidated four separate SPIKE Prime
 * extensions (BTC/Scratch Link, BLE, bridge, and the legacy Robot Inventor BLE
 * one) into this single extension that discovers the hub's firmware generation
 * and speaks whichever of the two protocols it finds. The 17 opcodes that
 * arrived with it are not new learner vocabulary so much as the seam that
 * consolidation created: ten of them name the transport and firmware the
 * previous four extensions expressed by WHICH extension you dragged out, and
 * so they get their own exclusion class rather than being filed under the
 * editor/REPL one. The mapped set did not move: no pseudocode verb changed
 * meaning, and nothing that was mapped became unmapped.
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
    // What used to be a choice of extension is now a runtime mode, and these
    // are the blocks that express it: connect/disconnect, which protocol and
    // transport to use, what the hub turned out to be, and whether the
    // streaming channel is open. They are properties of the SESSION, not
    // statements of the program — the same .bw program should compile
    // unchanged whether it reaches a hub over Bluetooth Classic, BLE or the
    // local bridge. Mapping them would bake one answer into portable source.
    //
    // They are NOT 'host-control': that class is about acting on the editor,
    // files or the hub REPL. Collapsing the two would hide the fact that this
    // group appeared all at once, for a specific reason, and is the group most
    // likely to shrink — `getHubType` and `getFirmwareVersion` are reporters a
    // learner program could legitimately branch on once the dialect has a way
    // to express a capability query.
    'transport-control': Object.freeze([
        'connectHub', 'connectHubAt', 'disconnectHub', 'isConnected',
        'setConnectionMode', 'getConnectionMode', 'getHubType',
        'getFirmwareVersion', 'enableStreamingMode', 'disableStreamingMode'
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
        'getHubVoltage', 'setDistanceLights', 'getAmbientLight',
        // Arrived with the consolidation (2026-09-20). Each is a real learner
        // operation, and each needs something the current slice lacks:
        // `getDistanceIn` carries a UNIT argument where the mapped
        // `getDistance` fixes centimetres; `startMotor`/`stopMotor` are the
        // legacy Bluetooth-Classic spellings of the mapped
        // `motorStart`/`motorStop` and must not both map to one verb;
        // `motorPairMove` takes steering rather than the mapped pair's
        // left/right speeds; the display and matrix ones extend surfaces whose
        // mapped members are already the slice's boundary.
        'getDistanceIn', 'getFaceUp', 'startMotor', 'stopMotor',
        'motorPairMove', 'setLightMatrixPixel', 'displayShowImage'
    ])
});

export const SPIKE_DIALECT_EXCLUSION_REASONS = Object.freeze({
    'host-control': 'editor, deployment, file or REPL control; not a portable program statement',
    'event-hat': 'requires an event/callback scheduling contract before it can round-trip',
    'transport-control': 'names the connection, protocol or firmware the session happens to use; '
        + 'portable program source must compile the same over any of them',
    'learner-gap': 'canonical learner block not yet mapped by the completed dialect slice'
});


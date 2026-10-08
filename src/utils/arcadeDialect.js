/**
 * The BrickWright pseudocode <-> MakeCode Arcade / array-reference block map.
 *
 * A MakeCode Arcade program imported into BrickWright (Lite's
 * `arcade-translate.js`) is written in these words. Each word is one block of
 * the `arcade` extension (sprites, images, tiles, scenes, handlers, a call
 * frame's locals) or one of the `arrays` extension's REFERENCE blocks (a
 * JavaScript array shared by identity, with MakeCode's own value semantics —
 * `undefined`, `===`, `+` that concatenates text). The table is the whole
 * contract: sb3Creator.js parses a line against it and decompiles a block
 * through it, so a word cannot be readable in one direction and not the
 * other (the same design as ev3Dialect.js).
 *
 * A word's spelling is literal words and slots:
 *
 *   {NAME}               a value input. A slot that ends at the next keyword
 *                        is lazy and reads up to that keyword OUTSIDE any
 *                        (…) or "…" (the parser matches through matchTopLevel),
 *                        so it may hold a bracketed expression or an
 *                        unbracketed reporter; the last slot takes the rest of
 *                        the line, as `set X to <expression>` does.
 *   {NAME:a|b|c}         a field; the word IS the stored value (matched
 *                        case-insensitively, stored as spelled here)
 *   {NAME:"a"|"b"}       a field written as quoted text
 *   {NAME:text:a|b}      a TEXT input written as a bare word (`mode side`)
 *   {NAME:menu:axes:x|y} a reporter input with native menu shadow; bare menu
 *                        choices or a value expression (quote text literals)
 *   {NAME:name}          a TEXT input written as an identifier
 *                        (`arcade local count` stores "count")
 *   {NAME:cond}          a value input that also takes a condition: a
 *                        comparison / and / or / not / Boolean word is built
 *                        as a Boolean block (a sprite flag set from `a > b`)
 *   {NAME:bool}          a Boolean input: a condition as above, a number
 *                        literal becomes `1 = 1` / `0 = 1`, any other value v
 *                        becomes `not (v = 0)` (MakeCode's truthiness of a
 *                        number)
 *
 * `kind` is command | reporter | boolean | hat. A hat is spelled with a
 * leading `when` and written back as `WHEN …:`. `alias: true` marks a
 * shorter spelling the parser also reads (an optional trailing argument
 * left out); `defaults` fills what it leaves out, and the decompiler always
 * writes the full word, so the round trip reaches a fixed point. `early:
 * true` marks a reporter whose slots may hold a signed number or an
 * unbracketed expression, so parseValue tries it BEFORE splitting the text
 * at an operator (`arcade projectile … vx -50 vy 0 …`).
 *
 * Reporters and booleans start with `arcade` or name an array reference /
 * value explicitly, so none of them can read as a variable; a value that
 * starts with `arcade` and is no word here is refused, not made a variable.
 */

// rotationDegrees before rotation: the alternation takes the first that matches.
// rotation is PXT's Sprite.rotation (radians), rotationDegrees its degrees form,
// data the sprite's \`data\` value (any value, not only a number).
const PROPERTIES = 'x|y|left|right|top|bottom|vx|vy|ax|ay|fx|fy|sx|sy|scale|width|height|z|lifespan|rotationDegrees|rotation|data';
const FLAGS = 'AutoDestroy|StayInScreen|BounceOnWall|Invisible|Ghost|GhostThroughSprites|GhostThroughWalls|'
    + 'GhostThroughTiles|DestroyOnWall|RelativeToCamera';
const LAYOUTS = '"Left"|"Right"|"Top"|"Bottom"|"Center"|"Full"';
const PROJECTILE_MODES = 'text:side|kind|sprite|kind-source';

const w = (op, kind, words, extra = {}) => Object.freeze({ op, kind, words, ...extra });

export const ARCADE_WORDS = Object.freeze([
    // ---- hats ---------------------------------------------------------------
    w('arcade_whenUpdate', 'hat', 'when arcade updates'),
    w('arcade_whenInterval', 'hat', 'when arcade every {PERIOD} ms'),
    w('arcade_whenRegisteredUpdate', 'hat', 'when arcade update handler {TOKEN} runs'),
    w('arcade_whenRegisteredInterval', 'hat', 'when arcade interval handler {TOKEN} runs'),
    w('arcade_whenRegisteredMultiplayerButton', 'hat', 'when arcade multiplayer button handler {TOKEN} runs'),
    w('arcade_whenRegisteredButton', 'hat', 'when arcade button handler {TOKEN} runs'),
    w('arcade_whenRegisteredKindDestroyed', 'hat', 'when arcade destroyed kind handler {TOKEN} runs'),
    w('arcade_whenRegisteredOverlap', 'hat', 'when arcade overlap handler {TOKEN} runs'),
    w('arcade_whenRegisteredScenePush', 'hat', 'when arcade scene push handler {TOKEN} runs'),
    w('arcade_whenRegisteredScenePop', 'hat', 'when arcade scene pop handler {TOKEN} runs'),
    w('arcade_whenRegisteredForever', 'hat', 'when arcade forever handler {TOKEN} runs'),
    w('arcade_whenRegisteredLifeZero', 'hat', 'when arcade life zero handler {TOKEN} runs'),
    w('arcade_whenRegisteredCountdown', 'hat', 'when arcade countdown handler {TOKEN} runs'),
    w('arcade_whenRegisteredWall', 'hat', 'when arcade wall handler {TOKEN} runs'),
    w('arcade_whenRegisteredTile', 'hat', 'when arcade tile handler {TOKEN} runs'),
    w('arcade_whenRegisteredCreated', 'hat', 'when arcade creation handler {TOKEN} runs'),
    w('arcade_whenRegisteredDestroyed', 'hat', 'when arcade destruction handler {TOKEN} runs'),
    w('arcade_whenSpriteCreated', 'hat', 'when arcade kind {KIND} created'),
    w('arcade_whenSpriteDestroyed', 'hat', 'when arcade kind {KIND} destroyed'),
    w('arcade_whenSpritesOverlap', 'hat', 'when arcade kinds {A} and {B} overlap'),
    w('arcade_whenCountdownEnds', 'hat', 'when arcade countdown ends'),

    // ---- commands: score, life, scenes, camera --------------------------------
    w('arcade_playerLookup', 'reporter', 'arcade player by {MODE:number|index} {VALUE}'),
    w('arcade_allPlayers', 'reporter', 'arcade all players'),
    w('arcade_playerSprite', 'reporter', 'arcade sprite of player {PLAYER}'),
    w('arcade_registerMultiplayerButtonHandler', 'command', 'arcade register multiplayer button {BUTTON} event {EVENT} as {TOKEN} capturing {CAPTURES}'),
    w('arcade_eventPlayer', 'reporter', 'arcade event player'),
    w('arcade_playerButtonPressed', 'boolean', 'arcade player {PLAYER} button {BUTTON} pressed'),
    w('arcade_createPlayerState', 'reporter', 'arcade create player state key'),
    w('arcade_getPlayerState', 'reporter', 'arcade state {KEY} of player {PLAYER}'),
    w('arcade_setPlayerState', 'command', 'arcade set state {KEY} of player {PLAYER} to {VALUE}'),
    w('arcade_changePlayerState', 'command', 'arcade change state {KEY} of player {PLAYER} by {VALUE}'),
    w('arcade_movePlayerWithButtons', 'command', 'arcade move player {PLAYER} with buttons vx {VX} vy {VY}'),
    w('arcade_setPlayerSprite', 'command', 'arcade set sprite of player {PLAYER} to {ID}'),
    w('arcade_playerBySprite', 'reporter', 'arcade player of sprite {ID}'),
    w('arcade_playerProperty', 'reporter', 'arcade player {READ:safe|member} property {PROPERTY} of {PLAYER}'),
    w('arcade_setscore', 'command', 'arcade set score to {N}'),
    w('arcade_changescore', 'command', 'arcade change score by {N}'),
    w('arcade_setPlayerScore', 'command', 'arcade set score player {PLAYER} to {VALUE}'),
    w('arcade_changePlayerScore', 'command', 'arcade change score player {PLAYER} by {VALUE}'),
    w('arcade_setLife', 'command', 'arcade set life player {PLAYER} to {VALUE}'),
    w('arcade_changeLife', 'command', 'arcade change life player {PLAYER} by {VALUE}'),
    w('arcade_pushScene', 'command', 'arcade push scene'),
    w('arcade_popScene', 'command', 'arcade pop scene'),
    w('arcade_centerCameraAt', 'command', 'arcade center camera x {X} y {Y}'),
    w('arcade_cameraFollowSprite', 'command', 'arcade camera follow sprite {ID}'),
    w('arcade_setBackgroundColor', 'command', 'arcade set background color to {COLOR}'),
    w('arcade_setBackgroundImage', 'command', 'arcade set background image {IMAGE}'),
    w('arcade_startCountdown', 'command', 'arcade start countdown {N}'),
    w('arcade_stopCountdown', 'command', 'arcade stop countdown'),
    w('arcade_splash', 'command', 'arcade splash {TITLE} subtitle {SUBTITLE}'),
    w('arcade_showLongText', 'command', `arcade long text {TEXT} layout {LAYOUT:${LAYOUTS}}`),
    w('arcade_log', 'command', 'arcade log {TEXT}'),

    // ---- commands: handler registration (the handler is a procedure token) -----
    w('arcade_registerUpdateHandler', 'command', 'arcade register update as {TOKEN} capturing {CAPTURES}'),
    w('arcade_registerForeverHandler', 'command', 'arcade register forever as {TOKEN} capturing {CAPTURES}'),
    w('arcade_registerCountdownHandler', 'command', 'arcade register countdown as {TOKEN} capturing {CAPTURES}'),
    w('arcade_registerIntervalHandler', 'command', 'arcade register interval {INTERVAL} as {TOKEN} capturing {CAPTURES}'),
    w('arcade_registerButtonHandler', 'command',
        'arcade register button {BUTTON} event {EVENT} as {TOKEN} capturing {CAPTURES}'),
    w('arcade_registerDestroyedHandler', 'command',
        'arcade register destroyed kind {KIND} as {TOKEN} capturing {CAPTURES}'),
    w('arcade_registerOverlapHandler', 'command',
        'arcade register overlap kind {KIND} with kind {OTHER_KIND} as {TOKEN} capturing {CAPTURES}'),
    w('arcade_registerScenePushHandler', 'command', 'arcade register scene push as {TOKEN} capturing {CAPTURES}'),
    w('arcade_registerScenePopHandler', 'command', 'arcade register scene pop as {TOKEN} capturing {CAPTURES}'),
    w('arcade_registerLifeZeroHandler', 'command',
        'arcade register life zero player {PLAYER} as {TOKEN} capturing {CAPTURES}'),
    w('arcade_registerLifeZeroHandler', 'command', 'arcade register life zero as {TOKEN} capturing {CAPTURES}',
        { alias: true, defaults: { PLAYER: '1' } }),
    w('arcade_registerWallHandler', 'command', 'arcade register wall kind {KIND} as {TOKEN} capturing {CAPTURES}'),
    w('arcade_registerTileHandler', 'command',
        'arcade register tile kind {KIND} image {IMAGE} as {TOKEN} capturing {CAPTURES}'),
    w('arcade_registerSpriteCreated', 'command', 'arcade register creation kind {KIND} as {TOKEN} capturing {CAPTURES}'),
    w('arcade_registerSpriteCreated', 'command', 'arcade register creation kind {KIND} as {TOKEN}',
        { alias: true, defaults: { CAPTURES: '""' } }),
    w('arcade_registerSpriteDestroyed', 'command', 'arcade register destruction of {ID} as {TOKEN}'),

    // ---- commands: a call frame's locals and captures --------------------------
    w('arcade_setCaptured', 'command', 'arcade set captured {NAME:name} to {VALUE}'),
    w('arcade_setLocal', 'command', 'arcade set local {NAME:name} to {VALUE}'),
    w('arcade_returnValue', 'command', 'arcade return value {VALUE}'),

    // ---- commands: sprites ------------------------------------------------------
    w('arcade_destroySprite', 'command', 'arcade destroy {ID}'),
    w('arcade_spriteSay', 'command',
        'arcade say {ID} text {TEXT} for {DURATION} ms animated {ANIMATED:bool} text color {FOREGROUND} '
        + 'box color {BACKGROUND} mode {MODE:"text"|"legacy"}'),
    w('arcade_setSpritePosition', 'command', 'arcade set position of {ID} x {X} y {Y}'),
    w('arcade_setSpriteScaleCore', 'command',
        'arcade scale core of {ID} x {SX} y {SY} anchor {ANCHOR} proportional {PROPORTIONAL:cond}'),
    // Before `arcade set scale of … to …` (the property word): `anchor` ends it.
    w('arcade_setSpriteScale', 'command', 'arcade set scale of {ID} to {VALUE} anchor {ANCHOR}'),
    w('arcade_changeSpriteScale', 'command', 'arcade change scale of {ID} by {VALUE} anchor {ANCHOR}'),
    w('arcade_setSpriteProperty', 'command', `arcade set {PROPERTY:${PROPERTIES}} of {ID} to {VALUE}`),
    w('arcade_controlSprite', 'command', 'arcade control sprite {ID} vx {VX} vy {VY}'),
    w('arcade_setSpriteImage', 'command', 'arcade set image of {ID} to {IMAGE}'),
    w('arcade_setSpritePixel', 'command', 'arcade set pixel of {ID} x {X} y {Y} color {COLOR}'),
    w('arcade_drawSpriteImage', 'command',
        'arcade draw {OP:fillRect|drawLine} of {ID} x {X} y {Y} width {W} height {H} color {COLOR}'),
    w('arcade_mutateSpriteImage', 'command',
        'arcade image {OP:fill|replace|flipX|flipY} of {ID} color {COLOR} replacement {TO}'),
    w('arcade_setSpriteCostume', 'command', 'arcade set costume of {ID} to {COSTUME}'),
    w('arcade_setSpriteFlag', 'command', `arcade set flag {FLAG:${FLAGS}} of {ID} to {ON:cond}`),
    w('arcade_setSpriteStayInScreen', 'command', 'arcade keep {ID} in screen {ON:cond}'),
    w('arcade_setSpriteAutoDestroy', 'command', 'arcade auto destroy {ID} outside screen {ON:cond}'),
    w('arcade_setSpriteBounceOnWall', 'command', 'arcade bounce {ID} on wall {ON:cond}'),
    w('arcade_setSpriteGhostThroughSprites', 'command', 'arcade ghost {ID} through sprites {ON:cond}'),
    w('arcade_setSpriteKind', 'command', 'arcade set kind of {ID} to {KIND}'),

    // ---- commands: images --------------------------------------------------------
    w('arcade_mutateImage', 'command',
        'arcade mutate image {OP:fill|replace|flipX|flipY} {IMAGE} color {COLOR} replacement {TO}'),
    w('arcade_blitImage', 'command',
        'arcade blit image {OP:drawImage|drawTransparentImage} {IMAGE} source {SOURCE} x {X} y {Y}'),
    w('arcade_setImagePixel', 'command', 'arcade set image pixel {IMAGE} x {X} y {Y} color {COLOR}'),
    w('arcade_drawImage', 'command',
        'arcade draw image {OP:fillRect|drawLine} {IMAGE} x {X} y {Y} width {W} height {H} color {COLOR}'),

    // ---- commands: physics engines, animations, tiles -----------------------------
    w('arcade_setScenePhysicsEngine', 'command', 'arcade set physics engine of scene {SCENE} to {ENGINE}'),
    w('arcade_setPhysicsEngineProperty', 'command',
        'arcade set physics engine property {PROPERTY:maxSpeed|minStep|maxStep} of {ENGINE} to {VALUE}'),
    w('arcade_addAnimationFrame', 'command', 'arcade add animation frame {ANIMATION} image {IMAGE}'),
    w('arcade_attachAnimation', 'command', 'arcade attach animation {ANIMATION} to sprite {ID}'),
    w('arcade_setAnimationAction', 'command', 'arcade set animation action of {ID} to {ACTION}'),
    w('arcade_setAnimationInterval', 'command', 'arcade set animation interval {ANIMATION} to {INTERVAL}'),
    w('arcade_runImageAnimation', 'command', 'arcade animate sprite {ID} frames {FRAMES} interval {INTERVAL} loop {LOOP:cond}'),
    w('arcade_stopAnimation', 'command', 'arcade stop animations of {ID} type {TYPE}'),
    w('arcade_setLegacyTilemap', 'command', 'arcade set color-coded map image {IMAGE} scale {SCALE}'),
    w('arcade_setLegacyTile', 'command', 'arcade set color tile {INDEX} image {IMAGE} wall {WALL}'),
    w('arcade_setLegacyTileAt', 'command', 'arcade set color tile {TILE} index {INDEX}'),
    w('arcade_placeOnLegacyTile', 'command', 'arcade on color tile {TILE} place sprite {ID}'),
    w('arcade_placeOnRandomLegacyTile', 'command', 'arcade place sprite {ID} on random color tile {INDEX}'),
    w('arcade_setTilemap', 'command', 'arcade set tilemap data {DATA}'),
    w('arcade_setWallAt', 'command', 'arcade set tile wall {LOCATION} to {WALL:cond}'),
    w('arcade_setTileAt', 'command', 'arcade set tile {LOCATION} image {IMAGE}'),
    w('arcade_placeOnRandomTile', 'command', 'arcade place sprite {ID} on random tile image {IMAGE}'),
    w('arcade_placeOnTile', 'command', 'arcade place sprite {ID} on tile {LOCATION}'),

    // ---- commands: array references ------------------------------------------------
    w('arrays_mutateReference', 'command', 'mutate array reference {ARRAY} op {OP} index {INDEX} value {VALUE}'),

    // ---- reporters read before operator splitting (signed or spaced slots) ---------
    w('arcade_functionArgument', 'reporter', 'arcade function argument {VALUE} rest {REST}', { early: true }),
    w('arcade_callFunction', 'reporter', 'arcade call function {NAME} arguments {ARGS}', { early: true }),
    w('arcade_spawnSprite', 'reporter',
        'arcade spawn template {TEMPLATE} kind {KIND} x {X} y {Y} width {WIDTH} height {HEIGHT}', { early: true }),
    w('arcade_spawnImageProjectile', 'reporter',
        `arcade projectile image {IMAGE} template {TEMPLATE} kind {KIND} vx {VX} vy {VY} mode {MODE:${PROJECTILE_MODES}} `
        + 'source {SOURCE}', { early: true }),
    w('arcade_spawnImageProjectile', 'reporter',
        `arcade projectile image {IMAGE} template {TEMPLATE} kind {KIND} vx {VX} vy {VY} mode {MODE:${PROJECTILE_MODES}}`,
        { early: true, alias: true, defaults: { SOURCE: '""' } }),
    w('arcade_spawnProjectile', 'reporter',
        'arcade projectile template {TEMPLATE} kind {KIND} vx {VX} vy {VY} width {WIDTH} height {HEIGHT} '
        + `mode {MODE:${PROJECTILE_MODES}} source {SOURCE}`, { early: true }),
    w('arcade_spawnProjectile', 'reporter',
        'arcade projectile template {TEMPLATE} kind {KIND} vx {VX} vy {VY} width {WIDTH} height {HEIGHT} '
        + `mode {MODE:${PROJECTILE_MODES}}`, { early: true, alias: true, defaults: { SOURCE: '""' } }),
    w('arcade_askForNumber', 'reporter', 'arcade ask number {QUESTION}', { early: true }),
    w('arcade_askForString', 'reporter', 'arcade ask text {QUESTION}', { early: true }),

    // ---- reporters: sprites ------------------------------------------------------------
    w('arcade_createSprite', 'reporter', 'arcade create template {TEMPLATE} kind {KIND} width {WIDTH} height {HEIGHT}'),
    w('arcade_createImageSprite', 'reporter', 'arcade create image {IMAGE} template {TEMPLATE} kind {KIND}'),
    w('arcade_spawnImageSprite', 'reporter', 'arcade spawn image {IMAGE} template {TEMPLATE} kind {KIND} x {X} y {Y}'),
    w('arcade_spriteToString', 'reporter', 'arcade text of sprite {ID}'),
    w('arcade_spritePixel', 'reporter', 'arcade pixel of {ID} x {X} y {Y}'),
    w('arcade_spriteImage', 'reporter', 'arcade image of {ID}'),
    w('arcade_spriteProperty', 'reporter', `arcade property {PROPERTY:${PROPERTIES}} of {ID}`),
    w('arcade_spritesOfKind', 'reporter', 'arcade sprite array kind {KIND}'),
    w('arcade_spriteCount', 'reporter', 'arcade count kind {KIND}'),
    w('arcade_controllerStep', 'reporter', 'arcade controller {AXIS:menu:axes:x|y} step {STEP}'),
    w('arcade_eventSprite', 'reporter', 'arcade event {WHICH:first|second}'),
    w('arcade_eventLocation', 'reporter', 'arcade event location'),
    w('arcade_getCaptured', 'reporter', 'arcade captured {NAME:name}'),
    w('arcade_getLocal', 'reporter', 'arcade local {NAME:name}'),
    w('arcade_getscore', 'reporter', 'arcade score'),
    // `has score` before `score`: the lazy slot would read "(1) has" as the player.
    w('arcade_hasLife', 'boolean', 'arcade player {PLAYER} has life'),
    w('arcade_hasPlayerScore', 'boolean', 'arcade player {PLAYER} has score'),
    w('arcade_getPlayerScore', 'reporter', 'arcade player {PLAYER} score'),
    w('arcade_getLife', 'reporter', 'arcade life player {PLAYER}'),
    w('arcade_backgroundImage', 'reporter', 'arcade background image'),
    w('arcade_backgroundColor', 'reporter', 'arcade background color'),
    w('arcade_cameraProperty', 'reporter', 'arcade camera property {PROPERTY}'),

    // ---- reporters: scenes, physics engines, animations ------------------------------------
    w('arcade_currentScene', 'reporter', 'arcade current scene'),
    w('arcade_scenePhysicsEngine', 'reporter', 'arcade physics engine of scene {SCENE}'),
    w('arcade_createPhysicsEngine', 'reporter',
        'arcade create physics engine max speed {MAX_SPEED} min step {MIN_STEP} max step {MAX_STEP}'),
    w('arcade_physicsEngineProperty', 'reporter',
        'arcade physics engine property {PROPERTY:maxSpeed|minStep|maxStep} of {ENGINE}'),
    w('arcade_createAnimation', 'reporter', 'arcade create animation action {ACTION} interval {INTERVAL}'),
    w('arcade_animationProperty', 'reporter', 'arcade animation {PROPERTY:image|action|interval} of {ANIMATION}'),

    // ---- reporters and booleans: tiles -------------------------------------------------------
    w('arcade_legacyTileLocation', 'reporter', 'arcade color tile column {COLUMN} row {ROW}'),
    w('arcade_legacyTilesOfType', 'reporter', 'arcade color tile array index {INDEX}'),
    w('arcade_legacyTileProperty', 'reporter', 'arcade color tile {PROPERTY:x|y|tileSet} of {TILE}'),
    w('arcade_tileLocation', 'reporter', 'arcade tile location column {COLUMN} row {ROW}'),
    w('arcade_tilesOfType', 'reporter', 'arcade tile array image {IMAGE}'),
    w('arcade_tileLocationProperty', 'reporter',
        'arcade tile {PROPERTY:column|row|x|y|left|right|top|bottom|tileSet} of {LOCATION}'),
    w('arcade_tileIs', 'boolean', 'arcade tile {LOCATION} equals image {IMAGE}'),
    w('arcade_tileIsWall', 'boolean', 'arcade tile {LOCATION} is wall'),
    w('arcade_isHittingTile', 'boolean', 'arcade sprite {ID} hitting wall {DIRECTION}'),

    // ---- reporters and booleans: images -------------------------------------------------------
    w('arcade_createImage', 'reporter', 'arcade new image width {WIDTH} height {HEIGHT}'),
    w('arcade_cloneImage', 'reporter', 'arcade copy image {IMAGE}'),
    w('arcade_imageProperty', 'reporter', 'arcade image {PROPERTY:width|height} of {IMAGE}'),
    w('arcade_imagePixel', 'reporter', 'arcade image pixel {IMAGE} x {X} y {Y}'),
    w('arcade_imagesOverlap', 'boolean', 'arcade images overlap {IMAGE} source {SOURCE} x {X} y {Y}'),
    w('arcade_animationAssetFrames', 'reporter',
        'arcade animation frames resource {RESOURCE:menu:animationAssets:none}', {literalMenu: true}),
    w('arcade_animationAssetFreshFrames', 'reporter',
        'arcade animation fresh frames resource {RESOURCE:menu:animationAssets:none}', {literalMenu: true}),
    w('arcade_animationAssetInterval', 'reporter',
        'arcade animation interval resource {RESOURCE:menu:animationAssets:none}', {literalMenu: true}),
    w('arcade_frameImage', 'reporter',
        'arcade frame image array {KEY} index {INDEX} template {TEMPLATE} start {START} count {COUNT}'),
    // Last of the arcade words: its first slot follows `arcade` directly.
    w('arcade_spriteOverlaps', 'boolean', 'arcade {A} overlaps {B}'),

    // ---- array references and MakeCode values (the arrays extension) --------------------------
    w('arrays_namedReference', 'reporter', 'reference to named array {NAME}'),
    w('arrays_parseLegacyValue', 'reporter', 'parse array input {VALUE}'),
    w('arrays_jsonValue', 'reporter', 'JSON text of value {VALUE}'),
    w('arrays_specialValue', 'reporter', '{KIND:undefined|null} value'),
    w('arrays_valueBinary', 'reporter', 'calculate value {LEFT} op {OP:"+"|"-"|"*"|"/"|"%"} with {RIGHT}'),
    w('arrays_valueUnary', 'reporter', 'convert value {VALUE} op {OP:"+"|"-"}'),
    w('arrays_valueTruthy', 'boolean', 'truthiness of value {VALUE}'),
    w('arrays_valueCompare', 'boolean', 'compare value {LEFT} op {OP:"=="|"!="|"==="|"!=="|"<"|">"|"<="|">="} with {RIGHT}'),
    w('arrays_referenceValues', 'reporter', 'array value {VALUE} rest {REST}'),
    w('arrays_createReference', 'reporter', 'new array reference from {VALUES}'),
    w('arrays_referenceTruthy', 'boolean', 'truthiness of item {INDEX} of array reference {ARRAY}'),
    w('arrays_referenceItem', 'reporter', 'item {INDEX} of array reference {ARRAY}'),
    w('arrays_referenceLength', 'reporter', 'length of array reference {ARRAY}'),
    w('arrays_referenceRandom', 'reporter', 'random item of array reference {ARRAY}'),
    w('arrays_referenceRemove', 'boolean', 'remove value {VALUE} from array reference {ARRAY}'),
    w('arrays_referenceTake', 'reporter', '{OP:text:pop|shift|removeAt} from array reference {ARRAY} index {INDEX}'),
    w('arrays_referenceIndexOf', 'reporter', 'index of {VALUE} in array reference {ARRAY} from {INDEX}'),
    w('arrays_referenceIndexOf', 'reporter', 'index of {VALUE} in array reference {ARRAY}',
        { alias: true, defaults: { INDEX: '0' } })
]);

/** Every opcode the table spells (aliases share their opcode). */
export const ARCADE_DIALECT_OPS = Object.freeze([...new Set(ARCADE_WORDS.map((e) => e.op))]);

// ---- the slot grammar ------------------------------------------------------------

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const compiled = new Map();
/**
 * A word's parts and the regular expression the parser matches it with
 * (through matchTopLevel, so keywords count only outside (…) and "…").
 */
export function compileArcadeWord(entry) {
    if (compiled.has(entry)) return compiled.get(entry);
    const parts = entry.words.split(/\s+/).map((tok) => {
        const m = /^\{([A-Z0-9_]+)(?::(.+))?\}$/.exec(tok);
        if (!m) return { literal: tok };
        const [, slot, spec] = m;
        if (!spec) return { slot, value: true };
        if (spec === 'name') return { slot, name: true };
        if (spec === 'cond' || spec === 'bool') return { slot, value: true, [spec]: true };
        if (spec.startsWith('menu:')) {
            const [, menu, choices] = spec.split(':');
            return {slot, menu, choices: choices.split('|')};
        }
        if (spec.startsWith('text:')) return { slot, text: true, choices: spec.slice(5).split('|') };
        const choices = spec.split('|');
        if (choices.every((c) => /^".*"$/.test(c))) return { slot, field: true, quoted: true, choices: choices.map((c) => c.slice(1, -1)) };
        return { slot, field: true, choices };
    });
    const last = parts.length - 1;
    const source = parts.map((p, i) => {
        if (p.literal !== undefined) return escapeRe(p.literal);
        if (p.name) return '([A-Za-z_]\\w*)';
        if (p.quoted) return '("[^"]*")';
        if (p.choices && !p.menu) return `(${p.choices.map(escapeRe).join('|')})`;
        return i === last ? '(.+)' : '(.+?)';
    }).join('\\s+');
    const shape = { parts, re: new RegExp(`^${source}$`, 'i'), first: parts[0] };
    compiled.set(entry, shape);
    return shape;
}

/** The lower-case words a reporter/boolean of the table can begin with (a cheap first filter). */
export const ARCADE_FIRST_WORDS = Object.freeze(new Set(ARCADE_WORDS.flatMap((e) => {
    const { first } = compileArcadeWord(e);
    return first.literal !== undefined ? [first.literal.toLowerCase()] : first.choices.map((c) => c.toLowerCase());
})));

/** The entries of the given kinds, in table order (the order is the precedence). */
export function arcadeWordsOf(kinds) {
    return ARCADE_WORDS.filter((e) => kinds.includes(e.kind));
}

/** The entry a block is written back as: the first non-alias word for its opcode. */
const byOpcode = new Map();
for (const e of ARCADE_WORDS) if (!e.alias && !byOpcode.has(e.op)) byOpcode.set(e.op, e);
export function arcadeWordFor(opcode) {
    return byOpcode.get(opcode) || null;
}

/**
 * Write a block back as its word. `read` supplies the slot read-outs:
 * read.value(input), read.text(input) (raw text), read.field(field),
 * read.menu(input, menuName) (bare choice or value expression),
 * read.cond(input) (a Boolean input as condition text, parenthesised).
 */
export function spellArcadeWord(entry, read) {
    const words = compileArcadeWord(entry).parts.map((p) => {
        if (p.literal !== undefined) return p.literal;
        if (p.field) {
            const stored = read.field(p.slot);
            return p.quoted ? `"${stored}"` : stored;
        }
        if (p.menu) {
            const value = read.menu(p.slot, p.menu);
            return entry.literalMenu && !p.choices.includes(value) && !/^["(]/.test(value) ? JSON.stringify(value) : value;
        }
        if (p.name || p.text) return read.text(p.slot);
        if (p.bool || p.cond) return read.cond(p.slot);
        return read.value(p.slot);
    }).join(' ');
    return entry.kind === 'hat' ? `WHEN ${words.replace(/^when\s+/i, '')}:` : words;
}

/**
 * Migrate the five historical Arcade/Arrays slot-shape mismatches before a
 * project enters native Blocks. Mutates only recognized, valid menu literals;
 * returns whether it changed the block. Native fields/inputs win. Reporter
 * expressions in old direct-menu slots cannot be represented by a dropdown
 * and are deliberately left untouched for diagnostics, rather than guessed.
 */
export function normalizeArcadeBlockSchema(block) {
    const entry = arcadeWordFor(block?.opcode);
    if (!entry) return false;
    const direct = /^arrays_(specialValue|valueBinary|valueUnary|valueCompare)$/.test(entry.op);
    if (!direct && entry.op !== 'arcade_controllerStep') return false;
    let changed = false;
    for (const part of compileArcadeWord(entry).parts) {
        if (!part.slot || !part.choices) continue;
        const name = part.slot;
        const field = block.fields?.[name];
        const input = block.inputs?.[name];
        if (direct && part.field && input) {
            const literal = input[1];
            const legacy = Array.isArray(literal) && literal[0] === 10 && part.choices.includes(literal[1]);
            if (field && part.choices.includes(field[0])) {
                delete block.inputs[name];
                changed = true;
            } else if (!field && legacy) {
                block.fields ||= {};
                block.fields[name] = [literal[1], null];
                delete block.inputs[name];
                changed = true;
            }
        } else if (entry.op === 'arcade_controllerStep' && name === 'AXIS' && field && part.choices.includes(field[0])) {
            block.inputs ||= {};
            if (!input) block.inputs[name] = [1, [10, field[0]]];
            delete block.fields[name];
            changed = true;
        }
    }
    return changed;
}

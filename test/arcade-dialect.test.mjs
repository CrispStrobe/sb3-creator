/**
 * The MakeCode Arcade / array-reference words (arcadeDialect.js): every word
 * parses to its one block and decompiles back to the same text, a word with
 * a value in a field it does not have is refused, and the words keep D5/D6's
 * rules (argument slots take expressions, an unreadable line is an error,
 * a comparison used as a value still warns).
 *
 * The words are what Lite's MakeCode Arcade importer (arcade-translate.js)
 * writes, so a word that stopped reading back would lose an Arcade call on
 * the way round. WORD_LINES is written out, not generated from the table:
 * deleting a word from the table must make its line here unreadable.
 */
import {describe, test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import JSZip from 'jszip';
import pythonToPseudocode from '../src/utils/pythonToPseudocode.js';
import javascriptToPseudocode from '../src/utils/javascriptToPseudocode.js';
import {ARCADE_WORDS, ARCADE_DIALECT_OPS, compileArcadeWord, arcadeWordsOf, normalizeArcadeBlockSchema} from '../src/utils/arcadeDialect.js';

// A shorter spelling the parser also reads; it is written back as the full word.
const ALIAS = true;

// [kind, opcode, one line of the word with a value in every slot, ALIAS?]
const WORD_LINES = [
    ['reporter', 'arcade_truncateNumber', 'arcade truncate (n + 1)'],
    ['reporter', 'arcade_signNumber', 'arcade sign of (n + 1)'],
    ['command', 'arcade_copyImageFrom', 'arcade copy pixels into image artwork from other'],
    ['command', 'arcade_scrollImage', 'arcade scroll image artwork x (n + 1) y -2'],
    ['hat', 'arcade_whenParallelHandler', 'when arcade parallel handler (n + 1) runs'],
    ['command', 'arcade_startParallelHandler', 'arcade run parallel as "worker" capturing "weight enabled"'],
    ['reporter', 'arcade_animationAssetFrames', 'arcade animation frames resource "a1b2-resource"'],
    ['reporter', 'arcade_animationAssetFreshFrames', 'arcade animation fresh frames resource (resourceId)'],
    ['reporter', 'arcade_animationAssetInterval', 'arcade animation interval resource (resourceId)'],
    ['hat', 'arcade_whenUpdate', 'when arcade updates'],
    ['hat', 'arcade_whenInterval', 'when arcade every (n + 1) ms'],
    ['hat', 'arcade_whenRegisteredUpdate', 'when arcade update handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredPaint', 'when arcade paint handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredShade', 'when arcade shade handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredInterval', 'when arcade interval handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredButton', 'when arcade button handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredInstanceDestroyed', 'when arcade instance destruction handler (n + 1) runs'],
    ['command', 'arcade_registerInstanceDestroyedHandler', 'arcade register instance destruction of (n + 1) as "instance" capturing "weight enabled"'],
    ['hat', 'arcade_whenRegisteredKindDestroyed', 'when arcade destroyed kind handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredOverlap', 'when arcade overlap handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredScenePush', 'when arcade scene push handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredScenePop', 'when arcade scene pop handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredForever', 'when arcade forever handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredLifeZero', 'when arcade life zero handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredCountdown', 'when arcade countdown handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredWall', 'when arcade wall handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredTile', 'when arcade tile handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredCreated', 'when arcade creation handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredDestroyed', 'when arcade destruction handler (n + 1) runs'],
    ['hat', 'arcade_whenSpriteCreated', 'when arcade kind (n + 1) created'],
    ['hat', 'arcade_whenSpriteDestroyed', 'when arcade kind (n + 1) destroyed'],
    ['hat', 'arcade_whenSpritesOverlap', 'when arcade kinds (n + 1) and hero overlap'],
    ['hat', 'arcade_whenCountdownEnds', 'when arcade countdown ends'],
    ['command', 'arcade_setscore', 'arcade set score to (n + 1)'],
    ['command', 'arcade_changescore', 'arcade change score by (n + 1)'],
    ['command', 'arcade_setPlayerScore', 'arcade set score player (n + 1) to hero'],
    ['command', 'arcade_changePlayerScore', 'arcade change score player (n + 1) by hero'],
    ['command', 'arcade_setLife', 'arcade set life player (n + 1) to hero'],
    ['command', 'arcade_changeLife', 'arcade change life player (n + 1) by hero'],
    ['command', 'arcade_pushScene', 'arcade push scene'],
    ['command', 'arcade_popScene', 'arcade pop scene'],
    ['command', 'arcade_followSprite', 'arcade sprite hero follow target speed 100 turn rate 400'],
    ['command', 'arcade_unfollowSprite', 'arcade sprite hero stop following'],
    ['command', 'arcade_cameraShake', 'arcade shake camera by (n + 1) pixels for 500 ms'],
    ['command', 'arcade_destroySpriteWithEffect', 'arcade destroy hero with effect disintegrate for (n + 1) ms'],
    ['command', 'arcade_startSpriteEffect', 'arcade start effect warmRadial on hero for (n + 1) ms'],
    ['command', 'arcade_startScreenEffect', 'arcade start screen effect starField for (n + 1) ms'],
    ['command', 'arcade_endScreenEffect', 'arcade end screen effect confetti'],
    ['command', 'arcade_clearSpriteEffects', 'arcade clear effects on (n + 1)'],
    ['command', 'arcade_centerCameraAt', 'arcade center camera x (n + 1) y hero'],
    ['command', 'arcade_cameraFollowSprite', 'arcade camera follow sprite (n + 1)'],
    ['command', 'arcade_setPalette', 'arcade set palette hex \"000000ffffff123456ff93c4ff8135fff609249ca378dc52003fad87f2ff8e2ec4a4839f5c406ce5cdc491463d000000\"'],
    ['command', 'arcade_setBackgroundColor', 'arcade set background color to (n + 1)'],
    ['command', 'arcade_setBackgroundImage', 'arcade set background image (n + 1)'],
    ['command', 'arcade_startCountdown', 'arcade start countdown (n + 1)'],
    ['command', 'arcade_stopCountdown', 'arcade stop countdown'],
    ['command', 'arcade_splash', 'arcade splash (n + 1) subtitle hero'],
    ['command', 'arcade_showLongText', 'arcade long text (n + 1) layout "Full"'],
    ['command', 'arcade_log', 'arcade log (n + 1)'],
    ['command', 'arcade_registerUpdateHandler', 'arcade register update as (n + 1) capturing hero'],
    ['command', 'arcade_registerPaintHandler', 'arcade register paint as (n + 1) capturing hero'],
    ['command', 'arcade_registerShadeHandler', 'arcade register shade as (n + 1) capturing hero'],
    ['command', 'arcade_registerForeverHandler', 'arcade register forever as (n + 1) capturing hero'],
    ['command', 'arcade_registerCountdownHandler', 'arcade register countdown as (n + 1) capturing hero'],
    ['command', 'arcade_registerIntervalHandler', 'arcade register interval (n + 1) as hero capturing "Player"'],
    ['command', 'arcade_registerButtonHandler', 'arcade register button (n + 1) event hero as "Player" capturing 2'],
    ['command', 'arcade_registerDestroyedHandler', 'arcade register destroyed kind (n + 1) as hero capturing "Player"'],
    ['command', 'arcade_registerOverlapHandler', 'arcade register overlap kind (n + 1) with kind hero as "Player" capturing 2'],
    ['command', 'arcade_registerScenePushHandler', 'arcade register scene push as (n + 1) capturing hero'],
    ['command', 'arcade_registerScenePopHandler', 'arcade register scene pop as (n + 1) capturing hero'],
    ['command', 'arcade_registerLifeZeroHandler', 'arcade register life zero player (n + 1) as hero capturing "Player"'],
    ['command', 'arcade_registerLifeZeroHandler', 'arcade register life zero as (n + 1) capturing hero', ALIAS],
    ['command', 'arcade_registerWallHandler', 'arcade register wall kind (n + 1) as hero capturing "Player"'],
    ['command', 'arcade_registerTileHandler', 'arcade register tile kind (n + 1) image hero as "Player" capturing 2'],
    ['command', 'arcade_registerSpriteCreated', 'arcade register creation kind (n + 1) as hero capturing "Player"'],
    ['command', 'arcade_registerSpriteCreated', 'arcade register creation kind (n + 1) as hero', ALIAS],
    ['command', 'arcade_registerSpriteDestroyed', 'arcade register destruction of (n + 1) as hero'],
    ['command', 'arcade_setCaptured', 'arcade set captured count to (n + 1)'],
    ['command', 'arcade_setLocal', 'arcade set local count to (n + 1)'],
    ['command', 'arcade_returnValue', 'arcade return value (n + 1)'],
    ['command', 'arcade_destroySprite', 'arcade destroy (n + 1)'],
    ['command', 'arcade_spriteSay', 'arcade say (n + 1) text hero for "Player" ms animated 1 text color 2 box color (arcade local count) mode "legacy"'],
    ['command', 'arcade_setSpritePosition', 'arcade set position of (n + 1) x hero y "Player"'],
    ['command', 'arcade_setSpriteScaleCore', 'arcade scale core of (n + 1) x hero y "Player" anchor 2 proportional (n > 2)'],
    ['command', 'arcade_setSpriteScale', 'arcade set scale of (n + 1) to hero anchor "Player"'],
    ['command', 'arcade_changeSpriteScale', 'arcade change scale of (n + 1) by hero anchor "Player"'],
    ['command', 'arcade_setSpriteProperty', 'arcade set lifespan of (n + 1) to hero'],
    ['command', 'arcade_controlSprite', 'arcade control sprite (n + 1) vx hero vy "Player"'],
    ['command', 'arcade_controlSpriteByController', 'arcade controller 2 move sprite (n + 1) vx hero vy "Player"'],
    ['command', 'arcade_stopControllingSprite', 'arcade controller 4 stop controlling sprite (n + 1)'],
    ['command', 'arcade_setSpriteImage', 'arcade set image of (n + 1) to hero'],
    ['command', 'arcade_setSpritePixel', 'arcade set pixel of (n + 1) x hero y "Player" color 2'],
    ['command', 'arcade_drawSpriteImage', 'arcade draw drawLine of (n + 1) x hero y "Player" width 2 height (arcade local count) color -3'],
    ['command', 'arcade_mutateSpriteImage', 'arcade image flipY of (n + 1) color hero replacement "Player"'],
    ['command', 'arcade_setSpriteCostume', 'arcade set costume of (n + 1) to hero'],
    ['command', 'arcade_setSpriteFlag', 'arcade set flag RelativeToCamera of (n + 1) to (n > 2)'],
    ['command', 'arcade_setSpriteStayInScreen', 'arcade keep (n + 1) in screen (n > 2)'],
    ['command', 'arcade_setSpriteAutoDestroy', 'arcade auto destroy (n + 1) outside screen (n > 2)'],
    ['command', 'arcade_setSpriteBounceOnWall', 'arcade bounce (n + 1) on wall (n > 2)'],
    ['command', 'arcade_setSpriteGhostThroughSprites', 'arcade ghost (n + 1) through sprites (n > 2)'],
    ['command', 'arcade_setSpriteKind', 'arcade set kind of (n + 1) to hero'],
    ['command', 'arcade_mutateImage', 'arcade mutate image flipY (n + 1) color hero replacement "Player"'],
    ['command', 'arcade_blitImage', 'arcade blit image drawTransparentImage (n + 1) source hero x "Player" y 2'],
    ['command', 'arcade_setImagePixel', 'arcade set image pixel (n + 1) x hero y "Player" color 2'],
    ['command', 'arcade_printImageText', 'arcade print "Score" on image (arcade screen image) x (n + 1) y 4 color 2 font small'],
    ['command', 'arcade_legacyGameOver', 'arcade legacy game over win 1 effect unset'],
    ['command', 'arcade_gameOver', 'arcade game over win (n = 1)'],
    ['command', 'arcade_setGameOverEffect', 'arcade set game over effect melt for win 0'],
    ['command', 'arcade_setGameOverMessage', 'arcade set game over message "WELL DONE" for win 1'],
    ['command', 'arcade_setGameOverPlayable', 'arcade set game over sound (arcade melody playable (arcade melody baDing)) looping 0 for win 1'],
    ['command', 'arcade_setGameOverScoringType', 'arcade set game over scoring LowScore'],
    ['command', 'arcade_startImageEffect', 'arcade start image effect dissolve times (n + 1) delay 0 ms'],
    ['command', 'arcade_scrollBackgroundWithCamera', 'arcade scroll background with camera BothDirections layer (n + 1)'],
    ['command', 'arcade_scrollBackgroundWithSpeed', 'arcade scroll background vx -50 vy (n + 1) layer 0'],
    ['command', 'arcade_setBackgroundScrollMultipliers', 'arcade set background scroll multipliers x 0.5 y (n + 1) layer 2'],
    ['command', 'arcade_setBackgroundScrollOffset', 'arcade set background scroll offset x (n + 1) y 0 layer 1'],
    ['command', 'arcade_setBackgroundLayerImage', 'arcade set background layer (n + 1) image hero'],
    ['command', 'arcade_setBackgroundLayerZ', 'arcade set background layer 1 z (n + 1)'],
    ['command', 'arcade_setDartProperty', 'arcade set dart (n + 1) property angleRate to hero'],
    ['command', 'arcade_dartSwitch', 'arcade dart hero setTrace (n > 2)'],
    ['command', 'arcade_dartAction', 'arcade dart (n + 1) throwDart'],
    ['command', 'arcade_setCorgiProperty', 'arcade set corgi hero property jumpVelocity to (n + 1)'],
    ['command', 'arcade_corgiAddPhrase', 'arcade corgi hero add phrase "woof"'],
    ['command', 'arcade_corgiControl', 'arcade corgi hero verticalMovement 1'],
    ['command', 'arcade_corgiBark', 'arcade corgi (n + 1) bark'],
    ['command', 'arcade_sevensegSetCharacter', 'arcade set seven segment (n + 1) character Degree'],
    ['command', 'arcade_sevensegSetColor', 'arcade set seven segment hero color (n + 1)'],
    ['command', 'arcade_sevensegSetRadix', 'arcade set seven segment hero radix Alpha'],
    ['command', 'arcade_sevensegSetScale', 'arcade set seven segment hero scale Half'],
    ['command', 'arcade_sevensegSetProperty', 'arcade set seven segment hero property count to (n + 1)'],
    ['command', 'arcade_sevensegAddDigit', 'arcade add seven segment digit to hero'],
    ['command', 'arcade_playMusic', 'arcade play music (arcade melody playable (arcade melody baDing)) mode UntilDone'],
    ['command', 'arcade_playMelody', 'arcade play melody (arcade melody siren) mode loop'],
    ['command', 'arcade_playSoundEffect', 'arcade play sound effect hero mode InBackground'],
    ['command', 'arcade_playSound', 'arcade play sound (arcade sound BaDing) until done true'],
    ['command', 'arcade_playTone', 'arcade play tone (n + 1) Hz for (arcade beat Half) ms'],
    ['command', 'arcade_ringTone', 'arcade ring tone 440 Hz'],
    ['command', 'arcade_rest', 'arcade rest for (n + 1) ms'],
    ['command', 'arcade_setMusicVolume', 'arcade set music volume to (n + 1)'],
    ['command', 'arcade_setTempo', 'arcade set tempo to 120 bpm'],
    ['command', 'arcade_changeTempo', 'arcade change tempo by -20 bpm'],
    ['command', 'arcade_stopAllSounds', 'arcade stop all sounds'],
    ['command', 'arcade_drawImage', 'arcade draw image drawLine (n + 1) x hero y "Player" width 2 height (arcade local count) color -3'],
    ['command', 'arcade_setScenePhysicsEngine', 'arcade set physics engine of scene (n + 1) to hero'],
    ['command', 'arcade_setPhysicsEngineProperty', 'arcade set physics engine property maxStep of (n + 1) to hero'],
    ['command', 'arcade_addAnimationFrame', 'arcade add animation frame (n + 1) image hero'],
    ['command', 'arcade_attachAnimation', 'arcade attach animation (n + 1) to sprite hero'],
    ['command', 'arcade_setAnimationAction', 'arcade set animation action of (n + 1) to hero'],
    ['command', 'arcade_setAnimationInterval', 'arcade set animation interval (n + 1) to hero'],
    ['command', 'arcade_runImageAnimation', 'arcade animate sprite (n + 1) frames hero interval "Player" loop (n > 2)'],
    ['command', 'arcade_stopAnimation', 'arcade stop animations of (n + 1) type hero'],
    ['command', 'arcade_setTilemap', 'arcade set tilemap data (n + 1)'],
    ['command', 'arcade_setWallAt', 'arcade set tile wall (n + 1) to (n > 2)'],
    ['command', 'arcade_setTileAt', 'arcade set tile (n + 1) image hero'],
    ['command', 'arcade_placeOnRandomTile', 'arcade place sprite (n + 1) on random tile image hero'],
    ['command', 'arcade_placeOnTile', 'arcade place sprite (n + 1) on tile hero'],
    ['command', 'arrays_mutateReference', 'mutate array reference (n + 1) op hero index "Player" value 2'],
    ['reporter', 'arcade_functionArgument', 'arcade function argument (n + 1) rest hero'],
    ['reporter', 'arcade_callFunction', 'arcade call function (n + 1) arguments hero'],
    ['reporter', 'arcade_spawnSprite', 'arcade spawn template (n + 1) kind hero x "Player" y 2 width (arcade local count) height -3'],
    ['reporter', 'arcade_spawnImageProjectile', 'arcade projectile image (n + 1) template hero kind "Player" vx 2 vy (arcade local count) mode kind-source source -3'],
    ['reporter', 'arcade_spawnImageProjectile', 'arcade projectile image (n + 1) template hero kind "Player" vx 2 vy (arcade local count) mode kind-source', ALIAS],
    ['reporter', 'arcade_spawnProjectile', 'arcade projectile template (n + 1) kind hero vx "Player" vy 2 width (arcade local count) height -3 mode kind-source source (n + 1)'],
    ['reporter', 'arcade_spawnProjectile', 'arcade projectile template (n + 1) kind hero vx "Player" vy 2 width (arcade local count) height -3 mode kind-source', ALIAS],
    ['reporter', 'arcade_ask', 'arcade ask yes (n + 1) subtitle "Choose A or B"'],
    ['reporter', 'arcade_askForNumber', 'arcade ask number (n + 1)'],
    ['reporter', 'arcade_askForString', 'arcade ask text (n + 1)'],
    ['reporter', 'arcade_createSprite', 'arcade create template (n + 1) kind hero width "Player" height 2'],
    ['reporter', 'arcade_createImageSprite', 'arcade create image (n + 1) template hero kind "Player"'],
    ['reporter', 'arcade_spawnImageSprite', 'arcade spawn image (n + 1) template hero kind "Player" x 2 y (arcade local count)'],
    ['reporter', 'arcade_spriteToString', 'arcade text of sprite (n + 1)'],
    ['reporter', 'arcade_spritePixel', 'arcade pixel of (n + 1) x hero y "Player"'],
    ['reporter', 'arcade_spriteImage', 'arcade image of (n + 1)'],
    ['reporter', 'arcade_spriteProperty', 'arcade property lifespan of (n + 1)'],
    ['reporter', 'arcade_spritesOfKind', 'arcade sprite array kind (n + 1)'],
    ['reporter', 'arcade_spriteCount', 'arcade count kind (n + 1)'],
    ['reporter', 'arcade_controllerStep', 'arcade controller y step (n + 1)'],
    ['reporter', 'arcade_eventSprite', 'arcade event second'],
    ['reporter', 'arcade_eventLocation', 'arcade event location'],
    ['reporter', 'arcade_getCaptured', 'arcade captured count'],
    ['reporter', 'arcade_getLocal', 'arcade local count'],
    ['reporter', 'arcade_getscore', 'arcade score'],
    ['reporter', 'arcade_getPlayerScore', 'arcade player (n + 1) score'],
    ['boolean', 'arcade_hasLife', 'arcade player (n + 1) has life'],
    ['boolean', 'arcade_hasPlayerScore', 'arcade player (n + 1) has score'],
    ['reporter', 'arcade_getLife', 'arcade life player (n + 1)'],
    ['reporter', 'arcade_backgroundImage', 'arcade background image'],
    ['reporter', 'arcade_screenImage', 'arcade screen image'],
    ['reporter', 'arcade_backgroundColor', 'arcade background color'],
    ['reporter', 'arcade_cameraProperty', 'arcade camera property (n + 1)'],
    ['reporter', 'arcade_currentScene', 'arcade current scene'],
    ['reporter', 'arcade_scenePhysicsEngine', 'arcade physics engine of scene (n + 1)'],
    ['reporter', 'arcade_createPhysicsEngine', 'arcade create physics engine max speed (n + 1) min step hero max step "Player"'],
    ['reporter', 'arcade_physicsEngineProperty', 'arcade physics engine property maxStep of (n + 1)'],
    ['reporter', 'arcade_createAnimation', 'arcade create animation action (n + 1) interval hero'],
    ['reporter', 'arcade_animationProperty', 'arcade animation interval of (n + 1)'],
    ['reporter', 'arcade_tileLocation', 'arcade tile location column (n + 1) row hero'],
    ['reporter', 'arcade_tilesOfType', 'arcade tile array image (n + 1)'],
    ['reporter', 'arcade_tileLocationProperty', 'arcade tile bottom of (n + 1)'],
    ['boolean', 'arcade_tileIs', 'arcade tile (n + 1) equals image hero'],
    ['boolean', 'arcade_tileIsWall', 'arcade tile (n + 1) is wall'],
    ['boolean', 'arcade_isHittingTile', 'arcade sprite (n + 1) hitting wall hero'],
    ['reporter', 'arcade_parseIntegerRadix', 'arcade parse integer "ff" radix (n + 1)'],
    ['reporter', 'arcade_parseInteger', 'arcade parse integer (arcade local count)'],
    ['reporter', 'arcade_frameDeltaTime', 'arcade frame delta time'],
    ['reporter', 'arcade_backgroundScrollOffset', 'arcade background scroll offset y layer (n + 1)'],
    ['reporter', 'arcade_createDart', 'arcade create dart image hero kind "Player" x 10 y (n + 1)'],
    ['reporter', 'arcade_createCorgi', 'arcade create corgi kind "Player" x (n + 1) y 70'],
    ['reporter', 'arcade_dartProperty', 'arcade dart hero property pow'],
    ['reporter', 'arcade_corgiProperty', 'arcade corgi hero property maxJump'],
    ['reporter', 'arcade_sevensegDigit', 'arcade seven segment digit style Thick value (n + 1)'],
    ['reporter', 'arcade_sevensegCounter', 'arcade seven segment counter style Thin scale Half digits 3'],
    ['reporter', 'arcade_sevensegProperty', 'arcade seven segment hero property width'],
    ['reporter', 'arcade_melodyPlayable', 'arcade melody playable hero'],
    ['reporter', 'arcade_stringPlayable', 'arcade string playable "C D E" at (n + 1) bpm'],
    ['reporter', 'arcade_tonePlayable', 'arcade tone playable 262 Hz for (n + 1) ms'],
    ['reporter', 'arcade_soundEffect', 'arcade sound effect wave Square from 400 Hz to 600 Hz volume 255 to 0 for (n + 1) ms effect Vibrato curve Linear'],
    ['reporter', 'arcade_namedMelody', 'arcade melody bigCrash'],
    ['reporter', 'arcade_soundMelody', 'arcade sound PowerUp'],
    ['reporter', 'arcade_beat', 'arcade beat Quarter'],
    ['reporter', 'arcade_musicVolume', 'arcade music volume'],
    ['reporter', 'arcade_musicTempo', 'arcade music tempo'],
    ['reporter', 'arcade_createImage', 'arcade new image width (n + 1) height hero'],
    ['reporter', 'arcade_cloneImage', 'arcade copy image (n + 1)'],
    ['reporter', 'arcade_imageProperty', 'arcade image height of (n + 1)'],
    ['reporter', 'arcade_imagePixel', 'arcade image pixel (n + 1) x hero y "Player"'],
    ['boolean', 'arcade_imagesOverlap', 'arcade images overlap (n + 1) source hero x "Player" y 2'],
    ['reporter', 'arcade_frameImage', 'arcade frame image array (n + 1) index hero template "Player" start 2 count (arcade local count)'],
    ['boolean', 'arcade_spriteOverlaps', 'arcade (n + 1) overlaps hero'],
    ['reporter', 'arrays_namedReference', 'reference to named array (n + 1)'],
    ['reporter', 'arrays_parseLegacyValue', 'parse array input (n + 1)'],
    ['reporter', 'arrays_jsonValue', 'JSON text of value (n + 1)'],
    ['reporter', 'arrays_specialValue', 'null value'],
    ['reporter', 'arrays_valueBinary', 'calculate value (n + 1) op "+" with "Player"'],
    ['reporter', 'arrays_valueUnary', 'convert value (n + 1) op "-"'],
    ['boolean', 'arrays_valueTruthy', 'truthiness of value (n + 1)'],
    ['boolean', 'arrays_valueCompare', 'compare value (n + 1) op ">=" with "Player"'],
    ['reporter', 'arrays_referenceValues', 'array value (n + 1) rest hero'],
    ['reporter', 'arrays_createReference', 'new array reference from (n + 1)'],
    ['boolean', 'arrays_referenceTruthy', 'truthiness of item (n + 1) of array reference hero'],
    ['reporter', 'arrays_referenceItem', 'item (n + 1) of array reference hero'],
    ['reporter', 'arrays_referenceLength', 'length of array reference (n + 1)'],
    ['reporter', 'arrays_referenceRandom', 'random item of array reference (n + 1)'],
    ['boolean', 'arrays_referenceRemove', 'remove value (n + 1) from array reference hero'],
    ['reporter', 'arrays_referenceTake', 'removeAt from array reference (n + 1) index hero'],
    ['reporter', 'arrays_referenceIndexOf', 'index of (n + 1) in array reference hero from "Player"'],
    ['reporter', 'arrays_referenceIndexOf', 'index of (n + 1) in array reference hero', ALIAS],
    ['hat', 'arcade_whenRegisteredMultiplayerButton', 'when arcade multiplayer button handler (n + 1) runs'],
    ['hat', 'arcade_whenRegisteredLegacyWall', 'when arcade color wall handler (n + 1) runs'],
    ['reporter', 'arcade_playerLookup', 'arcade player by number (n + 1)'],
    ['reporter', 'arcade_allPlayers', 'arcade all players'],
    ['reporter', 'arcade_playerSprite', 'arcade sprite of player (n + 1)'],
    ['command', 'arcade_registerMultiplayerButtonHandler', 'arcade register multiplayer button (n + 1) event (n + 1) as (n + 1) capturing (n + 1)'],
    ['reporter', 'arcade_eventPlayer', 'arcade event player'],
    ['boolean', 'arcade_playerButtonPressed', 'arcade player (n + 1) button (n + 1) pressed'],
    ['reporter', 'arcade_createPlayerState', 'arcade create player state key'],
    ['reporter', 'arcade_getPlayerState', 'arcade state (n + 1) of player (n + 1)'],
    ['command', 'arcade_setPlayerState', 'arcade set state (n + 1) of player (n + 1) to (n + 1)'],
    ['command', 'arcade_changePlayerState', 'arcade change state (n + 1) of player (n + 1) by (n + 1)'],
    ['command', 'arcade_movePlayerWithButtons', 'arcade move player (n + 1) with buttons vx (n + 1) vy (n + 1)'],
    ['command', 'arcade_setPlayerSprite', 'arcade set sprite of player (n + 1) to (n + 1)'],
    ['reporter', 'arcade_playerBySprite', 'arcade player of sprite (n + 1)'],
    ['reporter', 'arcade_playerProperty', 'arcade player safe property (n + 1) of (n + 1)'],
    ['command', 'arcade_registerLegacyWallHandler', 'arcade register color wall kind (n + 1) index (n + 1) as (n + 1) capturing (n + 1)'],
    ['command', 'arcade_setLegacyTilemap', 'arcade set color-coded map image (n + 1) scale (n + 1)'],
    ['command', 'arcade_setLegacyTile', 'arcade set color tile (n + 1) image (n + 1) wall (n + 1)'],
    ['command', 'arcade_setLegacyTileAt', 'arcade set color tile (n + 1) index (n + 1)'],
    ['command', 'arcade_placeOnLegacyTile', 'arcade on color tile (n + 1) place sprite (n + 1)'],
    ['command', 'arcade_placeOnRandomLegacyTile', 'arcade place sprite (n + 1) on random color tile (n + 1)'],
    ['reporter', 'arcade_legacyTileLocation', 'arcade color tile column (n + 1) row (n + 1)'],
    ['reporter', 'arcade_legacyTilesOfType', 'arcade color tile array index (n + 1)'],
    ['reporter', 'arcade_legacyTileProperty', 'arcade color tile x of (n + 1)'],
    ['reporter', 'arcade_tileHitFrom', 'arcade sprite (n + 1) wall hit index (n + 1)'],
];

const HEADER = 'GLOBAL n\nGLOBAL v\nGLOBAL hero\nSPRITE S:\n';

/** The line in the context its kind is written in. */
function program(kind, line) {
    if (kind === 'hat') return `${HEADER}WHEN ${line.replace(/^when\s+/i, '')}:\n  hide\n`;
    if (kind === 'command') return `${HEADER}WHEN flag clicked:\n  ${line}\n`;
    if (kind === 'boolean') return `${HEADER}WHEN flag clicked:\n  IF ${line} THEN:\n    hide\n  set v to (${line})\n`;
    return `${HEADER}WHEN flag clicked:\n  set v to (${line})\n`;
}

function compile(bw) {
    const c = new SB3Creator();
    c.parse(bw);
    const blocks = c.project.targets.flatMap((t) => Object.values(t.blocks));
    return {c, blocks};
}

/** parse -> blocks -> decompile -> parse -> decompile, which must not move. */
function fixedPoint(bw) {
    const first = compile(bw);
    const d1 = first.c.decompile();
    const second = compile(d1);
    const d2 = second.c.decompile();
    assert.equal(d2, d1, 'the decompiled text reads back to the same blocks');
    // Opcodes, field values and input names (a variable's id is random per parse).
    const shape = (blocks) => blocks.map((b) => `${b.opcode} ${JSON.stringify(Object.fromEntries(
        Object.entries(b.fields || {}).map(([k, f]) => [k, f[0]])))} ${Object.keys(b.inputs || {}).sort()}`).sort();
    assert.deepEqual(shape(second.blocks), shape(first.blocks), 'the same blocks, field for field');
    return {first, d1};
}

describe('Arcade dialect words', () => {
    test('every opcode of the table has a line here, and every line names a table opcode', () => {
        const here = new Set(WORD_LINES.map(([, op]) => op));
        assert.deepEqual([...here].sort(), [...ARCADE_DIALECT_OPS].sort());
        assert.equal(WORD_LINES.length, ARCADE_WORDS.length, 'one line per spelling, aliases included');
        assert.equal(ARCADE_DIALECT_OPS.length, 268);
    });

    for (const [kind, op, line, alias] of WORD_LINES) {
        test(`${op}: ${line}`, () => {
            const {first, d1} = fixedPoint(program(kind, line));
            assert.deepEqual(first.c.warnings, []);
            const hits = first.blocks.filter((b) => b.opcode === op);
            assert.equal(hits.length, kind === 'boolean' ? 2 : 1, `one ${op} block per use`);
            if (kind === 'hat') assert.equal(hits[0].topLevel, true);
            // Written back as written — except a shorter (alias) spelling, which
            // gains its default, and a Boolean slot's coerced literal (`1` is `1 = 1`).
            const coerced = ARCADE_WORDS.some((e) => e.op === op && /:bool\}/.test(e.words));
            if (!alias && !coerced) {
                const written = kind === 'hat' ? `WHEN ${line.replace(/^when\s+/i, '')}:` : line;
                assert.ok(d1.includes(written), `decompiled as written:\n${d1}`);
            }
        });
    }
});

describe('Arcade dialect: precedence, slots and refusals', () => {
    test('no word is claimed by an earlier word of its kind (a lazy slot reading past its keyword)', () => {
        const fills = [['(a)', '(b)', '(c)', '(d)', '(e)', '(f)', '(g)'], ['x', 'y', 'z', 'w', 'u', 't', 's'],
            ['arcade local q', 'arcade event first', 'arcade local r', 'arcade local s', 'arcade local t',
                'arcade local u', 'arcade local v']];
        const claimed = [];
        for (const kinds of [['hat'], ['command'], ['reporter', 'boolean']]) {
            const order = arcadeWordsOf(kinds);
            for (const entry of order) {
                for (const fill of fills) {
                    let k = 0;
                    const line = compileArcadeWord(entry).parts.map((p) => {
                        if (p.literal !== undefined) return p.literal;
                        if (p.name) return 'nm';
                        if (p.choices) return p.quoted ? `"${p.choices[0]}"` : p.choices[0];
                        return fill[k++];
                    }).join(' ');
                    const first = order.find((e) => compileArcadeWord(e).re.test(line));
                    if (first.op !== entry.op) claimed.push(`${entry.op}: "${line}" read as ${first.op}`);
                }
            }
        }
        assert.deepEqual(claimed, []);
    });

    test('a slot bounded by a keyword takes an unbracketed reporter or a bracketed expression', () => {
        const bw = `${HEADER}WHEN flag clicked:\n`
            + '  arcade auto destroy arcade local firework outside screen (1)\n'
            + '  arcade set x of arcade event first to arcade property x of arcade captured owner\n'
            + '  arcade set image pixel (arcade local canvas) x arcade local depth y (n * 2 + 1) color calculate value (n) op "+" with (1)\n'
            + '  arcade image fill of arcade event first color arcade pixel of arcade local child x (1) y (2) replacement 0\n';
        const {first} = fixedPoint(bw);
        assert.deepEqual(first.c.warnings, []);
        const op = (o) => first.blocks.filter((b) => b.opcode === o);
        assert.equal(op('arcade_getLocal').length, 4);
        const pixel = op('arcade_setImagePixel')[0];
        const blocks = first.c.project.targets[1].blocks;
        assert.equal(blocks[pixel.inputs.COLOR[1]].opcode, 'arrays_valueBinary', 'COLOR holds the calculate block');
        assert.equal(blocks[pixel.inputs.Y[1]].opcode, 'operator_add', 'Y holds (n * 2 + 1)');
        assert.equal(blocks[pixel.inputs.X[1]].opcode, 'arcade_getLocal', 'X holds the unbracketed `arcade local depth`');
        assert.equal(op('arrays_valueBinary').length, 1);
        assert.equal(op('arcade_spritePixel').length, 1);
    });

    test('a word read before operator splitting keeps its signed slots; one read after keeps its operators outside', () => {
        const bw = `${HEADER}WHEN flag clicked:\n`
            + '  set v to arcade projectile template "t" kind "k" vx -50 vy 0 width 4 height 4 mode side\n'
            + '  set n to arcade property x of hero + 1\n';
        const {first} = fixedPoint(bw);
        const projectile = first.blocks.find((b) => b.opcode === 'arcade_spawnProjectile');
        assert.deepEqual(projectile.inputs.VX, [1, [4, '-50']]);
        assert.deepEqual(projectile.inputs.MODE, [1, [10, 'side']]);
        assert.deepEqual(projectile.inputs.SOURCE, [1, [10, '']], 'the alias fills SOURCE');
        assert.equal(first.blocks.filter((b) => b.opcode === 'operator_subtract').length, 0);
        const add = first.blocks.find((b) => b.opcode === 'operator_add');
        assert.ok(add, '`arcade property x of hero + 1` is (the property) + 1');
        const property = first.blocks.find((b) => b.opcode === 'arcade_spriteProperty');
        assert.deepEqual(property.fields.PROPERTY, ['x', null]);
    });

    test('a Boolean word is a condition as it stands, and a Boolean slot takes a condition', () => {
        const bw = `${HEADER}WHEN flag clicked:\n`
            + '  IF truthiness of value (n) THEN:\n    hide\n'
            + '  REPEAT UNTIL not (compare value (n) op "===" with (3)):\n    change n by 1\n'
            + '  arcade set flag ghost of hero to (n > 2)\n'
            + '  arcade say hero text "hi" for 500 ms animated 0 text color 15 box color 1 mode "text"\n'
            + '  arcade say hero text "hi" for 500 ms animated v text color 15 box color 1 mode "legacy"\n';
        const {first} = fixedPoint(bw);
        const byId = (input) => first.c.project.targets[1].blocks[input[1]];
        const iff = first.blocks.find((b) => b.opcode === 'control_if');
        assert.equal(byId(iff.inputs.CONDITION).opcode, 'arrays_valueTruthy', 'not `… = "true"`');
        const flag = first.blocks.find((b) => b.opcode === 'arcade_setSpriteFlag');
        assert.deepEqual(flag.fields.FLAG, ['Ghost', null], 'a field word is stored as the field spells it');
        assert.equal(flag.inputs.ON[0], 2);
        assert.equal(byId(flag.inputs.ON).opcode, 'operator_gt');
        const [quiet, legacy] = first.blocks.filter((b) => b.opcode === 'arcade_spriteSay');
        const zero = byId(quiet.inputs.ANIMATED);
        assert.equal(zero.opcode, 'operator_equals');
        assert.deepEqual([zero.inputs.OPERAND1, zero.inputs.OPERAND2], [[1, [4, '0']], [1, [4, '1']]], 'animated 0 is false');
        assert.equal(byId(legacy.inputs.ANIMATED).opcode, 'operator_not', 'a value v is not (v = 0)');
        assert.deepEqual(legacy.fields.MODE, ['legacy', null]);
    });

    test('an Arcade word with a value its field does not have, or no word at all, is refused, not built', () => {
        const refused = (line) => {
            const c = new SB3Creator();
            assert.throws(() => c.parse(`${HEADER}WHEN flag clicked:\n  ${line}\n`),
                (e) => e.code === 'DIALECT_UNPARSED_LINES' && e.lines.some((l) => l.text === line), line);
        };
        refused('arcade say hero text "hi" for 1 ms animated 1 text color 1 box color 2 mode "shout"');
        refused('arcade set flag Sticky of hero to 1');
        refused('arcade fly hero');
        refused('arcade long text "hi" layout "Sideways"');
        refused('set v to (arcade sprite count kind "Enemy")');
        refused('set v to arcade bogus word');
        const hat = new SB3Creator();
        assert.throws(() => hat.parse(`${HEADER}WHEN arcade explodes:\n  hide\n`),
            (e) => e.code === 'DIALECT_UNPARSED_LINES');
    });

    test('rotation, rotationDegrees and data are sprite properties, each read as itself', () => {
        const c = new SB3Creator();
        c.parse(`${HEADER}WHEN flag clicked:\n  arcade set rotationDegrees of hero to 45\n`
            + '  arcade set rotation of hero to (arcade property rotation of hero)\n'
            + '  arcade set data of hero to (arcade property data of hero)\n');
        const blocks = Object.values(c.project.targets.find((t) => !t.isStage).blocks);
        assert.equal(blocks.filter((b) => b.opcode === 'arcade_setSpriteProperty').length, 3);
        assert.equal(blocks.filter((b) => b.opcode === 'arcade_spriteProperty').length, 2);
        const text = new SB3Creator().decompile(c.project);
        assert.match(text, /arcade set rotationDegrees of hero to 45/);
        assert.match(text, /arcade set rotation of hero to \(?arcade property rotation of hero\)?/);
        assert.match(text, /arcade set data of hero to \(?arcade property data of hero\)?/);
    });

    test('a comparison used as a value still warns (the words did not remove that warning)', () => {
        const c = new SB3Creator();
        c.parse(`${HEADER}WHEN flag clicked:\n  set v to (n > 2)\n`);
        assert.equal(c.warnings.length, 1);
        assert.match(c.warnings[0], /COMPARISON used where a value is expected/);
    });

    test('a whole program round-trips: handlers, sprites, images, tiles, scenes and array references', () => {
        const bw = `${HEADER}WHEN flag clicked:\n`
            + '  set hero to (arcade create template "__t1" kind "Player" width 16 height 16)\n'
            + '  arcade register update as "__u1" capturing "hero"\n'
            + '  arcade register overlap kind "Player" with kind "Food" as "__o1" capturing ""\n'
            + '  set v to new array reference from (array value (1) rest (array value ("two") rest ("[]")))\n'
            + '  mutate array reference (v) op "push" index (0) value (undefined value)\n'
            + '  set n to length of array reference (v)\n'
            + '  arcade set tilemap data "map1"\n'
            + '  arcade place sprite (hero) on random tile image (arcade background image)\n'
            + '  arcade set physics engine of scene (arcade current scene) to (arcade create physics engine max speed (500) min step (2) max step (4))\n'
            + '  arcade push scene\n'
            + 'WHEN arcade update handler "__u1" runs:\n'
            + '  arcade set local count to (arcade captured hero)\n'
            + '  IF arcade player (1) has life THEN:\n'
            + '    arcade change life player (1) by (-1)\n'
            + '  arcade set vx of (arcade local count) to (calculate value (arcade property vx of (arcade local count)) op "*" with (0.5))\n'
            + 'WHEN arcade overlap handler "__o1" runs:\n'
            + '  arcade destroy arcade event second\n'
            + '  arcade change score by 1\n';
        const {first} = fixedPoint(bw);
        assert.deepEqual(first.c.warnings, []);
        const ops = new Set(first.blocks.map((b) => b.opcode));
        for (const op of ['arcade_createSprite', 'arcade_registerUpdateHandler', 'arcade_registerOverlapHandler',
            'arrays_createReference', 'arrays_referenceValues', 'arrays_mutateReference', 'arrays_specialValue',
            'arrays_referenceLength', 'arcade_setTilemap', 'arcade_placeOnRandomTile', 'arcade_backgroundImage',
            'arcade_setScenePhysicsEngine', 'arcade_currentScene', 'arcade_createPhysicsEngine', 'arcade_pushScene',
            'arcade_whenRegisteredUpdate', 'arcade_setLocal', 'arcade_getCaptured', 'arcade_hasLife',
            'arcade_changeLife', 'arcade_setSpriteProperty', 'arrays_valueBinary', 'arcade_spriteProperty',
            'arcade_getLocal', 'arcade_whenRegisteredOverlap', 'arcade_destroySprite', 'arcade_eventSprite',
            'arcade_changescore']) {
            assert.ok(ops.has(op), op);
        }
    });
});

// Native VM menus with acceptReporters=false serialize fields. Menus that
// accept reporters serialize inputs, including their native menu shadow.
describe('native Arcade and Arrays menu schemas', () => {
    const cases = [
        ['reporter', 'arrays_specialValue', 'KIND', ['undefined', 'null'], v => `${v} value`],
        ['reporter', 'arrays_valueBinary', 'OP', ['+', '-', '*', '/', '%'], v => `calculate value 7 op "${v}" with 6`],
        ['reporter', 'arrays_valueUnary', 'OP', ['+', '-'], v => `convert value 5 op "${v}"`],
        ['boolean', 'arrays_valueCompare', 'OP', ['==', '!=', '===', '!==', '<', '>', '<=', '>='], v => `compare value 7 op "${v}" with 6`]
    ];
    for (const [kind, opcode, slot, choices, line] of cases) {
        for (const choice of choices) test(`${opcode} native ${choice} and legacy literal survive round trip`, () => {
            const {first} = fixedPoint(program(kind, line(choice)));
            for (const b of first.blocks.filter(b => b.opcode === opcode)) {
                assert.equal(b.fields[slot][0], choice);
                assert.equal(b.inputs[slot], undefined, 'direct menu must not create an input the GUI discards');
                // Simulate a menu edit in the visible workspace.
                b.fields[slot][0] = choices.at(-1);
            }
            const edited = first.c.decompile();
            assert.ok(edited.includes(line(choices.at(-1))));
            const reread = compile(edited);
            assert.deepEqual(reread.c.warnings, []);
            for (const b of reread.blocks.filter(b => b.opcode === opcode)) assert.equal(b.fields[slot][0], choices.at(-1));
            // Older saved producer output must migrate to the corrected schema.
            for (const b of first.blocks.filter(b => b.opcode === opcode)) {
                delete b.fields[slot];
                b.inputs[slot] = [1, [10, choice]];
            }
            const migrated = compile(first.c.decompile());
            assert.deepEqual(migrated.c.warnings, []);
            for (const b of migrated.blocks.filter(b => b.opcode === opcode)) {
                assert.equal(b.fields[slot][0], choice);
                assert.equal(b.inputs[slot], undefined);
            }
        });
        test(`${opcode} native field wins over obsolete input`, () => {
            const {c, blocks} = compile(program(kind, line(choices[0])));
            for (const b of blocks.filter(b => b.opcode === opcode)) b.inputs[slot] = [1, [10, choices.at(-1)]];
            assert.ok(c.decompile().includes(line(choices[0])));
        });
    }
    for (const axis of ['x', 'y']) test(`controller ${axis} literal, native menu and legacy field round trip`, () => {
        const line = `arcade controller ${axis} step 10`;
        const {first} = fixedPoint(program('reporter', line));
        const target = first.c.project.targets.find(t => Object.values(t.blocks).some(b => b.opcode === 'arcade_controllerStep'));
        const b = Object.values(target.blocks).find(b => b.opcode === 'arcade_controllerStep');
        const producedMenu = target.blocks[b.inputs.AXIS[1]];
        assert.equal(producedMenu.opcode, 'arcade_menu_axes');
        assert.deepEqual(producedMenu.fields.axes, [axis, null]);
        assert.equal(producedMenu.shadow, true);
        assert.equal(b.fields.AXIS, undefined);
        target.blocks.nativeAxis = {opcode: 'arcade_menu_axes', fields: {axes: [axis, null]}, inputs: {}, shadow: true, parent: null, next: null};
        b.inputs.AXIS = [1, 'nativeAxis'];
        assert.ok(first.c.decompile().includes(line), 'read the actual native menu field without quoted expression wrappers');
        assert.deepEqual(compile(first.c.decompile()).c.warnings, []);
        delete b.inputs.AXIS;
        b.fields.AXIS = [axis, null];
        assert.ok(first.c.decompile().includes(line), 'read legacy axis field');
    });
    test('operators cannot be arbitrary reporter inputs masquerading as dropdown fields', () => {
        for (const line of ['calculate value 7 op hero with 6', 'convert value 5 op hero', 'compare value 7 op "bogus" with 6']) {
            const {blocks} = compile(program('reporter', line));
            assert.equal(blocks.filter(b => /^arrays_value(Binary|Unary|Compare)$/.test(b.opcode)).length, 0);
        }
    });
});


test('native menu edits persist through the actual SB3 archive and Code reconstruction', async () => {
    const {c, blocks} = compile(`${HEADER}WHEN flag clicked:
  set v to calculate value 7 op "*" with 6
  set v to null value
  set v to convert value 5 op "-"
  IF compare value 7 op ">=" with 6 THEN:
    hide
  set v to arcade controller y step 10
`);
    assert.deepEqual(c.warnings, []);
    const binary = blocks.find(b => b.opcode === 'arrays_valueBinary');
    binary.fields.OP[0] = '%';
    const blob = await c.generateSB3();
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const project = JSON.parse(await zip.file('project.json').async('string'));
    const loaded = new SB3Creator();
    loaded.project = project;
    const code = loaded.decompile();
    for (const word of ['op "%"', 'null value', 'op "-"', 'op ">="', 'arcade controller y step 10']) assert.ok(code.includes(word), word);
    const reconstructed = compile(code);
    assert.deepEqual(reconstructed.c.warnings, []);
    assert.equal(reconstructed.blocks.find(b => b.opcode === 'arrays_valueBinary').fields.OP[0], '%');
});


test('preload migration protects legacy blocks before native workspace ingestion', () => {
    for (const [opcode, slot, value] of [
        ['arrays_specialValue', 'KIND', 'null'], ['arrays_valueBinary', 'OP', '*'],
        ['arrays_valueUnary', 'OP', '-'], ['arrays_valueCompare', 'OP', '>=']
    ]) {
        const block = {opcode, inputs: {[slot]: [1, [10, value]], KEEP: [1, [4, '7']]}, fields: {KEEP: ['untouched', null]}};
        assert.equal(normalizeArcadeBlockSchema(block), true);
        assert.deepEqual(block.fields[slot], [value, null]);
        assert.equal(block.inputs[slot], undefined);
        assert.deepEqual(block.inputs.KEEP, [1, [4, '7']]);
        assert.equal(normalizeArcadeBlockSchema(block), false, 'idempotent');
        block.inputs[slot] = [1, [10, 'obsolete']];
        assert.equal(normalizeArcadeBlockSchema(block), true);
        assert.equal(block.fields[slot][0], value, 'native choice wins');
        const unsupported = {opcode, inputs: {[slot]: [3, 'dynamicReporter', [10, value]]}, fields: {}};
        const before = structuredClone(unsupported);
        assert.equal(normalizeArcadeBlockSchema(unsupported), false);
        assert.deepEqual(unsupported, before, 'do not invent a literal for a reporter');
        const invalid = {opcode, inputs: {[slot]: [1, [10, 'bogus']]}, fields: {}};
        assert.equal(normalizeArcadeBlockSchema(invalid), false);
    }
    const axis = {opcode: 'arcade_controllerStep', inputs: {}, fields: {AXIS: ['y', null]}};
    assert.equal(normalizeArcadeBlockSchema(axis), true);
    assert.deepEqual(axis.inputs.AXIS, [1, [10, 'y']]);
    assert.equal(axis.fields.AXIS, undefined);
    assert.equal(normalizeArcadeBlockSchema(axis), false);
    axis.fields.AXIS = ['x', null];
    assert.equal(normalizeArcadeBlockSchema(axis), true);
    assert.deepEqual(axis.inputs.AXIS, [1, [10, 'y']], 'native axis wins');
    assert.equal(normalizeArcadeBlockSchema({opcode: 'unrelated', inputs: {}, fields: {}}), false);
});

test('controller reporter-menu slots preserve variables, nested reporters and quoted axis literals', () => {
    for (const expression of ['(hero)', '(axis)', '(x)', '(y)', '(n + 1)', '"Y"', '(arcade local axis)', '(v)']) {
        const {first, d1} = fixedPoint(program('reporter', `arcade controller ${expression} step 90`)
            .replace('GLOBAL hero\n', 'GLOBAL hero\nGLOBAL axis\nGLOBAL x\nGLOBAL y\n'));
        assert.deepEqual(first.c.warnings, []);
        const target = first.c.project.targets.find(t => Object.values(t.blocks).some(b => b.opcode === 'arcade_controllerStep'));
        const controller = Object.values(target.blocks).find(b => b.opcode === 'arcade_controllerStep');
        const input = controller.inputs.AXIS;
        if (typeof input[1] === 'string') {
            assert.equal(input[0], 3);
            assert.equal(target.blocks[input[2]].opcode, 'arcade_menu_axes', 'native dropdown remains available behind connected reporter');
            assert.notEqual(target.blocks[input[1]].opcode, 'arcade_menu_axes', 'expression is a connected reporter, not literal menu text');
        } else {
            assert.ok([10, 12].includes(input[1][0]), 'literal or variable keeps its native primitive type');
        }
        assert.ok(d1.includes(expression), `preserve expression ${expression}: ${d1}`);
    }
});


test('animation resources preserve UUID literals and computed IDs with native menu shadows', () => {
    for (const expression of ['"a1b2-resource"', '(resourceId)', 'none']) {
        const creator = new SB3Creator();
        creator.parse(`DEVICE ARCADE\nGLOBAL resourceId = "a1b2-resource"\nGLOBAL frames\nGLOBAL fresh\nGLOBAL interval\nWHEN flag clicked:\n  set frames to (arcade animation frames resource ${expression})\n  set fresh to (arcade animation fresh frames resource ${expression})\n  set interval to (arcade animation interval resource ${expression})\n`);
        assert.deepEqual(creator.warnings, []);
        const blocks = creator.project.targets.flatMap(target => Object.values(target.blocks));
        for (const opcode of ['arcade_animationAssetFrames', 'arcade_animationAssetFreshFrames', 'arcade_animationAssetInterval']) {
            const block = blocks.find(item => item.opcode === opcode);
            assert.ok(block);
            const input = block.inputs.RESOURCE;
            assert.ok(input);
            if (expression !== '(resourceId)') {
                const target = creator.project.targets.find(target => target.blocks[input[1]]);
                assert.equal(target.blocks[input[1]].opcode, 'arcade_menu_animationAssets');
                assert.equal(target.blocks[input[1]].fields.animationAssets[0], expression === 'none' ? 'none' : 'a1b2-resource');
            }
        }
        const code = creator.decompile();
        assert.ok(code.includes('arcade animation frames resource'));
        const second = new SB3Creator(); second.parse(code);
        assert.deepEqual(second.warnings, []);
        assert.equal(second.decompile(), code);
    }
});


test('shared and fresh resource lookups remain distinct through Python and JavaScript', () => {
    for (const expression of ['"resource:walk"', '(resourceId)']) {
        const original = new SB3Creator();
        original.parse(`DEVICE ARCADE\nGLOBAL resourceId = "resource:walk"\nGLOBAL shared\nGLOBAL fresh\nGLOBAL interval\nWHEN flag clicked:\n  set shared to arcade animation frames resource ${expression}\n  set fresh to arcade animation fresh frames resource ${expression}\n  set interval to arcade animation interval resource ${expression}\n`);
        assert.deepEqual(original.warnings, []);
        for (const [language, read] of [['Python', pythonToPseudocode], ['JavaScript', javascriptToPseudocode]]) {
            const generated = language === 'Python' ? original.generatePython() : original.generateJavaScript();
            assert.match(generated, /scratch\.arcade_animation_frames_resource\(/);
            assert.match(generated, /scratch\.arcade_animation_fresh_frames_resource\(/);
            assert.match(generated, /scratch\.arcade_animation_interval_resource\(/);
            const imported = read(generated);
            assert.deepEqual(imported.unsupported || [], [], language);
            const next = new SB3Creator(); next.parse(imported.pseudocode);
            assert.deepEqual(next.warnings, [], language);
            const rows = next.project.targets.flatMap(target => Object.values(target.blocks));
            for (const opcode of ['arcade_animationAssetFrames', 'arcade_animationAssetFreshFrames', 'arcade_animationAssetInterval']) {
                const block = rows.find(row => row.opcode === opcode);
                assert.ok(block, `${language} retains ${opcode}`);
                const input = block.inputs.RESOURCE;
                if (expression.startsWith('"')) {
                    const target = next.project.targets.find(target => target.blocks[input[1]]);
                    const shadow = target.blocks[input[1]];
                    assert.equal(shadow.fields.animationAssets[0], 'resource:walk');
                } else assert.equal(input[0], 3, `${language} retains connected computed resource`);
            }
        }
    }
});

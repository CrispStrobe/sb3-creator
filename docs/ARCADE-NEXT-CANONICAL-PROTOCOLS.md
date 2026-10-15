# Next canonical Arcade protocols

PROPOSED OWNERSHIP, NOT IMPLEMENTED OR QUALIFIED. The Arcade integration owner
claims one coordinated supplier sequence for the following protocols. This
claim adds documentation only. Implementation requires qualified normal merge
of this claim and the relevant consumer ownership contracts. No word, native
operation, default admission, reference kind or dependency pin changes here.

The consumer contracts are collected in
[Brickwright Lite PR954](https://github.com/CrispStrobe/brickwright-lite/pull/954).
Canonical parser/schema/decompiler work belongs in this repository; native
ownership, source/current-project proof, runtime algorithms and authoring UI
belong in Lite. Neither side substitutes for the other's qualification.

## Ordinary procedure parameter constraints

Candidate command opcode: `arcade_declareParameterConstraint`.
Candidate Code spelling:

```text
declare arcade procedure ("show text %s") parameter ("message") as String
```

Expose editable PROCEDURE and PARAMETER selectors and the fixed Number,
Boolean, String or Any TYPE choice. Selectors must remain literal, resolve to
one actual containing DEFINE/prototype and its ordered formal IDs, and agree
with the visible native block schema. Coordinate native menu shadows, stored
fields/inputs and Code spelling against that real prototype before freezing
implementation. Computed selector reporters, opaque JSON and supplied IDs do
not establish a binding. The declaration belongs in the first contiguous
constraint section of the actual DEFINE body; it cannot target another body.

The producer preserves the record and actual formal association, including
renames/reorders or an explicit stale-binding refusal. It does not execute a
parameter reset, manufacture a caller or mark a value as String. Duplicate,
missing, foreign or ambiguous bindings must remain diagnosable. Declaration
types are obligations; actual writers and every caller independently discharge
them, including unused parameters. Existing erased annotations are not restored
from hidden retained source. Optional/default/rest and reference/callable
constraints remain outside this first protocol.

## Throw command

Candidate command opcode: `arcade_throwValue`; Code: `arcade throw {VALUE}`.
Use one ordinary connected VALUE expression input. Preserve physical Number,
String, Boolean, Null and Undefined and evaluate the operand once. Do not add
an implicit String cast, returned Undefined, extra result socket, opaque guest
code or message-only substitute. Primitive validity and actual source/current
producer proofs belong to the consumer.

The consumer must implement actual exceptional completion through stock and
managed frames, pending calls, callbacks and construction. Existing generic
promise rejection behavior or a diagnostic event alone is insufficient. Keep
unrelated fibers running unless independently measured semantics require
otherwise. Standalone selected-runtime observations do not qualify the full
MakeCode parent-driver UI or native exceptional handoff. Try/catch/finally
remain explicit refusals until their separate complete protocol is qualified.

## Owned Image-to-Sprite allocation

Candidate reporter opcode: `arcade_createOwnedImageSprite`.
Candidate spelling:

```text
arcade create owned image {IMAGE} template {TEMPLATE} kind {KIND}
```

Mirror the actual existing Image/TEMPLATE/KIND allocation surface only after a
native prototype proves it. IMAGE is a real owned Image, KIND an actual Number,
and TEMPLATE an inert current resource selector with its independent resource
proof. No raw Sprite ID-to-capability conversion is included. Source factories
must prove their unshadowed binding and ordered arguments. Dropped transport
selectors must not erase evaluated effects during export.

The consumer privately captures the actual allocated body, scene and epoch
before creation handlers, and issues its owned result only after actual
synchronous or suspended creation completion. Destroyed/replaced/foreign bodies
cannot acquire a result from a later String lookup. Preserve legacy raw String
returns from existing factory words and existing creation-handler semantics.

A registered existing object-reference carrier is a transport candidate, not a
capability grant. Prove its private owner/body and complete raw ingress before
codec normalization, all aliases/fields/captures/arguments/results, current
producer graph and scene/session lifetime. Equal valid scoped tuples may be
aliases; tuple equality alone cannot establish an issued live physical body.
No new Arrays kind or pin is assumed necessary. If the actual prototype needs
a supplier schema, add its exact separately reviewed scope before shipping;
retain explicit refusal meanwhile. Image transport is a precedent to audit,
not Sprite authority or permission to widen adjacent SDK types.

## Ownership, controls and adoption

Own the Arcade word table, scoped actual binding/materialization helpers,
reversible parser/decompiler and the generators/readers genuinely affected by
these words, native schema metadata and focused tests. Preserve existing words,
ordinary procedure calls, variable/procedure seals, legacy Sprite outputs and
all unrelated device/generator lanes. Do not change sibling test pins, CI
budgets or unrelated vocabulary. Coordinate shared helper edits explicitly.

Qualify actual connected reporter inputs, physical Number20 versus String20,
field/menu edits, renamed/reordered procedure formals, duplicate/stale/foreign
bindings, nested effects and source-to-Code-to-SB3-to-Code permutations. Read
saved current project blocks rather than restoring source text. Native and
visible user controls must use the same actual schema; a word-table census or
neutral generated runtime shim alone is not execution evidence. Missing
unsupported generator/runtime routes must report an explicit refusal.

Freeze the actual supplier source and obtain independent review. Require every
enabled exact-head check before normal matched-head merge. Coordinate one
canonical implementation sequence and one deliberate consumer adoption after
reviewing the full intervening range. Lite uses its existing exact-pin authority,
map-derived transformations, both required mirrors and all affected identity,
provenance and census checks. Consumer native/portable/current-edit, genuinely
new selected-original and visible GUI qualification remain separate gates.
No complete library, game or corpus count promotion follows from these words.

# Arcade source typeof reporter

`arcade source type of (value)` creates one `arcade_sourceTypeOf` reporter with
an editable, connected `VALUE` input. Its runtime result is a String. Code and
SB3 reconstruction preserve the connected expression rather than a fixed menu
or cached result.

This supplier adds the authoring grammar. Runtime and source export qualification
belong to the consuming Arcade implementation. The initial consumer contract
covers primitives and current owned Array, managed class, Image and Buffer
values. Missing, foreign, stale or disposed ownership must produce a named
refusal. An input is evaluated once.

Native Sprite handles currently share a string representation. Literal text
that happens to match a handle remains text. Sprite source operands require
an explicit refusal until a qualified carrier preserves their original type.
Callable source typing requires separately qualified representation metadata;
this word does not admit callable creation, invocation or registration words.

Controls cover literal and computed inputs, visible input edits in the block
model, Code reconstruction and fresh SB3 reconstruction. The explicit dialect
inventory adds one operation and one spelling while retaining the qualified
CALL grammar, controller repeat and font metric words.

# Explicit Arcade source loops

The Arcade dialect has a distinct loop block for imported MakeCode source:

```text
arcade repeat while (count < 5):
  change count by 1
  arcade set background color to count
```

The block opcode is `arcade_sourceWhile`. Its connected Boolean `CONDITION`
input is positive: enter `SUBSTACK` while the condition is true. Evaluate the
condition once on each iteration. The body has a parent connection to the loop;
the statement after the loop uses its ordinary `next` connection. Nested source
loops and ordinary Scratch controls retain their separate opcodes in fresh SB3.
Canonical Code retains the header and indented body. No comment, hidden mutation
or project flag assigns source loop semantics.

## Consumer contract

A native consumer must expose this as a loop with one Boolean input and a body.
It must execute the real condition reporters and body, preserving procedure
locals, callback waits, side effects and Stop/disposal behavior. An Arcade phase
driver may continue this explicit source loop before the next physical frame;
ordinary Scratch repeat, repeat-until and forever blocks keep their own scheduling.
A graphics command alone is not an authored source yield. An authored future
pause or pending asynchronous result still suspends the owning source.

MakeCode translation should emit this loop for supported `while` and existing
finite `for` lowering, with initialization and increment at their original
positions. MakeCode export should emit `while (condition) { body }`; reimport
must restore the explicit source loop. Original `game.forever` handlers remain
separate and retain their SDK scheduling. This block does not add break,
continue or do-while support. Unsupported statements must retain diagnostics.

The producer qualifies parsing, canonical Code and fresh archive structure.
The consumer must separately qualify native execution, Blocks XML, MakeCode
export/reimport, shared scheduling budgets, scenes, debugger controls and the
installed GUI. Producer structural tests do not establish frame timing or
whole-game compatibility.

## Explicit source entry

`WHEN arcade source starts:` is the `arcade_whenSourceStarts` hat. Queue it on
actual project start after runtime reset. Derive source scheduling authority
from this hat and owned native callback dispatch; inherit the actual caller and
run generation through managed function calls. Do not infer it from a project
flag or an ordinary flag script containing an Arcade command.

Imported main and generated setup/art entry scripts should use the source hat,
so their source initialization can finish before frame zero. Ordinary
`WHEN flag clicked:` remains in the normal kernel. A source loop entered by an
ordinary thread grants only its body the explicit loop semantics; it must not
promote the whole ordinary flag script. Consumer checks must compare mixed
initial-frame observations to the predecessor, and cover project restart,
Stop/disposal, budgets, callback ownership and generated-template hiding.

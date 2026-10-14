# Calling custom procedures in Code

Use the reserved `CALL:` form to select a custom procedure even when its label
is also a built-in command. Put the complete invocation in parentheses:

```text
DEFINE show:
  say "custom show"
DEFINE call (name):
  say name
DEFINE choose <ready>:
  IF ready THEN:
    say "ready"
WHEN flag clicked:
  show
  CALL: (show)
  CALL: (call ("argument"))
  CALL: (choose (<1 < 2>))
```

Value arguments use `(value)`. Boolean arguments use `(<condition>)`, matching
the Boolean slots in the definition. These markers preserve the actual
signature when two procedures share their literal words but have different
argument types. Fixed literal labels take precedence over unmarked argument
positions. Every value argument in `CALL:` must be grouped, including a value
that looks like a label word.

Decompiled Code uses this form. Saved Scratch blocks keep the actual procedure
label, argument types and warp flag. Other language generators keep their syntax.
Ordinary registered legacy calls, including `call numbers` and `call (value)`,
remain readable. The earlier unmarked `CALL show` form remains readable when
it does not match a complete registered legacy label. `CALL:` is reserved Code
syntax; a procedure with that spelling can be invoked through an outer explicit
call, as `CALL: (CALL: ("argument"))`.

Unknown procedures, wrong argument types, malformed parentheses or quotes,
empty Boolean conditions and trailing tokens are errors. This grammar change
adds no Arcade runtime opcode and makes no original runtime or GUI claim.

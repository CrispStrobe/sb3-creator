# Generic Python conversion refusals

The generic `pythonToPseudocode(source)` entrypoint converts the existing
algorithmic Python subset to pseudocode for reconstruction as blocks. Executing
Python and converting it to blocks are separate capabilities. Valid executable
Python may be outside this converter's supported semantics.

## Bounded integrity repair, 27 November 2026

The runtime evaluation found these operations were silently accepted with
changed meaning. They are now refused before any pseudocode is returned:

| Python operation | Previously emitted behavior | Current conversion |
| --- | --- | --- |
| Floor division `//` | Ordinary division `/` | Unsupported |
| `*=`, `/=`, `%=` | Addition via `change ... by ...` | Unsupported |
| `break`, `continue` | Statement omitted | Unsupported |

This is a diagnostic boundary, not a new Python arithmetic or loop-control
implementation. No literal-only or inferred-numeric exception is introduced.
In particular, replacing `//` with a floor of ordinary division would not by
itself qualify Python's operand types, precision, division errors and evaluation
behavior. A future exact lowering needs its own behavioral evidence.

The ordinary `+=` and `-=` conversion stays unchanged. The JavaScript reader,
SPIKE 3 reader and board-specific MicroPython route keep their existing separate
contracts; the shared translator is not redefined for those callers. This repair
does not claim that every other Python construct has exact conversion semantics.

## Diagnostic contract

The generic entrypoint throws a `PythonConversionError` with:

- `code: 'PYTHON_CONVERSION_UNSUPPORTED'` and `isPyConversionError: true`;
- `diagnostics`: each refusal's stable `code`, `kind: 'unsupported'`,
  `severity: 'error'`, concrete `message` and `sourceSpan`;
- `sourceSpan`: the first diagnostic's statement span, for simple consumers.

Diagnostic codes are `python-floor-division`, `python-augmented-assignment`,
`python-break` and `python-continue`. Spans have `start` and `end` objects with
one-based `line` and `column`; the end is exclusive. They identify the containing
statement, including all lines of a continued expression. Nested loop-control
statements have their own spans. CRLF input uses the same line/column convention.

The error message includes locations and explains that the Python source can
still be retained for execution. Consumers must retain the authored source and
current project when conversion fails. There is no partial replacement to apply.
The guard inspects the parsed generic program; operator text inside strings or
comments does not trigger a refusal.

## Validation

Run with installed locked dependencies and Python 3:

```sh
node --test test/python-conversion-semantics.test.mjs test/roundtrip.test.mjs test/codegen.test.mjs test/javascript-owned-console.test.mjs
```

The new controls execute the original evaluation witnesses in CPython, require
an explicit conversion refusal and retain an existing project. Further cases
cover nested loops, side-effecting operands and mutation targets, multiline and
f-string locations, comments, and normal numeric `+=`/`-=` behavior through the
actual compiler and JavaScript emitter. A negative control bypasses only the
new guard and demonstrates that every original silent-loss witness fails the
required refusal assertion. These checks qualify conversion integrity for this
bounded repair, not a new interpreter, complete Python equivalence or device
execution.

The local checkpoint passes **217/217** focused controls, including **16** new
conversion-integrity cases, with no skips. The independent reader/comment suite
(`comments.test.mjs`, `spike3-python.test.mjs`, `micropython.test.mjs` and
`reader-bitwise-shift.test.mjs`) passes **177/177**, also with no skips. Reader
ESLint and whitespace checks pass. These measurements used Node 24.22.3, Python 3
and locked dependencies; the package manifest requests Node 26, so this local
checkpoint does not replace hosted qualification.

Coordination: [owned console Code-tab integration and source identity](https://github.com/CrispStrobe/brickwright/blob/d84662f899a6d84372703b5967291e998421145f/lanes/2026-11-27-owned-console-code-tab-integration.md).
Consumer adoption follows the existing qualified upstream and exact-pin protocol.

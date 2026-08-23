# 6502-terminal — expected behaviour

A serial terminal faceplate: a `keyboard` widget writes single characters into
`serial_in`, and a `terminal` widget renders `serial_out`. The program echoes
each character, accumulates a line buffer, and processes the line on newline.

Values below were produced by executing the program's control flow, not read
off the source.

```assert
widgets: terminal(serial_out), keyboard(serial_in)
on_start: "6502 Terminal Ready\n> "
echo: every typed character appears in serial_out, repeats included
line_hello: "hello" + Enter  -> "Hello, world!\n" then "> "
line_help:  "help"  + Enter  -> "Commands: hello, help, clear\n" then "> "
line_clear: "clear" + Enter  -> serial_out == "> "   (exactly one prompt)
after_any_line: serial_out ends with "> "
```

## Two defects this example carried, and what they looked like

**A write/read split.** `set variable line to ""` and `set variable lastChar
to ""` assign variables *named* "variable line" and "variable lastChar", while
every read says `line` and `lastChar`. The gallery's write/read detector
catches this; `bw check` does not, because it is valid syntax.

**A change detector that swallowed repeated keys.** The loop guarded on
`serial_in != lastChar`, so typing a doubled letter was skipped entirely:
"hello" arrived as "helo" and no command ever matched. Consuming `serial_in`
(setting it back to `""`) is the correct and sufficient detector, so the
`lastChar` variable is gone.

**A doubled prompt.** `clear` set `serial_out` to `"> "` and then fell into the
shared reset which appends `"> "`, giving `"> > "`. `clear` now empties the
buffer and lets the shared reset supply the single prompt.

Only the first was visible without running the program.

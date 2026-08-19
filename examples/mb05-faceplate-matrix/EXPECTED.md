# Expected behaviour

- Load the example, open the Controller view: a 5×5 matrix widget
  (`scr`, bound to `screen`) and two round buttons (`a`→`btnA`,
  `b`→`btnB`) are present in play mode.
- Green flag: the matrix shows exactly one lit dot (corner — `screen`=1).
- Hold A: an X appears (9 dots, `screen`=18157905). Release: back to one.
- Hold B: the middle row lights (5 dots, `screen`=31744).
- The loop is live: widget → variable → running program → variable →
  matrix face, all in the browser.

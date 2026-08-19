---
level: beginner
age: 8+
prereqs: []
teaches: [variables, conditionals, controller-panel, matrix-widget, dpad-widget, bitmask]
---

## Retro Console (Dual Matrix)

A tiny retro game console built entirely on the controller panel — two
4x4 dot matrices, a D-pad, and two buttons.

The left matrix is the game screen: a player dot you move with the D-pad.
The right matrix is the status display: a bar showing your lives.
Press FIRE to leave a trail on the game screen. Press START to reset.

## Try this

1. Click the green flag.
2. Use the D-pad to move the dot around the 4x4 game grid.
3. Press FIRE to mark cells — build a pattern!
4. Press START to clear everything and start over.
5. Watch the status display: the top row shows your remaining lives.

## What is going on

Both matrices read from separate variables (`game_screen` and `status_screen`).
Each variable is a 16-bit bitmask — bit `row*4+col` controls one dot. The
program recomputes both bitmasks every tick based on the player position, the
trail, and the lives counter. The D-pad writes its direction bitmask (up=1,
down=2, left=4, right=8) to the `dpad` variable; the program reads it and
moves the player.

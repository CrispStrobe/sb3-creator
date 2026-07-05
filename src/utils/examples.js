// Comprehensive test examples covering all supported commands
const examples = {
    motion: `SPRITE Motion_Test:
  WHEN flag clicked:
    go to x: 0 y: 0
    say "Testing Motion Commands" for 2 seconds
    
    move 50 steps
    turn right 90 degrees
    turn left 45 degrees
    
    change x by 20
    change y by -10
    set x to 100
    set y to 50
    
    point in direction 90
    wait 1 seconds
    say "Motion test complete!"`,

    looks: `SPRITE Looks_Test:
  COSTUME costume2
  WHEN flag clicked:
    say "Testing Looks Commands" for 2 seconds
    think "I'm thinking..." for 1 seconds
    
    show
    wait 1 seconds
    hide
    wait 1 seconds
    show
    
    set size to 150
    wait 1 seconds
    change size by -50
    
    next costume
    switch costume to "costume2"
    say "Looks test complete!"`,

    sound: `SPRITE Sound_Test:
  WHEN flag clicked:
    say "Testing Sound Commands" for 2 seconds
    
    play sound "Meow"
    wait 2 seconds
    play sound "Pop" until done
    
    set volume to 50
    change volume by 25
    
    stop all sounds
    say "Sound test complete!"`,

    pen: `SPRITE Pen_Test:
  WHEN flag clicked:
    say "Testing Pen Commands" for 2 seconds
    clear
    
    pen down
    set pen color to #ff0000
    set pen size to 5
    
    REPEAT 4:
      move 100 steps
      turn right 90 degrees
    
    change pen size by 2
    set pen color to #00ff00
    
    REPEAT 3:
      move 80 steps
      turn right 120 degrees
    
    pen up
    say "Pen test complete!"`,

    sensing: `SPRITE Sensing_Test:
  WHEN flag clicked:
    say "Testing Sensing Commands" for 2 seconds
    
    ask "What is your name?" and wait
    say answer for 2 seconds
    
    ask "What is 5 + 3?" and wait
    IF answer = 8 THEN:
      say "Correct!" for 2 seconds
    ELSE:
      say "Try again!" for 2 seconds
    
    reset timer
    say "Move your mouse around" for 3 seconds
    say mouse x for 1 seconds
    say mouse y for 1 seconds
    
    say timer for 1 seconds
    say "Sensing test complete!"`,

    control: `SPRITE Control_Test:
  WHEN flag clicked:
    say "Testing Control Commands" for 2 seconds
    set counter to 0
    
    REPEAT 5:
      change counter by 1
      say counter for 0.5 seconds
    
    IF counter = 5 THEN:
      say "Counter reached 5!" for 2 seconds
    ELSE:
      say "Something went wrong!" for 2 seconds
    
    FOREVER:
      IF counter > 10 THEN:
        say "Stopping forever loop" for 2 seconds
        stop all
      ELSE:
        change counter by 1
        wait 0.5 seconds`,

    operators: `SPRITE Operator_Test:
  WHEN flag clicked:
    say "Testing Operators" for 2 seconds
    
    set num1 to 10
    set num2 to 5
    
    set result to num1 + num2
    say result for 1 seconds
    
    set result to num1 - num2  
    say result for 1 seconds
    
    set result to num1 * num2
    say result for 1 seconds
    
    set result to num1 / num2
    say result for 1 seconds
    
    IF num1 > num2 THEN:
      say "10 is greater than 5" for 2 seconds
    
    IF num1 = 10 THEN:
      say "num1 equals 10" for 2 seconds
    
    say "Operator test complete!"`,

    game: `SPRITE Player:
  WHEN flag clicked:
    go to x: 0 y: -150
    set health to 100
    set score to 0
    set game active to true
    show
    say "Game Started!" for 2 seconds
    
  WHEN left arrow key pressed:
    IF game active = true THEN:
      change x by -20
      IF x < -240 THEN:
        set x to -240

  WHEN right arrow key pressed:
    IF game active = true THEN:
      change x by 20
      IF x > 240 THEN:
        set x to 240

SPRITE Enemy:
  WHEN flag clicked:
    go to x: 0 y: 180
    set speed to 3
    show
    
  WHEN flag clicked:
    FOREVER:
      IF game active = true THEN:
        change y by speed * -1
        IF y < -170 THEN:
          go to x: 0 y: 180
          change score by 1
          change speed by 0.2
        IF touching Player THEN:
          change health by -10
          go to x: 0 y: 180
          say "Hit!" for 1 seconds

STAGE:
  WHEN flag clicked:
    FOREVER:
      IF health < 1 THEN:
        set game active to false
        ask "Game Over! Play again? (yes/no)" and wait
        IF answer = "yes" THEN:
          broadcast "restart"
        ELSE:
          stop all
      ELSE:
        wait 0.1 seconds`,

    art: `SPRITE Pen:
  WHEN flag clicked:
    hide
    clear
    go to x: 0 y: 0
    pen down
    set pen size to 3
    set pen color to #4c97ff

  WHEN space key pressed:
    REPEAT 72:
      change pen color by 4
      move 150 steps
      turn left 175 degrees

  WHEN c key pressed:
    clear`,

    physics: `SPRITE Ball:
  WHEN flag clicked:
    go to x: 0 y: 150
    set ball_y to 150
    set velocity to 0
    set gravity to -1
    set ground to -140
    show
    
  WHEN flag clicked:
    FOREVER:
      change velocity by gravity
      change ball_y by velocity
      set y to ball_y
      
      IF ball_y < ground THEN:
        set ball_y to ground
        set velocity to velocity * -0.8
        IF velocity > -2 THEN:
          set velocity to 0`,

    educational: `SPRITE Teacher:
  WHEN flag clicked:
    set score to 0
    say "Welcome to the Math Quiz!" for 2 seconds
    
    set num1 to 5
    set num2 to 7
    ask "What is 5 + 7?" and wait
    IF answer = 12 THEN:
      say "Correct!" for 1 seconds
      change score by 1
    ELSE:
      say "Wrong! The answer was 12." for 2 seconds

    set num1 to 8
    set num2 to 4
    ask "What is 8 * 4?" and wait
    IF answer = 32 THEN:
      say "Correct!" for 1 seconds
      change score by 1
    ELSE:
      say "Wrong! The answer was 32." for 2 seconds

    say "Your final score is" for 2 seconds
    say score for 3 seconds
    stop all`,

    snake: `# Simple Snake — arrow keys steer, eat the apple, don't hit the walls.
SPRITE Snake:
  SHAPE square 20
  WHEN flag clicked:
    set score to 0
    set px to 0
    set py to 0
    set dx to 20
    set dy to 0
    go to x: px y: py
    show

  WHEN up arrow key pressed:
    set dx to 0
    set dy to 20
  WHEN down arrow key pressed:
    set dx to 0
    set dy to -20
  WHEN left arrow key pressed:
    set dx to -20
    set dy to 0
  WHEN right arrow key pressed:
    set dx to 20
    set dy to 0

  WHEN flag clicked:
    FOREVER:
      change px by dx
      change py by dy
      go to x: px y: py
      IF px > 220 or px < -220 or py > 160 or py < -160 THEN:
        say "Game Over!" for 2 seconds
        stop all
      wait 0.1 seconds

SPRITE Apple:
  SHAPE circle 18
  WHEN flag clicked:
    set foodx to (pick random -10 to 10) * 20
    set foody to (pick random -7 to 7) * 20
    go to x: foodx y: foody
    show

  WHEN flag clicked:
    FOREVER:
      IF touching Snake THEN:
        change score by 1
        set foodx to (pick random -10 to 10) * 20
        set foody to (pick random -7 to 7) * 20
        go to x: foodx y: foody
        wait 0.3 seconds`,

    snake_pro: `# Growing-tail Snake — showcases clones, compound conditions, REPEAT UNTIL, and
# explicit GLOBAL scoping. The body is a trail of Body clones, each living for
# 'length' steps, so the tail grows by 2 every time the apple is eaten.
GLOBAL score
GLOBAL length
GLOBAL alive
GLOBAL hx
GLOBAL hy

SPRITE Head:
  SHAPE square 18
  WHEN flag clicked:
    show variable score
    set score to 0
    set length to 4
    set alive to 1
    set hx to 0
    set hy to 0
    set dx to 20
    set dy to 0
    go to x: hx y: hy
    show

  WHEN up arrow key pressed:
    IF not dy < 0 THEN:
      set dx to 0
      set dy to 20
  WHEN down arrow key pressed:
    IF not dy > 0 THEN:
      set dx to 0
      set dy to -20
  WHEN left arrow key pressed:
    IF not dx > 0 THEN:
      set dx to -20
      set dy to 0
  WHEN right arrow key pressed:
    IF not dx < 0 THEN:
      set dx to 20
      set dy to 0

  WHEN flag clicked:
    FOREVER:
      IF alive = 1 THEN:
        broadcast "grow" and wait
        change hx by dx
        change hy by dy
        go to x: hx y: hy
        IF touching Body THEN:
          set alive to 0
          say "Game Over!" for 2 seconds
          stop all
        IF hx > 220 or hx < -220 or hy > 160 or hy < -160 THEN:
          set alive to 0
          say "Game Over!" for 2 seconds
          stop all
      wait 0.15 seconds

SPRITE Body:
  SHAPE square 18
  WHEN flag clicked:
    set role to 0
    hide

  # Only the original (role 0) spawns a trail clone per step. Clones set role 1
  # in their start script so they never spawn more — otherwise every clone would
  # also react to "grow" and the tail would multiply exponentially.
  WHEN I receive "grow":
    IF role = 0 THEN:
      go to x: hx y: hy
      create clone of myself

  WHEN I start as a clone:
    set role to 1
    show
    set life to length
    REPEAT UNTIL life < 1:
      change life by -1
      wait 0.15 seconds
    delete this clone

SPRITE Apple:
  SHAPE circle 16
  WHEN flag clicked:
    set ax to 100
    set ay to 60
    go to x: ax y: ay
    show

  WHEN flag clicked:
    FOREVER:
      IF touching Head THEN:
        change score by 1
        change length by 2
        change ax by 70
        IF ax > 200 THEN:
          set ax to -200
        change ay by 50
        IF ay > 150 THEN:
          set ay to -150
        go to x: ax y: ay
        wait 0.2 seconds`,

    breakout: `# Breakout — mouse-controlled paddle, bouncing ball, a wall of brick clones.
SPRITE Paddle:
  SHAPE rect 70 14
  WHEN flag clicked:
    set score to 0
    set lives to 3
    show
  WHEN flag clicked:
    FOREVER:
      go to x: mouse x y: -160

SPRITE Ball:
  SHAPE circle 16
  WHEN flag clicked:
    set bx to 0
    set by to -120
    set vx to 7
    set vy to 9
    go to x: bx y: by
    show
  WHEN flag clicked:
    FOREVER:
      change bx by vx
      change by by vy
      go to x: bx y: by
      IF bx > 230 or bx < -230 THEN:
        set vx to vx * -1
      IF by > 170 THEN:
        set vy to vy * -1
      IF touching Paddle THEN:
        set vy to abs of vy
      IF by < -175 THEN:
        change lives by -1
        set bx to 0
        set by to -120
        go to x: bx y: by
        IF lives < 1 THEN:
          say "Game Over" for 2 seconds
          stop all

SPRITE Brick:
  SHAPE rect 42 18
  WHEN flag clicked:
    hide
    set by to 150
    REPEAT 3:
      set bx to -180
      REPEAT 9:
        go to x: bx y: by
        create clone of myself
        change bx by 45
      change by by -30
  WHEN I start as a clone:
    show
  WHEN I start as a clone:
    FOREVER:
      IF touching Ball THEN:
        change score by 1
        delete this clone`,

    bomberman: `# Bomberman — a walled arena with pillars and crates. Arrow keys move on the
# 40px grid (you can't walk through walls or crates); Space drops a bomb that
# blasts after a fuse, destroying crates and the enemy in range.
GLOBAL score
GLOBAL bombx
GLOBAL bomby

SPRITE Player:
  SHAPE circle 28 #4c97ff
  WHEN flag clicked:
    show variable score
    set score to 0
    set px to -160
    set py to 120
    go to x: px y: py
    show

  WHEN up arrow key pressed:
    change py by 40
    go to x: px y: py
    IF touching Wall or touching Crate THEN:
      change py by -40
      go to x: px y: py
  WHEN down arrow key pressed:
    change py by -40
    go to x: px y: py
    IF touching Wall or touching Crate THEN:
      change py by 40
      go to x: px y: py
  WHEN left arrow key pressed:
    change px by -40
    go to x: px y: py
    IF touching Wall or touching Crate THEN:
      change px by 40
      go to x: px y: py
  WHEN right arrow key pressed:
    change px by 40
    go to x: px y: py
    IF touching Wall or touching Crate THEN:
      change px by -40
      go to x: px y: py

  WHEN space key pressed:
    set bombx to px
    set bomby to py
    broadcast "drop"

SPRITE Bomb:
  SHAPE circle 26 #2b2b2b
  COSTUME blast circle 40 #ff7a1a
  WHEN flag clicked:
    set role to 0
    hide
  WHEN I receive "drop":
    IF role = 0 THEN:
      go to x: bombx y: bomby
      create clone of myself
  WHEN I start as a clone:
    set role to 1
    switch costume to costume1
    set size to 100
    show
    wait 1.5 seconds
    switch costume to blast
    set size to 150
    wait 0.5 seconds
    delete this clone

SPRITE Wall:
  SHAPE square 40 #5a6470
  WHEN flag clicked:
    hide
    set wy to 160
    REPEAT 9:
      set wx to -200
      REPEAT 11:
        IF wy = 160 or wy = -160 or wx = -200 or wx = 200 THEN:
          go to x: wx y: wy
          create clone of myself
        change wx by 40
      change wy by -40
    set wy to 80
    REPEAT 3:
      set wx to -120
      REPEAT 4:
        go to x: wx y: wy
        create clone of myself
        change wx by 80
      change wy by -80
  WHEN I start as a clone:
    show

SPRITE Crate:
  SHAPE square 34 #b5793a
  DEFINE make crate (x) (y):
    IF role = 0 THEN:
      go to x: x y: y
      create clone of myself
  WHEN flag clicked:
    set role to 0
    hide
    make crate -160 40
    make crate -80 120
    make crate 0 40
    make crate 80 -40
    make crate 160 40
    make crate -80 -120
    make crate 80 120
    make crate 0 -120
  WHEN I start as a clone:
    set role to 1
    show
    FOREVER:
      IF touching Bomb THEN:
        change score by 1
        delete this clone

SPRITE Enemy:
  SHAPE circle 26 #e63946
  WHEN flag clicked:
    set ex to 160
    set ey to -120
    go to x: ex y: ey
    show
  WHEN flag clicked:
    FOREVER:
      set edir to pick random 1 to 4
      set edx to 0
      set edy to 0
      IF edir = 1 THEN:
        set edx to 40
      IF edir = 2 THEN:
        set edx to -40
      IF edir = 3 THEN:
        set edy to 40
      IF edir = 4 THEN:
        set edy to -40
      change ex by edx
      change ey by edy
      go to x: ex y: ey
      IF touching Wall or touching Crate THEN:
        change ex by (0 - edx)
        change ey by (0 - edy)
        go to x: ex y: ey
      IF touching Bomb THEN:
        change score by 5
        say "got me!" for 1 seconds
        hide
        stop this script
      wait 0.4 seconds`,

    tetris: `# Tetris — all 7 tetrominoes fall into a 10x20 well, rotate with Up, soft-drop
# with Down, move with Left/Right. Full rows clear and score. The well border is
# drawn with the pen; each piece is a stamped square tinted by a colour effect.
# Showcases custom blocks with args, a list-as-2D-grid, and rotation math.
GLOBAL score
GLOBAL ptype
GLOBAL pr
GLOBAL pc
GLOBAL cell
GLOBAL canmove
GLOBAL r
GLOBAL c
GLOBAL j
GLOBAL tmp
GLOBAL cr1
GLOBAL cr2
GLOBAL cr3
GLOBAL cr4
GLOBAL cc1
GLOBAL cc2
GLOBAL cc3
GLOBAL cc4
GLOBAL tr1
GLOBAL tr2
GLOBAL tr3
GLOBAL tr4
GLOBAL tc1
GLOBAL tc2
GLOBAL tc3
GLOBAL tc4

SPRITE Game:
  SHAPE square 100
  LIST board

  DEFINE FAST reset board:
    delete all of board
    set r to 1
    REPEAT 200:
      add 0 to board
      change r by 1

  DEFINE set cell (row) (col) to (v):
    replace item (((row * 10) + col) + 1) of board with v

  DEFINE read cell (row) (col):
    set cell to item (((row * 10) + col) + 1) of board

  # A candidate cell is blocked if it is out of bounds or already filled.
  DEFINE FAST test cell (row) (col):
    IF col < 0 or col > 9 or row < 0 or row > 19 THEN:
      set canmove to 0
    ELSE:
      read cell row col
      IF cell > 0 THEN:
        set canmove to 0

  # Test the 4 candidate cells (tr/tc); leaves canmove = 1 only if all are free.
  DEFINE FAST test place:
    set canmove to 1
    test cell tr1 tc1
    test cell tr2 tc2
    test cell tr3 tc3
    test cell tr4 tc4

  # Try to shift the piece by (dr, dc); commit + redraw only if it fits.
  DEFINE FAST move piece (dr) (dc):
    set tr1 to cr1 + dr
    set tc1 to cc1 + dc
    set tr2 to cr2 + dr
    set tc2 to cc2 + dc
    set tr3 to cr3 + dr
    set tc3 to cc3 + dc
    set tr4 to cr4 + dr
    set tc4 to cc4 + dc
    test place
    IF canmove = 1 THEN:
      set cr1 to tr1
      set cc1 to tc1
      set cr2 to tr2
      set cc2 to tc2
      set cr3 to tr3
      set cc3 to tc3
      set cr4 to tr4
      set cc4 to tc4
      set pr to pr + dr
      set pc to pc + dc
      render

  # Rotate 90 deg clockwise about the pivot (pr, pc). The O piece stays put.
  DEFINE FAST rotate piece:
    IF not (ptype = 2) THEN:
      set tr1 to pr + (cc1 - pc)
      set tc1 to pc - (cr1 - pr)
      set tr2 to pr + (cc2 - pc)
      set tc2 to pc - (cr2 - pr)
      set tr3 to pr + (cc3 - pc)
      set tc3 to pc - (cr3 - pr)
      set tr4 to pr + (cc4 - pc)
      set tc4 to pc - (cr4 - pr)
      test place
      IF canmove = 1 THEN:
        set cr1 to tr1
        set cc1 to tc1
        set cr2 to tr2
        set cc2 to tc2
        set cr3 to tr3
        set cc3 to tc3
        set cr4 to tr4
        set cc4 to tc4
        render

  DEFINE FAST lock piece:
    set cell cr1 cc1 to ptype
    set cell cr2 cc2 to ptype
    set cell cr3 cc3 to ptype
    set cell cr4 cc4 to ptype

  # Spawn a random tetromino near the top-centre with its rotation pivot.
  DEFINE FAST spawn piece:
    set ptype to pick random 1 to 7
    set pr to 1
    set pc to 4
    IF ptype = 1 THEN:
      set cr1 to 1
      set cc1 to 3
      set cr2 to 1
      set cc2 to 4
      set cr3 to 1
      set cc3 to 5
      set cr4 to 1
      set cc4 to 6
    IF ptype = 2 THEN:
      set pr to 0
      set cr1 to 0
      set cc1 to 4
      set cr2 to 0
      set cc2 to 5
      set cr3 to 1
      set cc3 to 4
      set cr4 to 1
      set cc4 to 5
    IF ptype = 3 THEN:
      set cr1 to 0
      set cc1 to 4
      set cr2 to 1
      set cc2 to 3
      set cr3 to 1
      set cc3 to 4
      set cr4 to 1
      set cc4 to 5
    IF ptype = 4 THEN:
      set cr1 to 0
      set cc1 to 4
      set cr2 to 0
      set cc2 to 5
      set cr3 to 1
      set cc3 to 3
      set cr4 to 1
      set cc4 to 4
    IF ptype = 5 THEN:
      set cr1 to 0
      set cc1 to 3
      set cr2 to 0
      set cc2 to 4
      set cr3 to 1
      set cc3 to 4
      set cr4 to 1
      set cc4 to 5
    IF ptype = 6 THEN:
      set cr1 to 0
      set cc1 to 3
      set cr2 to 1
      set cc2 to 3
      set cr3 to 1
      set cc3 to 4
      set cr4 to 1
      set cc4 to 5
    IF ptype = 7 THEN:
      set cr1 to 0
      set cc1 to 5
      set cr2 to 1
      set cc2 to 3
      set cr3 to 1
      set cc3 to 4
      set cr4 to 1
      set cc4 to 5

  # Compact the well downward, discarding full rows and scoring each.
  DEFINE FAST clear full lines:
    set j to 19
    set r to 19
    REPEAT 20:
      set c to 0
      set tmp to 0
      REPEAT 10:
        read cell r c
        IF cell > 0 THEN:
          change tmp by 1
        change c by 1
      IF not (tmp = 10) THEN:
        set c to 0
        REPEAT 10:
          read cell r c
          set cell j c to cell
          change c by 1
        change j by -1
      ELSE:
        change score by 1
      change r by -1
    REPEAT UNTIL j < 0:
      set c to 0
      REPEAT 10:
        set cell j c to 0
        change c by 1
      change j by -1

  DEFINE draw well:
    set pen size to 3
    set pen color to #4488ff
    pen up
    go to x: (-80) y: 170
    pen down
    go to x: 80 y: 170
    go to x: 80 y: (-150)
    go to x: (-80) y: (-150)
    go to x: (-80) y: 170
    pen up

  DEFINE FAST render:
    clear
    draw well
    set r to 0
    REPEAT 20:
      set c to 0
      REPEAT 10:
        read cell r c
        IF cell > 0 THEN:
          set color effect to (cell * 25)
          go to x: ((c * 16) - 72) y: (162 - (r * 16))
          stamp
        change c by 1
      change r by 1
    set color effect to (ptype * 25)
    go to x: ((cc1 * 16) - 72) y: (162 - (cr1 * 16))
    stamp
    go to x: ((cc2 * 16) - 72) y: (162 - (cr2 * 16))
    stamp
    go to x: ((cc3 * 16) - 72) y: (162 - (cr3 * 16))
    stamp
    go to x: ((cc4 * 16) - 72) y: (162 - (cr4 * 16))
    stamp

  WHEN flag clicked:
    set size to 16
    hide
    show variable score
    reset board
    set score to 0
    spawn piece
    render
    FOREVER:
      move piece 1 0
      IF canmove = 0 THEN:
        lock piece
        clear full lines
        spawn piece
        set tr1 to cr1
        set tc1 to cc1
        set tr2 to cr2
        set tc2 to cc2
        set tr3 to cr3
        set tc3 to cc3
        set tr4 to cr4
        set tc4 to cc4
        test place
        IF canmove = 0 THEN:
          say "Game Over" for 2 seconds
          stop all
      render
      wait 0.4 seconds

  WHEN left arrow key pressed:
    move piece 0 (-1)
  WHEN right arrow key pressed:
    move piece 0 1
  WHEN down arrow key pressed:
    move piece 1 0
  WHEN up arrow key pressed:
    rotate piece`,

    pong_2p: `# Pong (2 players) — left paddle W/S, right paddle up/down arrows. First to 5 wins.
GLOBAL scoreL
GLOBAL scoreR
GLOBAL ballx
GLOBAL bally

SPRITE PaddleL:
  SHAPE rect 16 90
  WHEN flag clicked:
    show variable scoreL
    show variable scoreR
    set ly to 0
    go to x: -220 y: ly
    show
  WHEN flag clicked:
    FOREVER:
      IF key w pressed? THEN:
        change ly by 8
      IF key s pressed? THEN:
        change ly by -8
      IF ly > 140 THEN:
        set ly to 140
      IF ly < -140 THEN:
        set ly to -140
      go to x: -220 y: ly

SPRITE PaddleR:
  SHAPE rect 16 90
  WHEN flag clicked:
    set ry to 0
    go to x: 220 y: ry
    show
  WHEN flag clicked:
    FOREVER:
      IF key up arrow pressed? THEN:
        change ry by 8
      IF key down arrow pressed? THEN:
        change ry by -8
      IF ry > 140 THEN:
        set ry to 140
      IF ry < -140 THEN:
        set ry to -140
      go to x: 220 y: ry

SPRITE Ball:
  SHAPE circle 18
  WHEN flag clicked:
    set scoreL to 0
    set scoreR to 0
    set ballx to 0
    set bally to 0
    set vx to 8
    set vy to 5
    go to x: ballx y: bally
    show
  WHEN flag clicked:
    FOREVER:
      change ballx by vx
      change bally by vy
      go to x: ballx y: bally
      IF bally > 165 or bally < -165 THEN:
        set vy to vy * -1
      IF touching PaddleL THEN:
        set vx to abs of vx
      IF touching PaddleR THEN:
        set vx to abs of vx * -1
      IF ballx < -235 THEN:
        change scoreR by 1
        set ballx to 0
        set bally to 0
        go to x: ballx y: bally
      IF ballx > 235 THEN:
        change scoreL by 1
        set ballx to 0
        set bally to 0
        go to x: ballx y: bally
      IF scoreL > 4 or scoreR > 4 THEN:
        say "Game Over" for 2 seconds
        stop all`,

    pong_ai: `# Pong (vs AI) — you are the left paddle (W/S). The right paddle is a computer that
# tracks the ball, reading the ball's position with "y position of Ball" (sensing_of).
GLOBAL scoreL
GLOBAL scoreR

SPRITE PaddleL:
  SHAPE rect 16 90
  WHEN flag clicked:
    show variable scoreL
    show variable scoreR
    set ly to 0
    go to x: -220 y: ly
    show
  WHEN flag clicked:
    FOREVER:
      IF key w pressed? THEN:
        change ly by 8
      IF key s pressed? THEN:
        change ly by -8
      IF ly > 140 THEN:
        set ly to 140
      IF ly < -140 THEN:
        set ly to -140
      go to x: -220 y: ly

SPRITE PaddleR:
  SHAPE rect 16 90
  WHEN flag clicked:
    set ry to 0
    go to x: 220 y: ry
    show
  WHEN flag clicked:
    FOREVER:
      set target to y position of Ball
      IF target > ry + 6 THEN:
        change ry by 5
      IF target < ry - 6 THEN:
        change ry by -5
      IF ry > 140 THEN:
        set ry to 140
      IF ry < -140 THEN:
        set ry to -140
      go to x: 220 y: ry

SPRITE Ball:
  SHAPE circle 18
  WHEN flag clicked:
    set scoreL to 0
    set scoreR to 0
    set bx to 0
    set by to 0
    set vx to 8
    set vy to 5
    go to x: bx y: by
    show
  WHEN flag clicked:
    FOREVER:
      change bx by vx
      change by by vy
      go to x: bx y: by
      IF by > 165 or by < -165 THEN:
        set vy to vy * -1
      IF touching PaddleL THEN:
        set vx to abs of vx
      IF touching PaddleR THEN:
        set vx to abs of vx * -1
      IF bx < -235 THEN:
        change scoreR by 1
        set bx to 0
        set by to 0
        go to x: bx y: by
      IF bx > 235 THEN:
        change scoreL by 1
        set bx to 0
        set by to 0
        go to x: bx y: by
      IF scoreL > 4 or scoreR > 4 THEN:
        say "Game Over" for 2 seconds
        stop all`,

    sokoban: `# Sokoban — push the boxes (orange) onto the goals (green). Arrow keys move.
# The 8x7 level lives in two lists (walls/boxes + goals); custom blocks handle
# movement, tile rendering, win detection, and advancing through 3 levels.
GLOBAL level
GLOBAL prow
GLOBAL pcol
GLOBAL nr
GLOBAL nc
GLOBAL br
GLOBAL bc
GLOBAL cell
GLOBAL won
GLOBAL gv
GLOBAL bv
GLOBAL r
GLOBAL c
GLOBAL i

SPRITE Game:
  LIST board
  LIST goals
  COSTUME wall square 40 #6b5344
  COSTUME box square 34 #d9a441
  COSTUME goal circle 14 #55c57a
  COSTUME hero circle 30 #4c97ff

  DEFINE set b (row) (col) to (v):
    replace item ((row * 8) + col) + 1 of board with v

  DEFINE set g (row) (col) to (v):
    replace item ((row * 8) + col) + 1 of goals with v

  DEFINE read b (row) (col):
    set cell to item ((row * 8) + col) + 1 of board

  DEFINE FAST init level:
    delete all of board
    delete all of goals
    REPEAT 56:
      add 0 to board
      add 0 to goals
    set r to 0
    REPEAT 7:
      set c to 0
      REPEAT 8:
        IF r = 0 or r = 6 or c = 0 or c = 7 THEN:
          set b r c to 1
        change c by 1
      change r by 1
    IF level = 1 THEN:
      set b 2 3 to 2
      set b 4 3 to 2
      set g 2 5 to 1
      set g 4 5 to 1
      set prow to 3
      set pcol to 1
    IF level = 2 THEN:
      set b 1 3 to 2
      set b 3 3 to 2
      set b 5 3 to 2
      set g 1 5 to 1
      set g 3 5 to 1
      set g 5 5 to 1
      set prow to 3
      set pcol to 1
    IF level = 3 THEN:
      set b 2 4 to 2
      set b 4 4 to 2
      set g 2 2 to 1
      set g 4 2 to 1
      set prow to 3
      set pcol to 5
    set won to 0

  DEFINE FAST render:
    clear
    set size to 100
    set r to 0
    REPEAT 7:
      set c to 0
      REPEAT 8:
        set gv to item ((r * 8) + c) + 1 of goals
        IF gv = 1 THEN:
          switch costume to goal
          go to x: (-140) + (c * 40) y: (120) - (r * 40)
          stamp
        read b r c
        IF cell = 1 THEN:
          switch costume to wall
          go to x: (-140) + (c * 40) y: (120) - (r * 40)
          stamp
        IF cell = 2 THEN:
          switch costume to box
          go to x: (-140) + (c * 40) y: (120) - (r * 40)
          stamp
        change c by 1
      change r by 1
    switch costume to hero
    go to x: (-140) + (pcol * 40) y: (120) - (prow * 40)
    stamp

  DEFINE check win:
    set won to 1
    set i to 1
    REPEAT 56:
      set gv to item i of goals
      set bv to item i of board
      IF gv = 1 THEN:
        IF not bv = 2 THEN:
          set won to 0
      change i by 1

  DEFINE try move (dr) (dc):
    set nr to prow + dr
    set nc to pcol + dc
    read b nr nc
    IF cell = 0 THEN:
      set prow to nr
      set pcol to nc
    IF cell = 2 THEN:
      set br to nr + dr
      set bc to nc + dc
      read b br bc
      IF cell = 0 THEN:
        set b nr nc to 0
        set b br bc to 2
        set prow to nr
        set pcol to nc
    render
    check win
    IF won = 1 THEN:
      change level by 1
      IF level > 3 THEN:
        say "All levels solved!" for 3 seconds
        stop all
      ELSE:
        say "Level " join level for 1.5 seconds
        init level
        render

  WHEN flag clicked:
    hide
    set level to 1
    init level
    render

  WHEN up arrow key pressed:
    try move -1 0
  WHEN down arrow key pressed:
    try move 1 0
  WHEN left arrow key pressed:
    try move 0 -1
  WHEN right arrow key pressed:
    try move 0 1`,

    invaders: `# Space Invaders — move with arrow keys, space to shoot. Bullets and enemies are
# clones; enemies descend and are destroyed on a bullet hit.
GLOBAL score
GLOBAL bulletx
GLOBAL bullety

SPRITE Player:
  SHAPE triangle 38
  WHEN flag clicked:
    show variable score
    set score to 0
    set px to 0
    go to x: px y: -150
    show
  WHEN flag clicked:
    FOREVER:
      IF key left arrow pressed? THEN:
        change px by -7
      IF key right arrow pressed? THEN:
        change px by 7
      IF px > 220 THEN:
        set px to 220
      IF px < -220 THEN:
        set px to -220
      go to x: px y: -150
  WHEN space key pressed:
    set bulletx to px
    set bullety to -130
    broadcast "shoot"

SPRITE Bullet:
  SHAPE rect 6 16
  WHEN flag clicked:
    set role to 0
    hide
  # Only the original fires; clones set role 1 so a single press = a single
  # bullet (otherwise every live bullet would spawn another on each shot).
  WHEN I receive "shoot":
    IF role = 0 THEN:
      go to x: bulletx y: bullety
      create clone of myself
  WHEN I start as a clone:
    set role to 1
    show
    REPEAT UNTIL y position > 170:
      change y by 12
      wait 0.01 seconds
    delete this clone

SPRITE Enemy:
  SHAPE square 26
  WHEN flag clicked:
    hide
    set ex to -180
    REPEAT 8:
      go to x: ex y: 140
      create clone of myself
      change ex by 50
  WHEN I start as a clone:
    show
    FOREVER:
      change y by -1
      IF y position < -140 THEN:
        say "Invaded!" for 2 seconds
        stop all
      wait 0.2 seconds
  WHEN I start as a clone:
    FOREVER:
      IF touching Bullet THEN:
        change score by 1
        delete this clone
      wait 0.03 seconds`,

    flappy: `# Flappy — press space to flap. Pipe pairs scroll in from the right with a gap;
# touching a pipe or the floor/ceiling ends the game.
GLOBAL score
GLOBAL gapy

SPRITE Bird:
  SHAPE circle 30
  WHEN flag clicked:
    show variable score
    set score to 0
    set birdy to 0
    set vy to 0
    go to x: -120 y: birdy
    show
  WHEN space key pressed:
    set vy to 8
  WHEN flag clicked:
    FOREVER:
      change vy by -0.6
      change birdy by vy
      go to x: -120 y: birdy
      IF birdy < -170 or birdy > 175 THEN:
        say "Game Over" for 2 seconds
        stop all
      IF touching Pipe THEN:
        say "Game Over" for 2 seconds
        stop all
      wait 0.02 seconds

SPRITE Pipe:
  SHAPE rect 60 220
  WHEN flag clicked:
    hide
  WHEN flag clicked:
    FOREVER:
      set gapy to pick random -60 to 60
      go to x: 240 y: gapy + 190
      create clone of myself
      go to x: 240 y: gapy - 190
      create clone of myself
      wait 2.4 seconds
  WHEN I start as a clone:
    show
    REPEAT UNTIL x position < -240:
      change x by -4
      wait 0.02 seconds
    delete this clone`,

    tictactoe: `# Tic-Tac-Toe (2 players) — click a cell to place your mark. Red = X (player 1),
# blue = O (player 2). The 3x3 board is a 9-cell list; a custom block checks the
# eight winning lines. Cells are drawn with the pen, color-coded by mark.
GLOBAL turn
GLOBAL winner
GLOBAL col
GLOBAL row
GLOBAL i
GLOBAL v
GLOBAL va
GLOBAL vb
GLOBAL vc

SPRITE Board:
  LIST board
  COSTUME blank tile "" #dfe9ff
  COSTUME x tile "X" #ffffff #e63946
  COSTUME o tile "O" #ffffff #457b9d

  DEFINE FAST reset:
    delete all of board
    REPEAT 9:
      add 0 to board
    set turn to 1
    set winner to 0

  DEFINE check line (a) (b) (c):
    set va to item a of board
    set vb to item b of board
    set vc to item c of board
    IF va > 0 and va = vb and vb = vc THEN:
      set winner to va

  DEFINE check winner:
    set winner to 0
    check line 1 2 3
    check line 4 5 6
    check line 7 8 9
    check line 1 4 7
    check line 2 5 8
    check line 3 6 9
    check line 1 5 9
    check line 3 5 7

  DEFINE FAST render:
    clear
    set i to 0
    REPEAT 9:
      set v to item (i + 1) of board
      IF v = 0 THEN:
        switch costume to blank
      IF v = 1 THEN:
        switch costume to x
      IF v = 2 THEN:
        switch costume to o
      go to x: (-80) + ((i mod 3) * 80) y: (80) - ((floor of (i / 3)) * 80)
      stamp
      change i by 1

  DEFINE place at (r) (c):
    set i to (r * 3) + c
    IF winner = 0 and item (i + 1) of board = 0 THEN:
      replace item (i + 1) of board with turn
      check winner
      render
      IF winner > 0 THEN:
        say "Winner: player " join winner for 3 seconds
      IF winner = 0 THEN:
        IF turn = 1 THEN:
          set turn to 2
        ELSE:
          set turn to 1

  WHEN flag clicked:
    set size to 100
    hide
    reset
    render
    FOREVER:
      IF mouse down? THEN:
        set col to floor of ((mouse x + 120) / 80)
        set row to floor of ((120 - mouse y) / 80)
        IF col > -1 and col < 3 and row > -1 and row < 3 THEN:
          place at row col
        wait until not mouse down?
      wait 0.02 seconds`,

    tictactoe_ai: `# Tic-Tac-Toe (vs AI) — you are X (red), the computer is O (blue). Click a cell.
# The AI (a custom block) tries to win, else blocks your winning line, else takes
# the centre, else the first free cell — a genuine little opponent built from lists.
GLOBAL turn
GLOBAL winner
GLOBAL col
GLOBAL row
GLOBAL i
GLOBAL v
GLOBAL va
GLOBAL vb
GLOBAL vc
GLOBAL cand
GLOBAL k
GLOBAL done

SPRITE Board:
  LIST board
  COSTUME blank tile "" #dfe9ff
  COSTUME x tile "X" #ffffff #e63946
  COSTUME o tile "O" #ffffff #457b9d

  DEFINE FAST reset:
    delete all of board
    REPEAT 9:
      add 0 to board
    set turn to 1
    set winner to 0

  DEFINE check line (a) (b) (c):
    set va to item a of board
    set vb to item b of board
    set vc to item c of board
    IF va > 0 and va = vb and vb = vc THEN:
      set winner to va

  DEFINE check winner:
    set winner to 0
    check line 1 2 3
    check line 4 5 6
    check line 7 8 9
    check line 1 4 7
    check line 2 5 8
    check line 3 6 9
    check line 1 5 9
    check line 3 5 7

  DEFINE FAST render:
    clear
    set i to 0
    REPEAT 9:
      set v to item (i + 1) of board
      IF v = 0 THEN:
        switch costume to blank
      IF v = 1 THEN:
        switch costume to x
      IF v = 2 THEN:
        switch costume to o
      go to x: (-80) + ((i mod 3) * 80) y: (80) - ((floor of (i / 3)) * 80)
      stamp
      change i by 1

  DEFINE place at (r) (c):
    set i to (r * 3) + c
    IF winner = 0 and item (i + 1) of board = 0 THEN:
      replace item (i + 1) of board with 1
      check winner
      render
      IF winner > 0 THEN:
        say "You win!" for 3 seconds
      IF winner = 0 THEN:
        set turn to 2

  DEFINE find win for (p):
    set cand to 0
    set k to 1
    REPEAT 9:
      IF cand = 0 and item k of board = 0 THEN:
        replace item k of board with p
        check winner
        IF winner = p THEN:
          set cand to k
        replace item k of board with 0
        set winner to 0
      change k by 1

  DEFINE place mark (k):
    replace item k of board with 2
    check winner
    render
    IF winner > 0 THEN:
      say "Computer wins!" for 3 seconds
    IF winner = 0 THEN:
      set turn to 1

  DEFINE ai move:
    find win for 2
    IF cand > 0 THEN:
      place mark cand
    ELSE:
      find win for 1
      IF cand > 0 THEN:
        place mark cand
      ELSE:
        IF item 5 of board = 0 THEN:
          place mark 5
        ELSE:
          set done to 0
          set k to 1
          REPEAT 9:
            IF done = 0 and item k of board = 0 THEN:
              place mark k
              set done to 1
            change k by 1

  WHEN flag clicked:
    set size to 100
    hide
    reset
    render
    FOREVER:
      IF mouse down? and turn = 1 THEN:
        set col to floor of ((mouse x + 120) / 80)
        set row to floor of ((120 - mouse y) / 80)
        IF col > -1 and col < 3 and row > -1 and row < 3 THEN:
          place at row col
        IF turn = 2 and winner = 0 THEN:
          ai move
        wait until not mouse down?
      wait 0.02 seconds`,

    animation: `# Animation & sound — the walker cycles through its costumes to "walk" and beeps
# each step, then wraps around the screen. Shows COSTUME frames and SOUND tones.
SPRITE Walker:
  SHAPE square 40 #ff6680
  COSTUME frame2 circle 44 #59c059
  COSTUME frame3 triangle 44 #ffab19
  SOUND step 520
  WHEN flag clicked:
    set size to 120
    go to x: -200 y: 0
    show
    FOREVER:
      next costume
      play sound "step"
      change px by 15
      go to x: px y: 0
      IF px > 210 THEN:
        set px to -210
      wait 0.15 seconds`,

    g2048: `// 2048 — arrow keys slide the tiles; equal tiles merge and a new tile appears.
// The 4x4 board is a 16-cell list; a custom block slides+merges one line, reused
// for all four directions. Tiles are colour-coded by value (bigger = warmer).
GLOBAL score
GLOBAL moved
GLOBAL p
GLOBAL v
GLOBAL old
GLOBAL i
GLOBAL idx
GLOBAL empties
GLOBAL nv
GLOBAL done
GLOBAL r
GLOBAL c

SPRITE Board:
  LIST grid
  LIST linebuf
  COSTUME blank tile "" #cdc1b4
  COSTUME t2 tile "2" #eee4da #776e65
  COSTUME t4 tile "4" #ede0c8 #776e65
  COSTUME t8 tile "8" #f2b179 #ffffff
  COSTUME t16 tile "16" #f59563 #ffffff
  COSTUME t32 tile "32" #f67c5f #ffffff
  COSTUME t64 tile "64" #f65e3b #ffffff
  COSTUME t128 tile "128" #edcf72 #ffffff
  COSTUME t256 tile "256" #edcc61 #ffffff
  COSTUME t512 tile "512" #edc850 #ffffff
  COSTUME t1024 tile "1024" #edc53f #ffffff
  COSTUME t2048 tile "2048" #edc22e #ffffff

  DEFINE FAST reset:
    delete all of grid
    REPEAT 16:
      add 0 to grid
    set score to 0
    spawn
    spawn

  DEFINE addcell (a):
    set v to item a of grid
    IF not v = 0 THEN:
      add v to linebuf

  DEFINE writeback (a) (slot):
    set old to item a of grid
    IF slot > length of linebuf THEN:
      replace item a of grid with 0
    ELSE:
      replace item a of grid with item slot of linebuf
    IF not old = item a of grid THEN:
      set moved to 1

  DEFINE slide (a) (b) (c) (d):
    delete all of linebuf
    addcell a
    addcell b
    addcell c
    addcell d
    set p to 1
    REPEAT UNTIL p > (length of linebuf) - 1:
      IF item p of linebuf = item (p + 1) of linebuf THEN:
        replace item p of linebuf with (item p of linebuf) * 2
        change score by item p of linebuf
        delete (p + 1) of linebuf
      change p by 1
    writeback a 1
    writeback b 2
    writeback c 3
    writeback d 4

  DEFINE spawn:
    set empties to 0
    set i to 1
    REPEAT 16:
      IF item i of grid = 0 THEN:
        change empties by 1
      change i by 1
    IF empties > 0 THEN:
      set nv to 2
      IF pick random 1 to 10 = 1 THEN:
        set nv to 4
      set done to 0
      REPEAT UNTIL done = 1:
        set idx to pick random 1 to 16
        IF item idx of grid = 0 THEN:
          replace item idx of grid with nv
          set done to 1

  DEFINE FAST render:
    clear
    set i to 0
    REPEAT 16:
      set v to item (i + 1) of grid
      set r to floor of (i / 4)
      set c to i mod 4
      IF v = 0 THEN:
        switch costume to blank
      ELSE:
        switch costume to ("t" join v)
      go to x: (-120) + (c * 80) y: (120) - (r * 80)
      stamp
      change i by 1

  DEFINE move left:
    set moved to 0
    slide 1 2 3 4
    slide 5 6 7 8
    slide 9 10 11 12
    slide 13 14 15 16
    IF moved = 1 THEN:
      spawn
    render

  DEFINE move right:
    set moved to 0
    slide 4 3 2 1
    slide 8 7 6 5
    slide 12 11 10 9
    slide 16 15 14 13
    IF moved = 1 THEN:
      spawn
    render

  DEFINE move up:
    set moved to 0
    slide 1 5 9 13
    slide 2 6 10 14
    slide 3 7 11 15
    slide 4 8 12 16
    IF moved = 1 THEN:
      spawn
    render

  DEFINE move down:
    set moved to 0
    slide 13 9 5 1
    slide 14 10 6 2
    slide 15 11 7 3
    slide 16 12 8 4
    IF moved = 1 THEN:
      spawn
    render

  WHEN flag clicked:
    show variable score
    set size to 100
    hide
    reset
    render

  WHEN left arrow key pressed:
    move left
  WHEN right arrow key pressed:
    move right
  WHEN up arrow key pressed:
    move up
  WHEN down arrow key pressed:
    move down`,

    maze: `// Maze chase — eat the dots (green), avoid the red ghost, which greedily hunts you
// across an 11x9 wall grid. Arrow keys move. Grid: 1=wall, 0=dot, 2=eaten/floor.
GLOBAL score
GLOBAL alive
GLOBAL prow
GLOBAL pcol
GLOBAL grow
GLOBAL gcol
GLOBAL nr
GLOBAL nc
GLOBAL cell
GLOBAL gdr
GLOBAL gdc
GLOBAL moved
GLOBAL r
GLOBAL c

SPRITE Game:
  LIST grid
  COSTUME wall square 30 #2b3a67
  COSTUME dot circle 8 #ffd54a
  COSTUME hero circle 24 #ffe14d
  COSTUME ghost circle 24 #e63946

  DEFINE setc (row) (col) (v):
    replace item ((row * 11) + col) + 1 of grid with v

  DEFINE readc (row) (col):
    set cell to item ((row * 11) + col) + 1 of grid

  DEFINE FAST init maze:
    delete all of grid
    REPEAT 99:
      add 0 to grid
    set r to 0
    REPEAT 9:
      set c to 0
      REPEAT 11:
        IF r = 0 or r = 8 or c = 0 or c = 10 THEN:
          setc r c 1
        change c by 1
      change r by 1
    setc 2 3 1
    setc 2 4 1
    setc 2 5 1
    setc 6 5 1
    setc 6 6 1
    setc 6 7 1
    setc 4 8 1
    setc 4 2 1
    set prow to 7
    set pcol to 1
    setc 7 1 2
    set grow to 1
    set gcol to 9
    setc 1 9 2
    set score to 0
    set alive to 1

  DEFINE FAST render:
    clear
    set size to 100
    set r to 0
    REPEAT 9:
      set c to 0
      REPEAT 11:
        readc r c
        IF cell = 1 THEN:
          switch costume to wall
          go to x: (-150) + (c * 30) y: (120) - (r * 30)
          stamp
        IF cell = 0 THEN:
          switch costume to dot
          go to x: (-150) + (c * 30) y: (120) - (r * 30)
          stamp
        change c by 1
      change r by 1
    switch costume to hero
    go to x: (-150) + (pcol * 30) y: (120) - (prow * 30)
    stamp
    switch costume to ghost
    go to x: (-150) + (gcol * 30) y: (120) - (grow * 30)
    stamp

  DEFINE move player (dr) (dc):
    set nr to prow + dr
    set nc to pcol + dc
    readc nr nc
    IF not cell = 1 THEN:
      IF cell = 0 THEN:
        change score by 1
        setc nr nc 2
      set prow to nr
      set pcol to nc
    render
    IF prow = grow and pcol = gcol THEN:
      set alive to 0
      say "Caught!" for 2 seconds
      stop all

  DEFINE ghost step:
    set gdr to 0
    set gdc to 0
    IF prow > grow THEN:
      set gdr to 1
    IF prow < grow THEN:
      set gdr to -1
    IF pcol > gcol THEN:
      set gdc to 1
    IF pcol < gcol THEN:
      set gdc to -1
    set moved to 0
    IF not gdr = 0 THEN:
      readc (grow + gdr) gcol
      IF not cell = 1 THEN:
        set grow to grow + gdr
        set moved to 1
    IF moved = 0 and not gdc = 0 THEN:
      readc grow (gcol + gdc)
      IF not cell = 1 THEN:
        set gcol to gcol + gdc

  WHEN flag clicked:
    show variable score
    hide
    init maze
    render

  WHEN flag clicked:
    FOREVER:
      IF alive = 1 THEN:
        ghost step
        render
        IF grow = prow and gcol = pcol THEN:
          set alive to 0
          say "Caught!" for 2 seconds
          stop all
      wait 0.4 seconds

  WHEN up arrow key pressed:
    move player -1 0
  WHEN down arrow key pressed:
    move player 1 0
  WHEN left arrow key pressed:
    move player 0 -1
  WHEN right arrow key pressed:
    move player 0 1`,

    connect4: `// Connect Four (vs AI) — click a column to drop your red disc. The yellow computer
// tries to win, else blocks your three-in-a-row, else plays centre. 7x6 board in a
// list; a custom block checks every 4-in-a-row window (horizontal/vertical/diagonal).
GLOBAL turn
GLOBAL win
GLOBAL over
GLOBAL col
GLOBAL row
GLOBAL r
GLOBAL c
GLOBAL i
GLOBAL cand
GLOBAL cnt
GLOBAL k
GLOBAL placed
GLOBAL lastrow
GLOBAL v
GLOBAL cell

SPRITE Game:
  LIST board
  COSTUME slot square 50 #1e4fd8
  COSTUME empty circle 40 #dfe7ff
  COSTUME red circle 40 #e63946
  COSTUME yellow circle 40 #ffd23f

  DEFINE FAST reset:
    delete all of board
    REPEAT 42:
      add 0 to board
    set turn to 1
    set win to 0
    set over to 0

  DEFINE readc (rr) (cc):
    set cell to item ((rr * 7) + cc) + 1 of board

  DEFINE setc (rr) (cc) (vv):
    replace item ((rr * 7) + cc) + 1 of board with vv

  DEFINE drop (cc) (player):
    set placed to 0
    set row to 5
    REPEAT 6:
      readc row cc
      IF placed = 0 and cell = 0 THEN:
        setc row cc player
        set lastrow to row
        set placed to 1
      change row by -1

  DEFINE line4 (r0) (c0) (dr) (dc) (p):
    set cnt to 0
    set i to 0
    REPEAT 4:
      readc (r0 + (i * dr)) (c0 + (i * dc))
      IF cell = p THEN:
        change cnt by 1
      change i by 1
    IF cnt = 4 THEN:
      set win to 1

  DEFINE FAST check win for (p):
    set win to 0
    set r to 0
    REPEAT 6:
      set c to 0
      REPEAT 4:
        line4 r c 0 1 p
        change c by 1
      change r by 1
    set r to 0
    REPEAT 3:
      set c to 0
      REPEAT 7:
        line4 r c 1 0 p
        change c by 1
      change r by 1
    set r to 0
    REPEAT 3:
      set c to 0
      REPEAT 4:
        line4 r c 1 1 p
        change c by 1
      change r by 1
    set r to 0
    REPEAT 3:
      set c to 3
      REPEAT 4:
        line4 r c 1 -1 p
        change c by 1
      change r by 1

  DEFINE FAST render:
    clear
    set size to 100
    set i to 0
    REPEAT 42:
      set v to item (i + 1) of board
      set r to floor of (i / 7)
      set c to i mod 7
      switch costume to slot
      go to x: (-150) + (c * 50) y: (125) - (r * 50)
      stamp
      IF v = 0 THEN:
        switch costume to empty
      IF v = 1 THEN:
        switch costume to red
      IF v = 2 THEN:
        switch costume to yellow
      go to x: (-150) + (c * 50) y: (125) - (r * 50)
      stamp
      change i by 1

  DEFINE ai move:
    set cand to -1
    set k to 0
    REPEAT 7:
      IF cand = -1 THEN:
        drop k 2
        IF placed = 1 THEN:
          check win for 2
          IF win = 1 THEN:
            set cand to k
          setc lastrow k 0
      change k by 1
    IF cand = -1 THEN:
      set k to 0
      REPEAT 7:
        IF cand = -1 THEN:
          drop k 1
          IF placed = 1 THEN:
            check win for 1
            IF win = 1 THEN:
              set cand to k
            setc lastrow k 0
        change k by 1
    IF cand > -1 THEN:
      drop cand 2
    IF cand = -1 THEN:
      drop 3 2
      IF placed = 0 THEN:
        set k to 0
        REPEAT 7:
          IF placed = 0 THEN:
            drop k 2
          change k by 1
    check win for 2
    render
    IF win = 1 THEN:
      set over to 1
      say "Computer wins!" for 3 seconds
      stop all
    set turn to 1

  WHEN flag clicked:
    hide
    set size to 100
    reset
    render
    FOREVER:
      IF mouse down? and turn = 1 and over = 0 THEN:
        set col to floor of ((mouse x + 175) / 50)
        IF col > -1 and col < 7 THEN:
          drop col 1
          IF placed = 1 THEN:
            check win for 1
            render
            IF win = 1 THEN:
              set over to 1
              say "You win!" for 3 seconds
              stop all
            set turn to 2
            ai move
        wait until not mouse down?
      wait 0.02 seconds`,

    minesweeper: `// Minesweeper — click to reveal a cell; press F to flag/unflag the cell under the
// mouse. Clicking a mine ends the game; an empty (0-neighbour) cell flood-fills the
// connected region via a worklist queue. 9x9 grid, 10 mines. Revealed cells show their
// neighbour count (1-8, classic colours); hidden = grey, flagged = F, mine = red.
GLOBAL over
GLOBAL i
GLOBAL r
GLOBAL c
GLOBAL cnt
GLOBAL ci
GLOBAL qi
GLOBAL fr
GLOBAL fc
GLOBAL nidx
GLOBAL placed
GLOBAL col
GLOBAL row

SPRITE Game:
  LIST mine
  LIST revealed
  LIST adj
  LIST queue
  COSTUME covered tile "" #9aa7b8
  COSTUME empty tile "" #d7dde6
  COSTUME flag tile "F" #9aa7b8 #d32f2f
  COSTUME mine tile "*" #e84855 #ffffff
  COSTUME n1 tile "1" #d7dde6 #1976d2
  COSTUME n2 tile "2" #d7dde6 #388e3c
  COSTUME n3 tile "3" #d7dde6 #d32f2f
  COSTUME n4 tile "4" #d7dde6 #512da8
  COSTUME n5 tile "5" #d7dde6 #b71c1c
  COSTUME n6 tile "6" #d7dde6 #00838f
  COSTUME n7 tile "7" #d7dde6 #212121
  COSTUME n8 tile "8" #d7dde6 #616161

  DEFINE countmine (nr) (nc):
    IF nr > -1 and nr < 9 and nc > -1 and nc < 9 THEN:
      IF item ((nr * 9) + nc) + 1 of mine = 1 THEN:
        change cnt by 1

  DEFINE FAST reset:
    delete all of mine
    delete all of revealed
    delete all of adj
    delete all of queue
    REPEAT 81:
      add 0 to mine
      add 0 to revealed
      add 0 to adj
    set placed to 0
    REPEAT UNTIL placed = 10:
      set ci to pick random 1 to 81
      IF item ci of mine = 0 THEN:
        replace item ci of mine with 1
        change placed by 1
    set i to 0
    REPEAT 81:
      set r to floor of (i / 9)
      set c to i mod 9
      set cnt to 0
      countmine (r - 1) (c - 1)
      countmine (r - 1) c
      countmine (r - 1) (c + 1)
      countmine r (c - 1)
      countmine r (c + 1)
      countmine (r + 1) (c - 1)
      countmine (r + 1) c
      countmine (r + 1) (c + 1)
      replace item (i + 1) of adj with cnt
      change i by 1
    set over to 0

  DEFINE pushn (nr) (nc):
    IF nr > -1 and nr < 9 and nc > -1 and nc < 9 THEN:
      set nidx to ((nr * 9) + nc) + 1
      IF item nidx of revealed = 0 and item nidx of mine = 0 THEN:
        add nidx to queue

  DEFINE flood (start):
    delete all of queue
    add start to queue
    REPEAT UNTIL length of queue = 0:
      set qi to item 1 of queue
      delete 1 of queue
      IF item qi of revealed = 0 THEN:
        replace item qi of revealed with 1
        IF item qi of adj = 0 THEN:
          set fr to floor of ((qi - 1) / 9)
          set fc to (qi - 1) mod 9
          pushn (fr - 1) (fc - 1)
          pushn (fr - 1) fc
          pushn (fr - 1) (fc + 1)
          pushn fr (fc - 1)
          pushn fr (fc + 1)
          pushn (fr + 1) (fc - 1)
          pushn (fr + 1) fc
          pushn (fr + 1) (fc + 1)

  DEFINE reveal (cell):
    IF item cell of revealed = 0 and over = 0 THEN:
      IF item cell of mine = 1 THEN:
        replace item cell of revealed with 1
        set over to 1
        render
        say "Boom!" for 2 seconds
        stop all
      IF item cell of mine = 0 THEN:
        IF item cell of adj = 0 THEN:
          flood cell
        IF item cell of adj > 0 THEN:
          replace item cell of revealed with 1
        render

  DEFINE FAST render:
    clear
    set size to 42
    set i to 0
    REPEAT 81:
      set r to floor of (i / 9)
      set c to i mod 9
      IF item (i + 1) of revealed = 2 THEN:
        switch costume to flag
      IF item (i + 1) of revealed = 0 THEN:
        switch costume to covered
      IF item (i + 1) of revealed = 1 THEN:
        IF item (i + 1) of mine = 1 THEN:
          switch costume to mine
        ELSE:
          IF item (i + 1) of adj = 0 THEN:
            switch costume to empty
          ELSE:
            switch costume to ("n" join (item (i + 1) of adj))
      go to x: (-136) + (c * 34) y: (136) - (r * 34)
      stamp
      change i by 1

  DEFINE toggle flag (cell):
    IF over = 0 THEN:
      IF item cell of revealed = 0 THEN:
        replace item cell of revealed with 2
        render
      ELSE:
        IF item cell of revealed = 2 THEN:
          replace item cell of revealed with 0
          render

  WHEN flag clicked:
    set size to 42
    hide
    reset
    render
    FOREVER:
      IF mouse down? and over = 0 THEN:
        set col to floor of ((mouse x + 153) / 34)
        set row to floor of ((153 - mouse y) / 34)
        IF col > -1 and col < 9 and row > -1 and row < 9 THEN:
          reveal (((row * 9) + col) + 1)
        wait until not mouse down?
      wait 0.02 seconds

  WHEN f key pressed:
    set col to floor of ((mouse x + 153) / 34)
    set row to floor of ((153 - mouse y) / 34)
    IF col > -1 and col < 9 and row > -1 and row < 9 THEN:
      toggle flag (((row * 9) + col) + 1)`
};

export default examples;
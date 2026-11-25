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
      IF score > 26 THEN:
        say "You Win!" for 3 seconds
        stop all
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
    set edx to -40
    set edy to 0
  WHEN flag clicked:
    FOREVER:
      change ex by edx
      change ey by edy
      go to x: ex y: ey
      # keep travelling in a straight line; only pick a new heading when blocked
      IF touching Wall or touching Crate THEN:
        change ex by (0 - edx)
        change ey by (0 - edy)
        go to x: ex y: ey
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
      IF touching Bomb THEN:
        change score by 5
        say "got me!" for 1 seconds
        hide
        stop this script
      wait 0.35 seconds

  WHEN flag clicked:
    FOREVER:
      IF score > 12 THEN:
        say "You cleared the arena!" for 3 seconds
        stop all
      wait 0.1 seconds`,

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
        set won to 0
        init level
        render
        say "Level " join level for 1.5 seconds

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
      IF score > 7 THEN:
        say "You Win!" for 3 seconds
        stop all
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
        stop all
      IF winner = 0 THEN:
        IF board contains 0 THEN:
          IF turn = 1 THEN:
            set turn to 2
          ELSE:
            set turn to 1
        ELSE:
          say "Draw!" for 3 seconds
          stop all

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
        stop all
      IF winner = 0 THEN:
        IF board contains 0 THEN:
          set turn to 2
        ELSE:
          say "Draw!" for 3 seconds
          stop all

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
      stop all
    IF winner = 0 THEN:
      IF board contains 0 THEN:
        set turn to 1
      ELSE:
        say "Draw!" for 3 seconds
        stop all

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
    IF not (grid contains 0) THEN:
      say "You win! All dots eaten!" for 3 seconds
      stop all
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
    IF not (board contains 0) THEN:
      set over to 1
      say "Draw!" for 3 seconds
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
            IF not (board contains 0) THEN:
              set over to 1
              say "Draw!" for 3 seconds
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
        check win

  DEFINE check win:
    set cnt to 0
    set i to 1
    REPEAT 81:
      IF item i of mine = 0 and item i of revealed = 1 THEN:
        change cnt by 1
      change i by 1
    IF cnt = 71 THEN:
      set over to 1
      say "You cleared it!" for 3 seconds
      stop all

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
    say "Click a cell to reveal. Press F to flag a bomb." for 3 seconds

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
      toggle flag (((row * 9) + col) + 1)`,

    // Uses the Planète Maths extension (auto-declared on compile). These phrases map to
    // planetemaths_* blocks and transpile to real Python/JS.
    planetemaths: `SPRITE Mathbot:
  GLOBAL n
  WHEN flag clicked:
    say ("factorial of 5 = " join factorial of 5) for 2 seconds
    say ("min of 3 and 7 = " join min of 3 and 7) for 1 seconds
    say ("2 to the power of 8 = " join 2 to the power of 8) for 1 seconds
    say ("digits of 1234 sum to " join sum of digits of 1234) for 2 seconds
    say ("pi is about " join pi) for 2 seconds
    set n to pick random 1 to 20
    IF n is multiple of 2 THEN:
      say (n join " is even") for 2 seconds
    ELSE:
      say (n join " is odd") for 2 seconds`,

    // Uses the Arrays & Vectors extension (auto-declared). Named arrays, 0-based.
    arrays: `SPRITE Arraybot:
  SHAPE square 46 #6b8e23
  WHEN flag clicked:
    new array "nums" = [5, 3, 8, 1]
    push 12 to array "nums"
    say ("sum = " join sum of array "nums") for 2 seconds
    say ("largest = " join largest of array "nums") for 2 seconds
    say ("first item = " join item 0 of array "nums") for 2 seconds
    set item 1 of array "nums" to 99
    say ("after set: " join array "nums" as text) for 2 seconds
    IF array "nums" contains 8 THEN:
      say "the array has an 8" for 2 seconds
    new array "counts" = range 1 to 5
    say ("range 1..5 sums to " join sum of array "counts") for 2 seconds`
,

    // ---- Hardware: STC12 / 8051 -------------------------------------------------
    // These are the examples for the C target. Everything above is a Scratch program and
    // compiles to C only as a wall of "no equivalent" warnings — reasonably, since a
    // sprite has no meaning on a microcontroller. These do the opposite: they declare
    // real pins and compile to C that SDCC builds and a chip runs.
    //
    // They are excluded from the Python/JS transparency matrix on purpose: a pin block
    // emits `_stc12.setPin(...)` against the driver, and the JS front end has no way to
    // read that back. They round-trip pseudocode <-> blocks <-> C, which is the pair that
    // matters for hardware.

    // ── 8086 ────────────────────────────────────────────────────────────
    // These compile to 8086 assembly through BrickWright's assembler.
    i8086_blink: `DEVICE i8086

PIN led1 = P1.0 OUTPUT
PIN led2 = P1.1 OUTPUT

# THE SAME PROGRAM AS THE STC BLINK BELOW, WITH ONE LINE CHANGED: the DEVICE.
# P1, P2 and P3 map onto the 8255's ports A, B and C, so a pin declaration
# means the same wire on either chip.
WHEN flag clicked:
  FOREVER:
    turn on led1
    turn off led2
    wait 0.15 secs
    turn off led1
    turn on led2
    wait 0.15 secs`,

    i8086_keypad: `DEVICE i8086

PART pad = KEYPAD4X4 ROWS P3.0 P3.1 P3.2 P3.3 COLS P2.0 P2.1 P2.2 P2.3
PIN led = P1.0 OUTPUT
GLOBAL k

# A matrix keypad is eight wires. Each row is driven low in turn while the
# columns are read. Rows and columns use different 8255 ports because its
# direction is configured a whole port at a time.
WHEN flag clicked:
  FOREVER:
    set k to read pad
    IF k = 0 THEN:
      turn on led
    IF k = -1 THEN:
      turn off led`,

    i8086_events: `DEVICE i8086

PIN sw = P2.0 INPUT ACTIVE LOW

# Four scripts run on a preemptive scheduler. The build supplies the 8259
# interrupt controller and 8254 timer needed for scheduling.
WHEN flag clicked:
  REPEAT 5:
    print "tick"
    wait 0.2 secs
  stop all

WHEN sw pressed:
  print "button"

WHEN a key pressed:
  broadcast "typed"

WHEN I receive "typed":
  print "you pressed A"`,

    i8086_counter: `DEVICE i8086

PART disp = SEVENSEG8 SEGMENTS P1 SELECT P2.0 P2.1 P2.2
GLOBAL n

# EIGHT DIGITS ON ONE PORT, which only works because they are never all lit
# at once. A multiplexed display shows ONE digit at a time and relies on the
# eye to blend them -- so the build adds a script whose whole job is to scan
# it, and at about 1 kHz each of the eight is refreshed 125 times a second.
#
# THREE PINS SELECT EIGHT DIGITS. They drive a 74HC138, whose eight outputs
# are the digit commons; that decoder is the entire reason three wires are
# enough. The segments come from a whole port through a '245.
#
# On an 8051 the scan lives in the Timer-0 interrupt. Here it is one of the
# scheduler's scripts, which is why this needs no interrupt handler you can
# see -- and why counting and displaying can be written as if nothing else
# were happening.
WHEN flag clicked:
  set n to 0
  FOREVER:
    show number n on disp
    change n by 1
    wait 0.25 secs`,

    i8086_analog: `DEVICE i8086

PIN pot = P1.3 ANALOG
GLOBAL v

# An analog pin adds an ADC0809 at 300h. Its eight-bit reading is scaled to
# 0..1023 to agree with the ten-bit STC12 interface.
WHEN flag clicked:
  REPEAT 5:
    set v to read pot
    print v
    wait 0.2 secs`,

    stc_blink: `DEVICE STC12C5A60S2
CLOCK 11059200

PIN led1 = P1.0 OUTPUT ACTIVE LOW
PIN led2 = P1.1 OUTPUT ACTIVE LOW

# The smoke test for a fresh chip: alternate two LEDs, then flash them together.
# ACTIVE LOW is the whole story of this pin — the chip sinks 20 mA but sources only
# ~230 uA, so the LED is wired to +5V through a resistor and "turn on" writes a 0.
WHEN flag clicked:
  FOREVER:
    REPEAT 6:
      turn on led1
      turn off led2
      wait 0.15 seconds
      turn off led1
      turn on led2
      wait 0.15 seconds
    turn on led1
    turn on led2
    wait 1 seconds
    turn off led1
    turn off led2
    wait 1 seconds`,

    stc_potentiometer: `DEVICE STC12C5A60S2
CLOCK 11059200

PIN led = P1.0 OUTPUT ACTIVE LOW
PIN pot = P1.3 ANALOG

# A potentiometer on P1.3 sets the blink rate. ANALOG pins live on P1 only —
# ADC channel n is physically P1.n, there is no mux to anywhere else.
WHEN flag clicked:
  FOREVER:
    set reading to read pot
    turn on led
    wait (reading / 1000) seconds
    turn off led
    wait (reading / 1000) seconds`,

    stc_button: `DEVICE STC12C5A60S2
CLOCK 11059200

PIN led = P1.0 OUTPUT ACTIVE LOW
PIN button = P3.2 INPUT ACTIVE LOW

# A button between P3.2 and ground, so pressing it pulls the pin LOW —
# hence ACTIVE LOW, which lets the pseudocode read "read button" as pressed.
WHEN flag clicked:
  set count to 0
  FOREVER:
    wait until read button
    change count by 1
    turn on led
    wait 0.25 seconds
    turn off led
    wait 0.25 seconds`,

    stc_two_scripts: `DEVICE STC12C5A60S2
CLOCK 11059200

PIN heartbeat = P1.0 OUTPUT ACTIVE LOW
PIN signal = P1.1 OUTPUT ACTIVE LOW

# Two scripts running at once. On a chip with no operating system this compiles to a
# cooperative scheduler: a Timer-0 interrupt counts milliseconds and nothing else, and
# each script becomes a state machine that yields at every wait AND at every loop
# back-edge — which is Scratch's own rule, and what stops one busy loop starving the other.
WHEN flag clicked:
  FOREVER:
    turn on heartbeat
    wait 0.05 seconds
    turn off heartbeat
    wait 0.95 seconds

WHEN flag clicked:
  FOREVER:
    REPEAT 3:
      turn on signal
      wait 0.1 seconds
      turn off signal
      wait 0.1 seconds
    wait 2 seconds`,

    stc_pwm_fade: `DEVICE STC12C5A60S2
CLOCK 11059200

PIN led = P1.0 OUTPUT ACTIVE LOW

# Brightness by hand: switch the pin faster than the eye can follow and vary how long
# it stays on. The eye integrates over roughly 20 ms, so this reads as a fade rather
# than as flicker. "set led to <expression>" writes a computed LEVEL — unlike
# "turn on", a level is not inverted by ACTIVE LOW.
WHEN flag clicked:
  FOREVER:
    REPEAT 20:
      change duty by 1
      REPEAT 12:
        set led to 0
        wait 0.001 seconds
        set led to 1
        wait 0.001 seconds
    set duty to 0`
};

export default examples;

// CP1 source uses its own assembler and stays outside the pseudocode corpus.
export const CP1_EXAMPLES = Object.freeze({
    "cp1-first-display": "; Original Brickwright CP1 example: keep a constant visible.\n; The dot in a listing separates opcode from operand: 04.042.\nVALUE EQU 42\nORG 0\nstart: AKO VALUE\ndisplay: ANZ\n         SPU display\n",
    "cp1-switch-input": "; Original Brickwright CP1 example: sample input line 1 repeatedly.\n; CP1 selector 1 corresponds to circuit terminal P1.0.\nORG 0\nsample: P1E 1\n        ANZ\n        VZG 100\n        SPU sample\n",
    "cp1-blink": "; Original Brickwright CP1 example: alternate output line 1.\n; CP1 P2A selector 1 corresponds to circuit terminal P2.0.\nWAIT EQU 200\nORG 0\nagain: AKO 1\n       P2A 1\n       VZG WAIT\n       AKO 0\n       P2A 1\n       VZG WAIT\n       SPU again\n",
    "cp1-cp5-binary": "; Original Brickwright CP5-style binary workbench.\n; A closed switch grounds its input (0); an open switch reads 1.\n; Terminal 1 / P1.0 / P2.0 is the least significant bit.\nSETTLE EQU 200\nPOLL EQU 100\nORG 0\nstart:  AKO 0\n        P2A 0\n        VZG SETTLE\nsample: P1E 0\n        ABS observed\n        P2A 0\n        ANZ\n        VZG POLL\n        SPU sample\nORG 32\nobserved: DATA 0\n",
    "cp1-descending-sum": "ORG 10\nAKO 7\nABS Remaining\nAKO 0\nABS Total\nCheck: LDA Remaining\nVGL Zero\nSPB Done\nADD Total\nABS Total\nLDA Remaining\nSUB One\nABS Remaining\nSPU Check\nDone: LDA Total\nHLT 0\n\nORG 30\nRemaining: DATA 0\nTotal: DATA 0\nOne: DATA 1\nZero: DATA 0\n",
    "cp1-crate-division": "ORG 20\nAKO 83\nABS Loose\nAKO 0\nABS Crates\nCheck: LDA Loose\nVKL Size\nSPB Done\nSUB Size\nABS Loose\nLDA Crates\nADD One\nABS Crates\nSPU Check\nDone: LDA Loose\nHLT 0\n\nORG 39\nLoose: DATA 0\nCrates: DATA 0\nSize: DATA 9\nOne: DATA 1\n",
    "cp1-lookup-card": "ORG 38\nAKO 4\nADD CardStart\nABS Cursor\nLIA Cursor\nHLT 0\n\nORG 50\nCardStart: DATA 54\nCursor: DATA 0\n\nORG 54\nDATA 208\nDATA 31\nDATA 174\nDATA 96\nDATA 123\nDATA 67\n",
    "cp1-instruction-patch": "ORG 66\nLDA Replacement\nABS Action\nSPU Action\nAction: AKO 14\nHLT 0\n\nORG 78\nReplacement: AKO 197\n",
    "cp1-guarded-output": "ORG 30\nP1E 7\nNEG 0\nABS NotSeven\nP1E 2\nUND NotSeven\nP2A 5\nHLT 0\n\nORG 46\nNotSeven: DATA 0\n",
    "cp1-expansion-step": "ORG 196\nP3E 0\nABS Captured\nP4A 0\nP5A 0\nHLT 0\n\nORG 212\nCaptured: DATA 0\n",
    "cp1-sample-log": "ORG 35\nAKO RecordStart\nABS Cursor\nSample: P1E 0\nAIS Cursor\nLDA Cursor\nVGL Last\nSPB Done\nADD One\nABS Cursor\nSPU Sample\nDone: LIA Cursor\nHLT 0\n\nORG 62\nCursor: DATA 0\nOne: DATA 1\nLast: DATA 78\n\nORG 76\nRecordStart: DATA 0\nDATA 0\nDATA 0\n",
    "cp1-gray-indicator": "ORG 8\nAKO Pattern\nABS Cursor\nEmit: LIA Cursor\nP2A 0\nVZG 75\nLDA Cursor\nVGL Last\nSPB Done\nADD One\nABS Cursor\nSPU Emit\nDone: HLT 0\n\nORG 30\nCursor: DATA 0\nOne: DATA 1\nLast: DATA 51\n\nORG 44\nPattern: DATA 248\nDATA 249\nDATA 251\nDATA 250\nDATA 254\nDATA 255\nDATA 253\nDATA 252\n",
    "cp1-status-dispatch": "ORG 82\nP1E 0\nVGR Largest\nSPB Fallback\nADD TableAddress\nABS Selector\nSIU Selector\nRouteZero: AKO 17\nHLT 0\nRouteOne: AKO 71\nHLT 0\nRouteTwo: AKO 143\nHLT 0\nFallback: AKO 239\nHLT 0\n\nORG 110\nTableAddress: DATA 114\nSelector: DATA 0\nLargest: DATA 2\n\nORG 114\nSPU RouteZero\nSPU RouteOne\nSPU RouteTwo\n",
    "cp1-batch-ticker": "ORG 0\nEntry: LDA First\nABS Batch\nShow: ANZ 0\nVZG 110\nLDA Batch\nVGL Last\nSPB Entry\nADD Stride\nABS Batch\nSPU Show\nBatch: DATA 0\nFirst: DATA 31\nLast: DATA 37\nStride: DATA 3\n",
    "cp1-bench-voltmeter": "ORG 0\nEntry: AKO 0\nABS Reading\nSample: P1E 0\nVKL Offset\nSPB Done\nSUB Offset\nABS Residue\nLoop: LDA Residue\nVKL Gain\nSPB Done\nSUB Gain\nABS Residue\nLDA Reading\nADD One\nABS Reading\nSPU Loop\nDone: LDA Reading\nANZ 0\nHLT 0\nReading: DATA 0\nResidue: DATA 0\nOffset: DATA 12\nGain: DATA 4\nOne: DATA 1\n",
    "cp1-bidirectional-beacon": "ORG 0\nEntry: AKO 0\nP1A 5\nProbe: P1E 2\nABS Sample\nVZG 145\nAKO 1\nP1A 5\nLDA Sample\nHLT 0\nSample: DATA 0\n",
    "cp1-button-stopwatch": "ORG 0\nEntry: AKO 0\nABS Count\nGate: P1E 4\nVGL One\nSPB Done\nVZG 100\nLDA Count\nADD One\nABS Count\nANZ 0\nVGL Limit\nSPB Done\nSPU Gate\nDone: LDA Count\nHLT 0\nCount: DATA 0\nOne: DATA 1\nLimit: DATA 9\n",
    "cp1-code-feedback": "ORG 0\nEntry: AKO 0\nABS Attempts\nRequest: P1E 0\nVGL Idle\nSPB Request\nABS Guess\nLDA Attempts\nADD One\nABS Attempts\nLDA Guess\nVGL Secret\nSPB Found\nVKL Secret\nSPB Low\nAKO 2\nSPU Show\nLow: AKO 1\nShow: P2A 0\nLDA Attempts\nVGL Limit\nSPB Exhausted\nRelease: P1E 0\nVGL Idle\nSPB Request\nSPU Release\nFound: AKO 3\nSPU Done\nExhausted: AKO 4\nDone: P2A 0\nHLT 0\nAttempts: DATA 0\nGuess: DATA 0\nSecret: DATA 102\nIdle: DATA 255\nOne: DATA 1\nLimit: DATA 12\n",
    "cp1-delay-lab": "ORG 0\nEntry: AKO 4\nABS Rows\nAKO 0\nABS Visits\nP2A 4\nOuter: AKO 6\nABS Columns\nInner: LDA Visits\nADD One\nABS Visits\nLDA Columns\nSUB One\nABS Columns\nVGL Zero\nSPB RowDone\nSPU Inner\nRowDone: LDA Rows\nSUB One\nABS Rows\nVGL Zero\nSPB Done\nSPU Outer\nDone: AKO 1\nP2A 4\nLDA Visits\nHLT 0\nRows: DATA 0\nColumns: DATA 0\nVisits: DATA 0\nOne: DATA 1\nZero: DATA 0\n",
    "cp1-display-postcard": "ORG 0\nEntry: AKO 26\nANZ 0\nVZG 215\nAKO 148\nANZ 0\nVZG 190\nAKO 73\nANZ 0\nVZG 230\nHLT 0\n",
    "cp1-dual-workbench": "ORG 0\nEntry: AKO 47\nABS Stock\nHLT 0\n\nORG 16\nInspect: LDA Stock\nADD Reserve\nABS Total\nANZ 0\nHLT 0\n\nORG 30\nStock: DATA 18\nReserve: DATA 5\nTotal: DATA 0\n",
    "cp1-greenhouse-schedule": "ORG 0\nEntry: AKO 0\nABS Minute\nP2A 7\nTick: P1E 1\nVGL Zero\nSPB Advance\nSPU Tick\nAdvance: LDA Minute\nADD One\nABS Minute\nVGL End\nSPB Done\nVGL OpenA\nSPB Open\nVGL OpenB\nSPB Open\nVGL ShutA\nSPB Shut\nVGL ShutB\nSPB Shut\nSPU Release\nOpen: AKO 1\nP2A 7\nSPU Release\nShut: AKO 0\nP2A 7\nRelease: P1E 1\nVGL One\nSPB Tick\nSPU Release\nDone: LDA Minute\nHLT 0\nMinute: DATA 0\nZero: DATA 0\nOne: DATA 1\nOpenA: DATA 2\nShutA: DATA 4\nOpenB: DATA 6\nShutB: DATA 8\nEnd: DATA 9\n",
    "cp1-led-route-puzzle": "ORG 0\nEntry: P1E 1\nP2A 1\nNEG 0\nABS LeftClear\nReadRight: P1E 2\nP2A 2\nUND LeftClear\nP2A 3\nANZ 0\nHLT 0\nLeftClear: DATA 0\n",
    "cp1-machine-time-meter": "ORG 0\nEntry: AKO 0\nABS Used\nABS Cost\nRequest: P1E 0\nVGL Zero\nSPB Done\nVGL One\nSPB Base\nVGL Two\nSPB Peak\nSPU Request\nBase: LDA Cost\nADD BaseRate\nSPU Charge\nPeak: LDA Cost\nADD PeakRate\nCharge: ABS Cost\nANZ 0\nLDA Used\nADD One\nABS Used\nVGL Limit\nSPB Done\nRelease: P1E 0\nVGL Idle\nSPB Request\nSPU Release\nDone: LDA Cost\nHLT 0\nUsed: DATA 0\nCost: DATA 0\nZero: DATA 0\nOne: DATA 1\nTwo: DATA 2\nIdle: DATA 255\nLimit: DATA 8\nBaseRate: DATA 7\nPeakRate: DATA 11\n",
    "cp1-shift-clock": "ORG 0\nEntry: AKO 23\nABS Hour\nAKO 58\nABS Minute\nRequest: P1E 0\nVGL Stop\nSPB Done\nVGL Tick\nSPB Advance\nSPU Request\nAdvance: LDA Minute\nADD One\nVGL Sixty\nSPB NewHour\nSPU Show\nNewHour: AKO 0\nABS Minute\nLDA Hour\nADD One\nVGL Day\nSPB Midnight\nSPU SetHour\nMidnight: AKO 0\nSetHour: ABS Hour\nLDA Minute\nShow: ABS Minute\nLDA Hour\nP2A 0\nLDA Minute\nANZ 0\nRelease: P1E 1\nVGL One\nSPB Request\nSPU Release\nDone: LDA Minute\nHLT 0\nHour: DATA 0\nMinute: DATA 0\nOne: DATA 1\nTick: DATA 254\nStop: DATA 253\nSixty: DATA 60\nDay: DATA 24\n",
    "cp1-signal-memory": "ORG 0\nEntry: AKO Memory\nABS Cursor\nAKO 2\nABS State\nGenerate: LDA State\nAIS Cursor\nLDA Cursor\nVGL Last\nSPB Wait\nADD One\nABS Cursor\nLDA State\nADD Three\nVKL Seven\nSPB Keep\nSUB Seven\nKeep: ABS State\nSPU Generate\nWait: P1E 2\nVGL Zero\nSPB Begin\nSPU Wait\nBegin: AKO Memory\nABS Cursor\nReplay: LIA Cursor\nP2A 0\nVZG 80\nLDA Cursor\nVGL Last\nSPB Done\nADD One\nABS Cursor\nSPU Replay\nDone: LIA Cursor\nHLT 0\nCursor: DATA 0\nState: DATA 0\nZero: DATA 0\nOne: DATA 1\nThree: DATA 3\nSeven: DATA 7\nLast: DATA 67\nORG 64\nMemory: DATA 0\nSecond: DATA 0\nThird: DATA 0\nFourth: DATA 0\n",
    "cp1-signal-reaction": "ORG 0\nEntry: AKO 0\nP2A 6\nABS Count\nSelect: P1E 3\nVGL Zero\nSPB Short\nVZG 190\nSPU Cue\nShort: VZG 90\nCue: AKO 1\nP2A 6\nReadButton: P1E 4\nVGL Zero\nSPB Done\nVZG 35\nLDA Count\nADD One\nABS Count\nVGL Limit\nSPB Done\nSPU ReadButton\nDone: AKO 0\nP2A 6\nLDA Count\nANZ 0\nHLT 0\nCount: DATA 0\nZero: DATA 0\nOne: DATA 1\nLimit: DATA 12\n",
    "cp1-ticket-draw": "ORG 0\nEntry: AKO 2\nABS Ticket\nRelease: P1E 3\nVGL One\nSPB ReadButton\nSPU Release\nReadButton: P1E 3\nVGL Zero\nSPB Draw\nLDA Ticket\nADD Three\nVKL Eleven\nSPB Keep\nSUB Eleven\nKeep: ABS Ticket\nVZG 55\nSPU ReadButton\nDraw: LDA Ticket\nADD One\nABS Result\nANZ 0\nHLT 0\nTicket: DATA 0\nResult: DATA 0\nOne: DATA 1\nZero: DATA 0\nThree: DATA 3\nEleven: DATA 11\n",
    "cp1-tile-bundles": "ORG 0\nEntry: AKO 7\nABS Remaining\nAKO 0\nABS Product\nNext: LDA Product\nADD Bundle\nABS Product\nLDA Remaining\nSUB One\nABS Remaining\nVGL Zero\nSPB Done\nSPU Next\nDone: LDA Product\nHLT 0\nProduct: DATA 0\nRemaining: DATA 0\nBundle: DATA 13\nOne: DATA 1\nZero: DATA 0\n",
    "cp1-token-match": "ORG 0\nEntry: AKO 10\nABS Left\nRequest: P1E 0\nVGL Idle\nSPB Request\nVGL Zero\nSPB Release\nVGR MaxMove\nSPB Release\nVGR Left\nSPB Release\nABS Move\nLDA Left\nSUB Move\nABS Left\nVGL Zero\nSPB HumanWon\nLDA Four\nSUB Move\nVGR Left\nSPB ComputerWon\nABS Move\nLDA Left\nSUB Move\nABS Left\nVGL Zero\nSPB ComputerWon\nANZ 0\nRelease: P1E 0\nVGL Idle\nSPB Request\nSPU Release\nHumanWon: AKO 1\nSPU Verdict\nComputerWon: AKO 0\nABS Left\nAKO 2\nVerdict: ABS Result\nANZ 0\nHLT 0\nLeft: DATA 0\nMove: DATA 0\nResult: DATA 0\nZero: DATA 0\nFour: DATA 4\nMaxMove: DATA 3\nIdle: DATA 255\n",
    "cp1-workshop-capacity": "ORG 0\nEntry: LDA Limit\nABS Free\nRequest: P1E 0\nVGL Idle\nSPB Request\nVGL Zero\nSPB Done\nVGL One\nSPB Arrive\nVGL Two\nSPB Depart\nSPU Release\nArrive: LDA Free\nVGL Zero\nSPB Report\nSUB One\nSPU Update\nDepart: LDA Free\nVGL Limit\nSPB Report\nADD One\nUpdate: ABS Free\nReport: ANZ 0\nRelease: P1E 0\nVGL Idle\nSPB Request\nSPU Release\nDone: LDA Free\nHLT 0\nFree: DATA 0\nLimit: DATA 3\nIdle: DATA 255\nZero: DATA 0\nOne: DATA 1\nTwo: DATA 2\n",
    "cp1-cabinet-panel": "ORG 0\nEntry: AKO 0\nP2A 3\nReset: AKO 0\nABS Progress\nAKO Sequence\nABS Cursor\nRequest: P1E 0\nVGL Idle\nSPB Request\nABS Key\nLIA Cursor\nVGL Key\nSPB Correct\nAKO 0\nABS Progress\nANZ 0\nAKO Sequence\nABS Cursor\nSPU Release\nCorrect: LDA Progress\nADD One\nABS Progress\nANZ 0\nVGL Length\nSPB Open\nLDA Cursor\nADD One\nABS Cursor\nRelease: P1E 0\nVGL Idle\nSPB Request\nSPU Release\nOpen: AKO 1\nP2A 3\nLDA Progress\nHLT 0\nProgress: DATA 0\nCursor: DATA 0\nKey: DATA 0\nOne: DATA 1\nLength: DATA 3\nIdle: DATA 255\nSequence: DATA 9\nDATA 4\nDATA 7\n",
    "cp1-descent-challenge": "ORG 0\nEntry: AKO 15\nABS Height\nAKO 2\nABS Speed\nAKO 3\nABS Fuel\nRequest: P1E 0\nVGL Zero\nSPB Coast\nVGL One\nSPB Brake\nSPU Request\nBrake: LDA Fuel\nVGL Zero\nSPB Coast\nSUB One\nABS Fuel\nLDA Speed\nVGL One\nSPB Move\nSUB One\nSPU Move\nCoast: LDA Speed\nADD One\nMove: ABS Speed\nVKL Height\nSPB Fall\nAKO 0\nABS Height\nLDA Speed\nVGR Safe\nSPB Hard\nAKO 1\nSPU Verdict\nHard: AKO 2\nVerdict: ABS Result\nANZ 0\nHLT 0\nFall: LDA Height\nSUB Speed\nABS Height\nANZ 0\nRelease: P1E 0\nVGL Idle\nSPB Request\nSPU Release\nHeight: DATA 0\nSpeed: DATA 0\nFuel: DATA 0\nResult: DATA 0\nZero: DATA 0\nOne: DATA 1\nSafe: DATA 2\nIdle: DATA 255\n",
    "cp1-fraction-stream": "ORG 0\nEntry: AKO 5\nABS Remainder\nAKO DigitA\nABS Cursor\nDigit: AKO 10\nABS Times\nAKO 0\nABS Scaled\nABS Quotient\nMultiply: LDA Scaled\nADD Remainder\nABS Scaled\nLDA Times\nSUB One\nABS Times\nVGL Zero\nSPB Divide\nSPU Multiply\nDivide: LDA Scaled\nVKL Divisor\nSPB Record\nSUB Divisor\nABS Scaled\nLDA Quotient\nADD One\nABS Quotient\nSPU Divide\nRecord: ABS Remainder\nLDA Quotient\nAIS Cursor\nANZ 0\nVZG 180\nLDA Cursor\nVGL Last\nSPB Done\nADD One\nABS Cursor\nSPU Digit\nDone: LDA Quotient\nHLT 0\nRemainder: DATA 0\nCursor: DATA 0\nTimes: DATA 0\nScaled: DATA 0\nQuotient: DATA 0\nDivisor: DATA 13\nOne: DATA 1\nZero: DATA 0\nLast: DATA 75\nORG 70\nDigitA: DATA 0\nDigitB: DATA 0\nDigitC: DATA 0\nDigitD: DATA 0\nDigitE: DATA 0\nDigitF: DATA 0\n",
    "cp1-grid-escape": "ORG 0\nEntry: AKO 0\nABS Position\nRequest: P1E 0\nVGL Idle\nSPB Request\nVGR Eight\nSPB Release\nVGL Four\nSPB Release\nABS Target\nLDA Position\nVKL Three\nSPB CheckDown\nSUB Three\nVGL Target\nSPB Move\nCheckDown: LDA Position\nADD Three\nVGL Target\nSPB Move\nLDA Position\nVGL Zero\nSPB CheckRight\nVGL Three\nSPB CheckRight\nVGL Six\nSPB CheckRight\nSUB One\nVGL Target\nSPB Move\nCheckRight: LDA Position\nVGL Two\nSPB Release\nVGL Five\nSPB Release\nVGL Eight\nSPB Release\nADD One\nVGL Target\nSPB Move\nSPU Release\nMove: LDA Target\nABS Position\nANZ 0\nVGL Eight\nSPB Done\nRelease: P1E 0\nVGL Idle\nSPB Request\nSPU Release\nDone: HLT 0\nPosition: DATA 0\nTarget: DATA 0\nZero: DATA 0\nOne: DATA 1\nTwo: DATA 2\nThree: DATA 3\nFour: DATA 4\nFive: DATA 5\nSix: DATA 6\nEight: DATA 8\nIdle: DATA 255\n",
    "cp1-pair-grid": "ORG 0\nEntry: AKO 0\nABS Pairs\nFirstRead: P1E 0\nVGR Five\nSPB FirstRead\nADD Start\nABS FirstAddress\nLIA FirstAddress\nVGL Zero\nSPB FirstRead\nABS FirstValue\nANZ 0\nReleaseFirst: P1E 0\nVGL Idle\nSPB SecondRead\nSPU ReleaseFirst\nSecondRead: P1E 0\nVGR Five\nSPB SecondRead\nADD Start\nVGL FirstAddress\nSPB SecondRead\nABS SecondAddress\nLIA SecondAddress\nVGL Zero\nSPB SecondRead\nANZ 0\nVGL FirstValue\nSPB Match\nAKO 0\nP2A 1\nSPU ReleaseRound\nMatch: AKO 0\nAIS FirstAddress\nAIS SecondAddress\nAKO 1\nP2A 1\nLDA Pairs\nADD One\nABS Pairs\nVGL Three\nSPB Done\nReleaseRound: P1E 0\nVGL Idle\nSPB FirstRead\nSPU ReleaseRound\nDone: HLT 0\nPairs: DATA 0\nFirstAddress: DATA 0\nFirstValue: DATA 0\nSecondAddress: DATA 0\nZero: DATA 0\nOne: DATA 1\nThree: DATA 3\nFive: DATA 5\nIdle: DATA 255\nStart: DATA 76\nORG 76\nCardA: DATA 21\nCardB: DATA 83\nCardC: DATA 21\nCardD: DATA 47\nCardE: DATA 83\nCardF: DATA 47\n",
    "cp1-signal-melody": "ORG 0\nEntry: AKO Score\nABS Cursor\nPlay: LIA Cursor\nP2A 0\nVZG 120\nLDA Cursor\nVGL Last\nSPB Done\nADD One\nABS Cursor\nSPU Play\nDone: AKO 0\nP2A 0\nHLT 0\nCursor: DATA 0\nOne: DATA 1\nLast: DATA 35\nORG 30\nScore: DATA 5\nDATA 0\nDATA 8\nDATA 8\nDATA 0\nDATA 3\n",
    "cp1-twin-samples": "ORG 0\nEntry: AKO 0\nABS SampleA\nABS SampleB\nP2A 5\nFirst: P1E 2\nVGL Zero\nSPB Release\nLDA SampleA\nADD One\nVKL Five\nSPB KeepA\nAKO 0\nKeepA: ABS SampleA\nVZG 45\nSPU First\nRelease: P1E 2\nVGL One\nSPB Second\nSPU Release\nSecond: P1E 5\nVGL Zero\nSPB Test\nLDA SampleB\nADD One\nVKL Five\nSPB KeepB\nAKO 0\nKeepB: ABS SampleB\nVZG 45\nSPU Second\nTest: LDA SampleA\nVGL SampleB\nSPB Same\nAKO 0\nSPU Report\nSame: AKO 1\nReport: P2A 5\nANZ 0\nHLT 0\nSampleA: DATA 0\nSampleB: DATA 0\nZero: DATA 0\nOne: DATA 1\nFive: DATA 5\n",
    "cp1-wide-tile-count": "ORG 0\nEntry: AKO 9\nABS Remaining\nAKO 0\nABS High\nABS Low\nAddBundle: LDA Low\nVGR Headroom\nSPB Carry\nADD Bundle\nSPU SaveLow\nCarry: LDA High\nADD One\nABS High\nLDA Low\nSUB Wrap\nSaveLow: ABS Low\nLDA Remaining\nSUB One\nABS Remaining\nVGL Zero\nSPB Done\nSPU AddBundle\nDone: LDA High\nANZ 0\nVZG 200\nLDA Low\nANZ 0\nVZG 200\nHLT 0\nHigh: DATA 0\nLow: DATA 0\nRemaining: DATA 0\nBundle: DATA 73\nHeadroom: DATA 182\nWrap: DATA 183\nZero: DATA 0\nOne: DATA 1\n",
    "cp1-beacon-code": "ORG 0\nEntry: AKO 0\nP2A 2\nVZG 70\nAKO Pattern\nABS Cursor\nEmit: AKO 1\nP2A 2\nLIA Cursor\nVGL Long\nSPB HoldLong\nVZG 70\nSPU Gap\nHoldLong: VZG 210\nGap: AKO 0\nP2A 2\nVZG 70\nLDA Cursor\nVGL Last\nSPB Done\nADD One\nABS Cursor\nSPU Emit\nDone: HLT 0\nCursor: DATA 0\nOne: DATA 1\nLong: DATA 3\nLast: DATA 33\nORG 30\nPattern: DATA 1\nDATA 3\nDATA 3\nDATA 1\n",
    "cp1-conveyor-controller": "ORG 0\nEntry: AKO 0\nP2A 1\nP2A 2\nABS Mode\nRequest: P1E 0\nVGL Three\nSPB End\nVGR Two\nSPB Request\nVGL Mode\nSPB Release\nABS NextMode\nAKO 0\nP2A 1\nLDA NextMode\nABS Mode\nVGL Zero\nSPB Release\nVZG 40\nLDA Mode\nSUB One\nP2A 2\nAKO 1\nP2A 1\nRelease: P1E 0\nVGL Idle\nSPB Request\nSPU Release\nEnd: AKO 0\nP2A 1\nABS Mode\nHLT 0\nMode: DATA 0\nNextMode: DATA 0\nIdle: DATA 255\nZero: DATA 0\nOne: DATA 1\nTwo: DATA 2\nThree: DATA 3\n",
    "cp1-gate-tally": "ORG 0\nEntry: AKO 1\nABS Tally\nRequest: P1E 0\nVGL Finish\nSPB Done\nVGL ACode\nSPB First\nVGL BCode\nSPB First\nSPU Request\nFirst: ABS Sensor\nReleaseFirst: P1E 0\nVGL Idle\nSPB Second\nSPU ReleaseFirst\nSecond: P1E 0\nVGL Finish\nSPB Done\nVGL ACode\nSPB Judge\nVGL BCode\nSPB Judge\nSPU Second\nJudge: VGL Sensor\nSPB ReleaseRound\nLDA Sensor\nVGL ACode\nSPB Enter\nLDA Tally\nVGL Zero\nSPB Report\nSUB One\nSPU Report\nEnter: LDA Tally\nVGL Four\nSPB Report\nADD One\nReport: ABS Tally\nANZ 0\nReleaseRound: P1E 0\nVGL Idle\nSPB Request\nSPU ReleaseRound\nDone: LDA Tally\nHLT 0\nTally: DATA 0\nSensor: DATA 0\nACode: DATA 254\nBCode: DATA 253\nFinish: DATA 251\nIdle: DATA 255\nZero: DATA 0\nOne: DATA 1\nFour: DATA 4\n",
    "cp1-number-drill": "ORG 0\nEntry: AKO 5\nABS First\nAKO 2\nABS Second\nAKO 0\nABS Score\nABS Round\nQuestion: LDA First\nANZ 0\nVZG 200\nLDA Second\nANZ 0\nVZG 200\nADD First\nABS Answer\nRequest: P1E 0\nVGL Idle\nSPB Request\nVGL Answer\nSPB Right\nAKO 0\nP2A 1\nSPU Count\nRight: AKO 1\nP2A 1\nLDA Score\nADD One\nABS Score\nCount: LDA Round\nADD One\nABS Round\nVGL Three\nSPB Done\nLDA First\nADD Two\nABS First\nLDA Second\nADD Three\nABS Second\nRelease: P1E 0\nVGL Idle\nSPB Question\nSPU Release\nDone: LDA Score\nANZ 0\nHLT 0\nFirst: DATA 0\nSecond: DATA 0\nRound: DATA 0\nScore: DATA 0\nAnswer: DATA 0\nIdle: DATA 255\nOne: DATA 1\nTwo: DATA 2\nThree: DATA 3\n",
    "cp1-pulse-bench": "ORG 0\nEntry: AKO 0\nABS Pulses\nArm: P1E 5\nVGL One\nSPB Fall\nSPU Arm\nFall: P1E 5\nVGL Zero\nSPB Release\nSPU Fall\nRelease: P1E 5\nVGL One\nSPB Count\nSPU Release\nCount: LDA Pulses\nADD One\nABS Pulses\nANZ 0\nVGL Five\nSPB Done\nSPU Fall\nDone: HLT 0\nPulses: DATA 0\nZero: DATA 0\nOne: DATA 1\nFive: DATA 5\n",
    "cp1-pulse-stretcher": "ORG 0\nEntry: AKO 0\nABS Count\nP2A 4\nArm: P1E 6\nVGL One\nSPB Fall\nSPU Arm\nFall: P1E 6\nVGL Zero\nSPB Trigger\nSPU Fall\nTrigger: AKO 1\nP2A 4\nVZG 200\nAKO 0\nP2A 4\nLDA Count\nADD One\nABS Count\nVGL Two\nSPB Done\nSPU Arm\nDone: HLT 0\nCount: DATA 0\nZero: DATA 0\nOne: DATA 1\nTwo: DATA 2\n",
    "cp1-ring-selector": "ORG 0\nEntry: AKO 4\nABS Index\nSelect: P1E 0\nVGR Five\nSPB Select\nABS Target\nShow: LDA Index\nADD LampsStart\nABS Cursor\nLIA Cursor\nP2A 0\nVZG 75\nLDA Index\nVGL Target\nSPB Done\nADD One\nVKL Six\nSPB Keep\nAKO 0\nKeep: ABS Index\nSPU Show\nDone: HLT 0\nIndex: DATA 0\nTarget: DATA 0\nCursor: DATA 0\nOne: DATA 1\nFive: DATA 5\nSix: DATA 6\nLampsStart: DATA 40\nORG 40\nLamps: DATA 1\nDATA 2\nDATA 4\nDATA 8\nDATA 16\nDATA 32\n",
    "cp1-studio-annunciator": "ORG 0\nEntry: P1E 0\nVGR Three\nSPB Blank\nADD TableStart\nABS Cursor\nLIA Cursor\nSPU Show\nBlank: AKO 0\nShow: P2A 0\nHLT 0\nThree: DATA 3\nTableStart: DATA 20\nCursor: DATA 0\nORG 20\nMasks: DATA 1\nDATA 4\nDATA 16\nDATA 64\n",
    "cp1-yard-dispatch": "ORG 0\nEntry: AKO 0\nP2A 2\nP2A 3\nRequest: P1E 0\nVGR Three\nSPB Request\nABS Command\nAKO 0\nP2A 2\nP2A 3\nLDA Command\nVGL Three\nSPB Done\nVGL Two\nSPB Release\nP2A 1\nVZG 120\nLDA Command\nVGL Zero\nSPB OpenA\nAKO 1\nP2A 3\nSPU Release\nOpenA: AKO 1\nP2A 2\nRelease: P1E 0\nVGL Idle\nSPB Request\nSPU Release\nDone: HLT 0\nCommand: DATA 0\nZero: DATA 0\nTwo: DATA 2\nThree: DATA 3\nIdle: DATA 255\n",
    "cp1-cp2-sample-logger": "ORG 0\nEntry: AKO RecordA\nABS Cursor\nAKO 0\nABS Total\nWait: P3E 8\nVGL Zero\nSPB Read\nSPU Wait\nRead: P3E 0\nVGR Max\nSPB Release\nAIS Cursor\nADD Total\nABS Total\nLDA Cursor\nVGL Last\nSPB Done\nADD One\nABS Cursor\nRelease: P3E 8\nVGL One\nSPB Wait\nSPU Release\nDone: LDA Total\nANZ 0\nHLT 0\nCursor: DATA 0\nZero: DATA 0\nOne: DATA 1\nMax: DATA 63\nLast: DATA 147\nORG 144\nRecordA: DATA 0\nRecordB: DATA 0\nRecordC: DATA 0\nRecordD: DATA 0\nTotal: DATA 0\n",
    "cp1-edge-trigger-capture": "ORG 0\nEntry: AKO 0\nP2A 1\nFirst: P1E 0\nVKL Mark\nSPB StartHistory\nVZG 50\nSPU First\nStartHistory: ABS BeforeA\nVZG 50\nSecond: P1E 0\nVKL Mark\nSPB Seed\nSPU First\nSeed: ABS BeforeB\nPoll: VZG 50\nRead: P1E 0\nVKL Mark\nSPB Roll\nABS Trigger\nAKO 1\nP2A 1\nVZG 50\nPostA: P1E 0\nABS AfterA\nVZG 50\nPostB: P1E 0\nABS AfterB\nLDA Trigger\nANZ 0\nHLT 0\nRoll: ABS Next\nLDA BeforeB\nABS BeforeA\nLDA Next\nABS BeforeB\nSPU Poll\nBeforeA: DATA 0\nBeforeB: DATA 0\nTrigger: DATA 0\nAfterA: DATA 0\nAfterB: DATA 0\nNext: DATA 0\nMark: DATA 128\n",
    "cp1-fixed-point-filter": "ORG 0\nEntry: AKO 0\nABS Filtered\nABS Count\nRead: P1E 0\nVGR Max\nSPB Clip\nSPU Mix\nClip: LDA Max\nMix: ADD Filtered\nADD Filtered\nADD Filtered\nABS Residue\nAKO 0\nABS Quotient\nDivide: LDA Residue\nVKL Four\nSPB Publish\nSUB Four\nABS Residue\nLDA Quotient\nADD One\nABS Quotient\nSPU Divide\nPublish: LDA Quotient\nABS Filtered\nP2A 0\nANZ 0\nVZG 150\nLDA Count\nADD One\nABS Count\nVGL Four\nSPB Done\nSPU Read\nDone: LDA Filtered\nHLT 0\nFiltered: DATA 0\nCount: DATA 0\nResidue: DATA 0\nQuotient: DATA 0\nOne: DATA 1\nFour: DATA 4\nMax: DATA 63\n",
    "cp1-serial-receive": "ORG 0\nEntry: AKO 0\nABS Received\nABS Count\nABS Parity\nABS Valid\nWaitStrobeLow: P1E 2\nVGL Zero\nSPB ReadBit\nSPU WaitStrobeLow\nReadBit: P1E 1\nABS Incoming\nVGL Zero\nSPB Fold\nLDA Parity\nNEG 0\nABS Parity\nFold: LDA Count\nVGL Eight\nSPB Ack\nLDA Received\nADD Received\nADD Incoming\nABS Received\nAck: AKO 0\nP2A 3\nWaitStrobeHigh: P1E 2\nVGL One\nSPB ReleaseAck\nSPU WaitStrobeHigh\nReleaseAck: AKO 1\nP2A 3\nLDA Count\nVGL Eight\nSPB Check\nADD One\nABS Count\nSPU WaitStrobeLow\nCheck: LDA Parity\nVGL Zero\nSPB Good\nAKO 0\nSPU Report\nGood: AKO 1\nABS Valid\nLDA Received\nReport: ANZ 0\nHLT 0\nReceived: DATA 0\nCount: DATA 0\nParity: DATA 0\nValid: DATA 0\nIncoming: DATA 0\nZero: DATA 0\nOne: DATA 1\nEight: DATA 8\n",
    "cp1-serial-transmit": "ORG 0\nEntry: AKO Weights\nABS Cursor\nLDA Payload\nABS Remaining\nAKO 0\nABS Parity\nBit: LIA Cursor\nABS Weight\nLDA Remaining\nVKL Weight\nSPB ZeroBit\nSUB Weight\nABS Remaining\nLDA Parity\nNEG 0\nABS Parity\nAKO 1\nSPU Send\nZeroBit: AKO 0\nSend: P2A 1\nAKO 0\nP2A 2\nWaitAckLow: P1E 3\nVGL Zero\nSPB ReleaseClock\nSPU WaitAckLow\nReleaseClock: AKO 1\nP2A 2\nWaitAckHigh: P1E 3\nVGL One\nSPB Advance\nSPU WaitAckHigh\nAdvance: LDA Cursor\nVGL EndSlot\nSPB Done\nADD One\nABS Cursor\nVGL EndSlot\nSPB SendParity\nSPU Bit\nSendParity: LDA Parity\nSPU Send\nDone: LDA Payload\nHLT 0\nPayload: DATA 173\nCursor: DATA 0\nRemaining: DATA 0\nWeight: DATA 0\nParity: DATA 0\nZero: DATA 0\nOne: DATA 1\nEndSlot: DATA 72\nORG 64\nWeights: DATA 128\nDATA 64\nDATA 32\nDATA 16\nDATA 8\nDATA 4\nDATA 2\nDATA 1\nDATA 0\n"
});

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
    clear
    go to x: 0 y: 0
    pen down
    set pen size to 5
    
  WHEN space key pressed:
    REPEAT 72:
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
  WHEN flag clicked:
    set size to 60
    set score to 0
    set px to 0
    set py to 0
    set dx to 10
    set dy to 0
    go to x: px y: py
    show

  WHEN up arrow key pressed:
    set dx to 0
    set dy to 10
  WHEN down arrow key pressed:
    set dx to 0
    set dy to -10
  WHEN left arrow key pressed:
    set dx to -10
    set dy to 0
  WHEN right arrow key pressed:
    set dx to 10
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
  WHEN flag clicked:
    set size to 45
    set foodx to -150
    set foody to 100
    go to x: foodx y: foody
    show

  WHEN flag clicked:
    FOREVER:
      IF touching Snake THEN:
        change score by 1
        change foodx by 130
        IF foodx > 180 THEN:
          set foodx to -180
        change foody by 90
        IF foody > 150 THEN:
          set foody to -150
        go to x: foodx y: foody
        wait 0.4 seconds`,

    snake_pro: `# Growing-tail Snake — showcases clones, compound conditions, REPEAT UNTIL, and
# explicit GLOBAL scoping. The body is a trail of Body clones, each living for
# 'length' steps, so the tail grows by 2 every time the apple is eaten.
GLOBAL score
GLOBAL length
GLOBAL alive
GLOBAL hx
GLOBAL hy

SPRITE Head:
  WHEN flag clicked:
    set size to 25
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
  WHEN flag clicked:
    set size to 25
    hide

  WHEN I receive "grow":
    go to x: hx y: hy
    create clone of myself

  WHEN I start as a clone:
    show
    set life to length
    REPEAT UNTIL life < 1:
      change life by -1
      wait 0.15 seconds
    delete this clone

SPRITE Apple:
  WHEN flag clicked:
    set size to 20
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
  WHEN flag clicked:
    set size to 70
    set score to 0
    set lives to 3
    show
  WHEN flag clicked:
    FOREVER:
      go to x: mouse x y: -160

SPRITE Ball:
  WHEN flag clicked:
    set size to 40
    set bx to 0
    set by to -120
    set vx to 4
    set vy to 5
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
      wait 0.01 seconds

SPRITE Brick:
  WHEN flag clicked:
    set size to 45
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

    bomberman: `# Bomberman-lite — grid movement with wall collision, bombs (clones) that
# explode on a timer and destroy crates and enemies.
GLOBAL score
GLOBAL bombx
GLOBAL bomby

SPRITE Player:
  WHEN flag clicked:
    set size to 32
    set score to 0
    set px to -180
    set py to 140
    go to x: px y: py
    show

  WHEN up arrow key pressed:
    change py by 40
    go to x: px y: py
    IF touching Wall THEN:
      change py by -40
      go to x: px y: py
  WHEN down arrow key pressed:
    change py by -40
    go to x: px y: py
    IF touching Wall THEN:
      change py by 40
      go to x: px y: py
  WHEN left arrow key pressed:
    change px by -40
    go to x: px y: py
    IF touching Wall THEN:
      change px by 40
      go to x: px y: py
  WHEN right arrow key pressed:
    change px by 40
    go to x: px y: py
    IF touching Wall THEN:
      change px by -40
      go to x: px y: py

  WHEN space key pressed:
    set bombx to px
    set bomby to py
    broadcast "drop" and wait

SPRITE Bomb:
  WHEN flag clicked:
    set size to 30
    hide
  WHEN I receive "drop":
    go to x: bombx y: bomby
    create clone of myself
  WHEN I start as a clone:
    set size to 30
    show
    wait 2 seconds
    set size to 95
    change color effect by 80
    wait 0.4 seconds
    delete this clone

SPRITE Wall:
  WHEN flag clicked:
    set size to 40
    hide
    set wx to -200
    REPEAT 11:
      go to x: wx y: 170
      create clone of myself
      go to x: wx y: -170
      create clone of myself
      change wx by 40
  WHEN I start as a clone:
    show

SPRITE Crate:
  WHEN flag clicked:
    set size to 32
    hide
    set cx to -100
    REPEAT 6:
      go to x: cx y: 40
      create clone of myself
      change cx by 50
  WHEN I start as a clone:
    show
  WHEN I start as a clone:
    FOREVER:
      IF touching Bomb THEN:
        change score by 1
        delete this clone

SPRITE Enemy:
  WHEN flag clicked:
    set size to 32
    set ex to 160
    set ey to -120
    go to x: ex y: ey
    show
  WHEN flag clicked:
    FOREVER:
      change ex by pick random -20 to 20
      change ey by pick random -20 to 20
      go to x: ex y: ey
      IF touching Bomb THEN:
        say "hit" for 0.5 seconds
        hide
        stop this script
      wait 0.3 seconds`,

    tetris: `# Tetris (simplified) — a 2x2 block falls into a 10x16 grid stored in a list,
# rows clear when full. Showcases custom blocks (with args), a list-as-2D-grid,
# computed indices, and pen rendering. Left/Right arrows move; gravity is automatic.
GLOBAL score
GLOBAL pr
GLOBAL pc
GLOBAL cell
GLOBAL canmove
GLOBAL r
GLOBAL c
GLOBAL j
GLOBAL tmp

SPRITE Game:
  LIST board

  DEFINE FAST reset board:
    delete all of board
    set r to 1
    REPEAT 160:
      add 0 to board
      change r by 1

  DEFINE set cell (row) (col) to (v):
    replace item ((row * 10) + col) + 1 of board with v

  DEFINE read cell (row) (col):
    set cell to item ((row * 10) + col) + 1 of board

  DEFINE check fit (row) (col):
    set canmove to 1
    IF col < 0 or col > 8 or row > 14 THEN:
      set canmove to 0
    IF canmove = 1 THEN:
      read cell row col
      IF cell > 0 THEN:
        set canmove to 0
      read cell row (col + 1)
      IF cell > 0 THEN:
        set canmove to 0
      read cell (row + 1) col
      IF cell > 0 THEN:
        set canmove to 0
      read cell (row + 1) (col + 1)
      IF cell > 0 THEN:
        set canmove to 0

  DEFINE lock piece:
    set cell pr pc to 1
    set cell pr (pc + 1) to 1
    set cell (pr + 1) pc to 1
    set cell (pr + 1) (pc + 1) to 1

  DEFINE FAST clear full lines:
    set r to 15
    REPEAT 16:
      set c to 0
      set tmp to 0
      REPEAT 10:
        read cell r c
        IF cell > 0 THEN:
          change tmp by 1
        change c by 1
      IF tmp = 10 THEN:
        set j to r
        REPEAT UNTIL j < 1:
          set c to 0
          REPEAT 10:
            read cell (j - 1) c
            set cell j c to cell
            change c by 1
          change j by -1
        change score by 1
      change r by -1

  DEFINE FAST render:
    clear
    set r to 0
    REPEAT 16:
      set c to 0
      REPEAT 10:
        read cell r c
        IF cell > 0 THEN:
          go to x: (-90) + (c * 20) y: (150) - (r * 20)
          stamp
        change c by 1
      change r by 1
    go to x: (-90) + (pc * 20) y: (150) - (pr * 20)
    stamp
    go to x: (-90) + ((pc + 1) * 20) y: (150) - (pr * 20)
    stamp
    go to x: (-90) + (pc * 20) y: (150) - ((pr + 1) * 20)
    stamp
    go to x: (-90) + ((pc + 1) * 20) y: (150) - ((pr + 1) * 20)
    stamp

  WHEN flag clicked:
    set size to 55
    hide
    reset board
    set score to 0
    set pr to 0
    set pc to 4
    render
    FOREVER:
      check fit (pr + 1) pc
      IF canmove = 1 THEN:
        change pr by 1
      ELSE:
        lock piece
        clear full lines
        set pr to 0
        set pc to 4
        check fit pr pc
        IF canmove = 0 THEN:
          say "Game Over" for 2 seconds
          stop all
      render
      wait 0.3 seconds

  WHEN left arrow key pressed:
    check fit pr (pc - 1)
    IF canmove = 1 THEN:
      change pc by -1
      render
  WHEN right arrow key pressed:
    check fit pr (pc + 1)
    IF canmove = 1 THEN:
      change pc by 1
      render`
};

export default examples;
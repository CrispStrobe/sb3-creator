const examples = {
    game: `SPRITE Player:
  WHEN flag clicked:
    go to x: 0 y: -150
    set health to 100
    set score to 0
    set game active to true
    show
    
  WHEN left arrow key pressed:
    IF game active = true THEN:
      change x by -20

  WHEN right arrow key pressed:
    IF game active = true THEN:
      change x by 20

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
          change speed by 0.5
        IF touching Player THEN:
          change health by -10
          go to x: 0 y: 180

STAGE:
  WHEN flag clicked:
    FOREVER:
      IF health < 1 THEN:
        set game active to false
        say Game Over! Final Score: for 2 seconds
        say score for 3 seconds
        stop all`,

    art: `SPRITE Pen:
  WHEN flag clicked:
    clear
    go to x: 0 y: 0
    pen down
    set size to 5
    
  WHEN space key pressed:
    REPEAT 72:
      move 150 steps
      turn left 175 degrees
      
  WHEN c key pressed:
    clear`,

    physics: `SPRITE Ball:
  WHEN flag clicked:
    go to x: -200 y: 150
    set y_velocity to 0
    set gravity to -1
    set bounce to -0.7
    
  WHEN flag clicked:
    FOREVER:
      change y_velocity by gravity
      change y by y_velocity
      
      IF y < -170 THEN:
        set y to -170
        set y_velocity to y_velocity * bounce`,

    educational: `SPRITE Teacher:
  WHEN flag clicked:
    set score to 0
    say Welcome to the Math Quiz! for 2 seconds
    
    set num1 to 5
    set num2 to 7
    ask What is num1 + num2? and wait
    IF answer = num1 + num2 THEN:
      say Correct! for 1 second
      change score by 1
    ELSE:
      say Wrong! The answer was 12. for 2 seconds

    set num1 to 8
    set num2 to 4
    ask What is num1 * num2? and wait
    IF answer = num1 * num2 THEN:
      say Correct! for 1 second
      change score by 1
    ELSE:
      say Wrong! The answer was 32. for 2 seconds

    say Your final score is for 2 seconds
    say score for 3 seconds
    stop all`
};

export default examples;
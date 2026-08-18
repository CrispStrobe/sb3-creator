# 61-console-pong — expected behaviour

- A single pixel (the ball) bounces around the 8-wide × 16-tall
  playfield; a 3-pixel paddle sits on the bottom line.
- S2 (P3.2) moves the paddle left, S3 (P3.3) right, clamped to the
  field.
- Ball touching the paddle plane over the paddle: bounces up, score
  +1 (wraps at 9), short beep. Reaching the bottom otherwise: long
  beep, ball and score reset.
- The score shows on the FIRST 7-seg digit; its segments are the same
  eight wires as the matrix scan bus — the scan script interleaves a
  digit phase after the sixteen matrix lines.
- Circuit is byte-identical to 60-retro-console: same bench, new
  firmware — the socketed-chip story.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```

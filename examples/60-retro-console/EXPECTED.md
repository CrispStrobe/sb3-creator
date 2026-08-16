# 60-retro-console — expected behaviour

- A lit bar sweeps column by column down the upper matrix, then the
  lower one (the 16×8 playfield), repeating twice per cycle.
- Each of the three 7-segment digits then shows an 8 (all segments
  except dp) for 0.15 s in turn — the segments are the SAME nets as
  the matrix row bus; only the digit selects (P2.3/P2.5/P4.2,
  active-low commons) decide who displays.
- Holding any of the five buttons (P3.0/P3.2/P3.3/P3.7/P3.6, to GND,
  internal pull-ups) sounds the buzzer: P5.5 LOW turns the S8550-class
  PNP on, high-side, speaker to GND.
- Wiring is the transcription in docs/RETRO-CONSOLE-RBS15667.md (stc
  repo). Column order within each matrix half is PROVISIONAL until
  continuity-tested on the physical kit; row-bus order likewise.
- Silicon claim: none yet. This example is the flash candidate for the
  first verified-on-hardware milestone.

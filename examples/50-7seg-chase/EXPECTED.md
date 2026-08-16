# Expected behavior
- On run, exactly one segment lights at a time, walking a→b→c→d→e→f at ~0.15 s per step, then g blinks for 0.3 s; repeat.
- The face reads real per-segment brightness (board.sevenSegmentBrightness): during each step exactly one of a..g is >0.3, the rest ~0.
- Pin panel: P0.0..P0.6 pulse in sequence.

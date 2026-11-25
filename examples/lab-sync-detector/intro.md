# The synchronous detector: a station mixed with itself

A mixer multiplies two signals. Feed it the same AM station on both inputs and it multiplies the carrier by itself, in step: every half-wave comes out with the same sign, and what is left is the strength of the carrier — the programme. No diode does the detecting here.

**Teaches:** synchronous (product) detection, mixing a signal with itself

## What to do

Click **Sim** and listen. Then open the **SYNC** switch and listen again.

## What you should see

- SYNC closed: the station's 1 kHz tone in the loudspeaker.
- SYNC open: silence. The mixer's second input has nothing, and alone the first input cannot reach the output.

## Why it works

The tuned circuit picks out the station. Its coupling winding gives the mixer a small copy, and the top of the tuned circuit gives the switching input a large copy. The large one switches the mixer at exactly the carrier's rhythm, so the small one is "turned over" every negative half-wave: the output is like a full-wave rectifier's. Its average is the carrier's strength, and that rises and falls with the tone. Radios called this a synchronous detector; it distorts less than a diode with weak signals.

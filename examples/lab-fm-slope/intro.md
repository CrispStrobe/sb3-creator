# Hearing FM on the slope of a tuned circuit

An FM station never changes its strength: it swings its frequency with the sound, here 75 kHz either side of 98 MHz in step with a 1 kHz tone. A diode detector only sees strength — unless the tuned circuit in front of it is set a little beside the station. Then the carrier sits on the slope of the resonance curve, and every swing of frequency becomes a swing of size.

**Teaches:** frequency modulation, the resonance curve, FM-to-AM conversion (slope detection)

## What to do

Click **Sim** and listen. The tuning pot sets the varicap's reverse voltage and so the circuit's resonance. Try 0.46 (beside the station), 0.48 (right on it) and 0.40 (far away).

## What you should see

- At 0.46 the tank is tuned about 0.9 MHz below the station: the 1 kHz tone is clearly there.
- At 0.48 the tank sits almost on the station: the tone gets much weaker, because the top of the curve is flat.
- At 0.40 the tank is several MHz away: silence.
- The RF at the tank hardly changes while the tone comes and goes: the station's strength is constant, only where it sits on the curve matters.

## Why it works

The coil and the varicap form a resonant circuit near 100 MHz; the varicap's capacitance falls as its reverse voltage rises, so the pot tunes it. On the steep part of the resonance curve, a frequency a little closer to the peak gives a bigger RF voltage, a little further away a smaller one. The FM swing therefore makes the RF voltage at the tank rise and fall with the sound, and the germanium diode recovers that, exactly as in a medium-wave receiver. Real FM receivers use a better trick (a discriminator) because the slope is neither straight nor immune to noise, but the idea is the same.

# Speak into the speaker: your voice bends the tone

A loudspeaker works backwards too. Sound pushes its cone, the coil moves in the magnet's field and a tiny voltage appears. Amplify it and feed it to an oscillator's control input, and your voice makes the oscillator's pitch wobble.

**Teaches:** speaker as microphone, microphone sensitivity, frequency modulation

## What to do

Click **Sim** and listen to the piezo. In the instruments column, the **Sound** slider sets how loud you speak into the speaker (dB). Pull it to 0, then back up to 94 or 100. Put the scope on the 555 output to see the period.

## What you should see

- Silent: a clean, steady tone of about 680 Hz.
- Speaking: the same average pitch, but it trembles: each period a few percent longer or shorter, following your voice.
- Louder speech, deeper wobble.

## Why it works

The speaker gives only about half a millivolt per pascal, so the LM386 amplifies it two hundred times. That voltage, through a capacitor, adds to the 555's control pin, which sets the thresholds its timing capacitor charges between. Higher threshold, longer period: the tone's frequency follows the voice. Radio's FM works the same way, with a much faster oscillator.

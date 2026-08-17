# 555 audio pulse

The timer oscillates while powered. The buzzer follows the output transitions;
changing the timing capacitor or resistor changes the repetition rate.

```assert
# 555 astable: f = 1.44/((10k+20k)*10uF) = 4.8 Hz
buzzer_tone_hz: 4.8 ± 15%
audio_context: running
```

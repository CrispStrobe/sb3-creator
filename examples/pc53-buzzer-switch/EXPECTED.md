# Switchable buzzer

Closing the button completes the buzzer circuit and opening it silences the
load. The switch is in series with the transducer, so no control code is needed.

```assert
# Buzzer switch: button open -> no current, supply 5V
net src.pos V 5.00 +-0.01
```

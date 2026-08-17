# Diode OR

Activating either input forward-biases its diode and lights the shared LED.
The diodes prevent an active input from feeding backward into the other input.

```assert
# Diode OR: either input drives LED through shared 1k
net vcc.pos V 5.00 +-0.01
```

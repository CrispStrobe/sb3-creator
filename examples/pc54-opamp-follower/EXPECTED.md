# Op-amp follower

The output is fed back to the inverting input. The non-inverting input is set by
the potentiometer, so the output follows the wiper voltage with low output
resistance in the model.

```assert
# Voltage follower: Vout = Vin = pot wiper (default 2.5V)
net pot.wiper V 2.50 +-0.01
net amp.out V 2.50 +-0.01
```

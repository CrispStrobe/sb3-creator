---
level: foundation
age: 11+
prereqs: [cp1-switch-input, cp1-blink]
teaches: [cp1-input, cp1-output, relay, isolated-load, release-to-rearm]
---
## CP4 relay signals

Two channels show how a CP4 relay interface can switch separate loads. CP1 Port 2 drives two transistor stages. Each stage energizes a relay coil and closes a normally open contact. The green entry lamp and red exit lamp draw current from their own battery. Trace the battery loop and the coil loop separately in Circuits.

1. Choose **Use Brickwright monitor**, start the CPU and let it reach the ready display. Both lamps light because the monitor initializes Port 2 high.
2. Pause the CPU, load the supplied CP1 source from address 000, then resume without resetting. Enter **0, 0, 0, PC, RUN** on the keypad. Both lamps go out as the program writes zero to Port 2.
3. In **Circuits**, open **Instruments** and close the `request` switch. The green lamp lights first, then the red lamp, then both go dark. The display follows the output values 1, 2 and 0.
4. Leave the switch closed. The sequence runs once. Open the switch to rearm it, then close it again. In **Code**, find the loop at `rearm` that waits for the input to return high. With a qualified monitor you can step those commands in **Debugger**.

The original CP4 has eight relay channels. This circuit models two with editable 5 V driver stages and a separate 5 V lamp supply. It demonstrates the switching behavior. The original input filters, contact suppression and exact coil supply are outside the model.

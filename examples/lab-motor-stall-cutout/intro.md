# A stalled motor switches its own drive off

A motor whose shaft is blocked draws a large current and can burn out. This circuit measures the motor current, waits a moment to be sure, and then switches the drive off and lights a warning LED until you reset it.

**Teaches:** overcurrent protection, back-EMF, latching circuits

## What to do

Click **Sim** and let the motor run. Then put a heavy load on the motor's shaft (its load torque) for a moment and take it away again. Finally slide the main switch off and on.

## What you should see

- Running normally: the red TRIP LED stays dark.
- Shaft held: after a fraction of a second the TRIP LED lights and the motor stops, and it stays stopped when you let go.
- Main switch off and on: the motor runs again.

## Why it works

A spinning motor works as a generator against its supply, so it draws little current. Stopped, it does not, and the current jumps. The voltage across the small sense resistor charges a capacitor; if the current lasts, the capacitor reaches the latch's firing point. The fired latch pulls its anode low, and with it the drive of the amplifier. It holds itself on until the main switch interrupts its current.

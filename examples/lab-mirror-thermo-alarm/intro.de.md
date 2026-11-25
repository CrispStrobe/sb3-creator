# Stromspiegel als Hitze- und Frostalarm

Zwei gleiche Transistoren, der eine kopiert den Strom des anderen. Wärm einen an oder kühl den anderen ab, und die Kopie stimmt nicht mehr — so sehr, dass ein Alarmton angeht. Wärm beide an, und nichts passiert.

**Vermittelt:** Transistor als Thermometer, Stromspiegel, Driftkompensation

## Was zu tun ist

Klick auf **Sim**. Stell in der Instrumentenspalte den Temperaturregler von Q2 (npn_5) auf Finger (33), dann auf heißes Wasser (70) und zurück auf Raum. Kühl dann Q1 (npn_4) auf Eis (0). Zum Schluss beide in heißes Wasser.

## Was du sehen solltest

- Finger: noch still. Heißes Wasser: nach kurzer Zeit ertönt der Alarm.
- Q1 im Eis: der Alarm ertönt ebenfalls.
- Beide heiß: still.

## Warum es funktioniert

Ein Transistor braucht bei gleichem Strom pro Grad Erwärmung etwa 2 mV weniger Basisspannung. Q1 gibt die Basisspannung für beide vor; ist Q2 wärmer, ist sie für ihn zu groß, und sein Strom wächst um etwa 8 % pro Grad. Seine Kollektorspannung fällt, bis sie den Alarm nicht mehr sperren kann. Es zählt nur der Temperaturunterschied, deshalb bewirkt das Erwärmen der ganzen Schaltung nichts.

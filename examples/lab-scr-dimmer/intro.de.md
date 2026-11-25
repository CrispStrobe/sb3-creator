---
level: advanced
age: 14+
prereqs: [lab-scr-pair]
teaches: [thyristor, phase-angle-control, alternating-current, rc-phase-shift]
---
## Was du siehst
Eine Lampe an Wechsel-Kleinspannung, geschaltet vom Thyristor aus zwei Transistoren, und ein DIMMER-Poti in seinem Gate-Kreis.

## Was du tun kannst
1. Klick auf **Sim**. Die Lampe leuchtet, etwas gedimmt.
2. Dreh **DIMMER** hoch: Die Lampe wird heller. Dreh herunter: dunkler, bis sie bei etwa einem Viertel ausgeht.

## Was passiert hier
Ein Thyristor lässt sich nur einschalten; an Wechselspannung schaltet er sich bei jedem Nulldurchgang selbst aus, weil sein Strom aufhört. Der Gate-Kreis bestimmt, wie weit in jede Halbwelle hinein er wieder zündet. Die Spannung am Kondensator hinkt der Wechselspannung hinterher, und je mehr Widerstand davor liegt, desto später erreicht sie die Zündspannung. Zündet er früh, bekommt die Lampe fast die ganze Halbwelle, zündet er spät, nur ein kleines Stück. So arbeiten Lichtdimmer und Drehzahlsteller.

## Weiter geht's
- [lab-scr-pair](../lab-scr-pair) — der Thyristor an Gleichspannung.
- [lab-scr-flash](../lab-scr-flash) — der Thyristor, gezündet von einem Lichtblitz.

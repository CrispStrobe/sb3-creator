---
level: advanced
age: 14+
prereqs: [lab-pnp-npn-relax]
teaches: [relaxation-oscillator, threshold, battery-monitor, peak-point-current]
---
## Was du siehst
Wieder der PNP-NPN-Blitzer, diesmal an einem einstellbaren Netzteil statt an einer Batterie, und mit einem Einstellknopf im Spannungsteiler, der die Basis des PNP hält. Bei 9 V blitzt die rote LED etwa dreimal pro Sekunde.

## Probier das
1. Klick auf **Sim** und schau den Blitzen zu.
2. Dreh die Versorgungsspannung langsam in Viertelvolt-Schritten herunter und warte nach jedem Schritt kurz. Bei welcher Spannung hört die LED auf?
3. Dreh den Einstellknopf ein wenig herunter. Blitzt es wieder? Wie weit kannst du die Spannung jetzt senken?
4. Stell den Einstellknopf auf 0,8 und die Spannung wieder auf 9 V. Was musst du tun, damit es blitzt?

## Was passiert hier
Der Kondensator lädt sich über einen großen Widerstand auf, und das Paar zündet, wenn er die Basisspannung des PNP überschreitet. Zum Zünden braucht das Paar aber einen kleinen Schubs: ein paar Mikroampere, die in diesem Moment noch in den Kondensator fließen. Dieser Strom kommt aus dem Abstand zwischen Versorgungsspannung und Zündpunkt. Der Teiler legt den Zündpunkt auf einen festen Anteil der Versorgung, also schrumpft der Abstand mit der Spannung – und unterhalb einer bestimmten Spannung reicht er nicht mehr. Der Kondensator kriecht dann bis knapp unter den Zündpunkt und bleibt dort stehen. Ein höherer Anteil am Einstellknopf bedeutet einen kleineren Abstand, also braucht es mehr Volt, bis es blitzt. Stell den Knopf so ein, dass es an einer frischen Batterie gerade noch blitzt und an einer müden aufhört – fertig ist der Batteriewächter.

## Weiter geht's
- [lab-pnp-npn-relax](../lab-pnp-npn-relax) — dasselbe Paar mit festem Teiler und einem Knopf für das Tempo.
- [lab-relax-tone](../lab-relax-tone) — dasselbe Paar, tausendmal schneller: ein Ton.

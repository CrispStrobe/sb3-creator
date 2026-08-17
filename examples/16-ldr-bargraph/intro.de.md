---
level: intermediate
age: 12+
prereqs: [03-night-light]
teaches: [bar-graph, analog-display, threshold-levels]
---
## Was du siehst
Vier LEDs leuchten wie ein Balkendiagramm, das die Raumhelligkeit anzeigt. Bei wenig Licht ist nur eine LED an; bei voller Helligkeit leuchten alle vier. Ein lichtabhängiger Widerstand (LDR) in einem Spannungsteiler speist den ADC des MCU. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das
1. Starte das Programm und bedecke den LDR mit der Hand — beobachte, wie sich die LEDs von rechts nach links ausschalten.
2. Leuchte mit einer Taschenlampe auf den LDR und sieh, wie der Balken auf vier ansteigt.
3. Ändere die Schwellenwerte im Code und beobachte, wie der Balken bei gleichen Lichtverhältnissen anders reagiert.

## Was passiert hier
Der Widerstand des LDR sinkt mit zunehmender Helligkeit, wodurch die Spannung am Teilerpunkt steigt. Der MCU liest diese Spannung mit seinem ADC und vergleicht sie mit drei Schwellenwerten, um zu entscheiden, wie viele LEDs leuchten sollen. Jeder Schwellenwert ist eine Grenze: unter dem ersten eine LED, zwischen erstem und zweitem zwei, und so weiter. Das verwandelt einen kontinuierlichen Analogwert in eine diskrete visuelle Anzeige — dasselbe Prinzip wie bei Signalstärkeanzeigen und Lautstärkemessern.

## Warum das wichtig ist
Einen Analogwert in eine mehrstufige Anzeige umzuwandeln ist ein Muster, das du immer dann brauchst, wenn du einen schnell ablesbaren Indikator ohne Bildschirm benötigst. Batterieanzeigen, Audio-VU-Meter und WLAN-Signalbalken funktionieren alle so.

## Weiter geht's
- [03-night-light](../03-night-light) — die einfachere Version mit nur einem Schwellenwert.
- [17-comparator](../17-comparator) — zwei Analogwerte miteinander vergleichen statt einen gegen feste Schwellenwerte.
- Experiment: Füge eine fünfte LED hinzu und passe die Schwellenwerte an, um eine feinere Anzeige zu erhalten.

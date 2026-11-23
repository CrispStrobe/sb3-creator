---
level: intermediate
age: 12+
prereqs: [pc48-ldr-comparator]
teaches: [window-comparator, open-collector, and-condition]
---
## Was du siehst
Ein Lichtsensor, zwei Komparatoren und eine LED. Die LED leuchtet nur, wenn das Licht „genau richtig" ist — nicht zu dunkel und nicht zu hell.

## Probier das
1. Klick auf **Sim**. Im Dunkeln ist die LED aus.
2. Schieb den Lichtregler langsam hoch. Irgendwann geht die LED an.
3. Weiter hoch. Kurz vor voller Helligkeit geht sie wieder aus.
4. Such beide Schaltpunkte auf dem Regler.

## Was passiert hier
Der lichtabhängige Widerstand und ein fester Widerstand ergeben eine Spannung, die mit dem Licht steigt. Ein Komparator prüft „über der unteren Grenze", der andere „unter der oberen Grenze". Jeder kann die gemeinsame Ausgangsleitung nur nach unten ziehen (offener Kollektor); hoch ist sie nur, wenn keiner zieht — wenn beide Bedingungen zugleich erfüllt sind. Das ist ein UND-Gatter aus zwei Drähten. Mit demselben Trick sortiert man in der Fabrik Teile als „innerhalb der Toleranz".

## Weiter geht's
- [pc48-ldr-comparator](../pc48-ldr-comparator) — ein Komparator, eine Schwelle.
- [lab-2bit-adc](../lab-2bit-adc) — drei Schwellen, umgesetzt in eine Binärzahl.

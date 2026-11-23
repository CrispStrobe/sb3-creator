# Lichtleiter: Biegungen, Schnitte, Farben

Eine rote LED leuchtet in einen Kunststoff-Lichtleiter; am anderen Ende macht ein Fototransistor aus dem Licht wieder eine Spannung. Das Messgerät zeigt, wie viel Licht durchgekommen ist.

**Vermittelt:** Totalreflexion, Biegeverlust, Qualität der Schnittfläche, Dämpfung im Lichtleiter je nach Farbe

## Was zu tun ist

Klick auf **Sim** und lies das Messgerät ab. Dreh den Knopf des Lichtleiters, um die Biegung enger zu machen. Probiere dann im Inspektor: `cutQuality` des Lichtleiters auf 0, die Farbe der LED auf green oder ir, oder einen längeren Lichtleiter (`lengthM`).

## Was du sehen solltest

- Etwa 2,1 V bei der sanften 3-cm-Biegung.
- Eine enge 4-mm-Biegung: etwa 1,1 V. Licht tritt in der Biegung aus.
- Raue Enden: nur etwa 0,26 V.
- Grünes Licht kommt schwächer an als rotes. Infrarot schafft einen halben Meter gut, verschwindet aber über drei Meter fast ganz.

## Warum es funktioniert

Licht, das flach auf die Wand des Lichtleiters trifft, wird vollständig zurückgeworfen und folgt so dem Leiter um Ecken. In einer engen Biegung wird der Winkel zu steil, und etwas Licht tritt aus. Ein rau abgeschnittenes Ende streut das Licht in alle Richtungen. Der Kunststoff selbst schluckt pro Meter etwas Licht, Infrarot viel stärker als Rot.

# Hörgrenze: ein Pfeifen, das aus dem Hörbereich steigt

Zwei Transistoren erzeugen ein sehr hohes Pfeifen, und ein Drehknopf treibt es noch höher, über 20 kHz hinaus. Irgendwo auf dem Weg hörst du es nicht mehr, obwohl die Schaltung weiter pfeift: Das ist die obere Grenze deines Gehörs. Ein Schiebeschalter schaltet einen Kondensator zu, der den ganzen Bereich tiefer legt.

**Vermittelt:** astabiler Transistor-Multivibrator, spannungsgesteuerte Tonhöhe, die obere Hörgrenze

## Was zu tun ist

Klick auf **Sim** und hör am Ohrhörer. Dreh den Tonhöhen-Knopf langsam auf und merk dir, wo der Ton für dich verschwindet. Stell dann den Schiebeschalter um und dreh den Knopf noch einmal.

## Was du sehen solltest

- Der Ton steigt von etwa 12 kHz (Knopf auf 0) bis etwa 22 kHz (Knopf am Anschlag).
- Mit dem zusätzlichen Kondensator reicht er von etwa 5,5 bis 11,6 kHz.

## Warum es funktioniert

Die Transistoren schalten abwechselnd ein. Nach jedem Umschalten wird ein Basiskondensator über einen Widerstand wieder hochgezogen, bis sein Transistor erneut einschaltet. Der Knopf bestimmt die Spannung, zu der diese Widerstände ziehen: höhere Spannung, schnelleres Hochziehen, höherer Ton. Ein größerer Kondensator braucht länger, deshalb ist der Ton tiefer.

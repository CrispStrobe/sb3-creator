# Kapazitiver Füllstandsmesser: ein PLL-Oszillator, ein Glas und eine Leuchtanzeige

Zwei außen auf ein Glas geklebte Folienstreifen bilden einen Kondensator: Je mehr Wasser im Glas, desto größer ist er. Der Oszillator eines PLL-Chips schickt eine Rechteckspannung durch diesen Kondensator; ein Operationsverstärker richtet gleich, was durchkommt, und Schmitt-NAND-Gatter schalten eine grüne „halb“- und eine rote „voll“-LED. Ist das Glas voll, piept ein Verstärkerchip.

**Vermittelt:** kapazitive Füllstandsmessung, ein Präzisionsgleichrichter, Schaltschwellen von Schmitt-Triggern

## Was zu tun ist

Klick auf **Sim**. Schalte die Füllstandsschalter des Glases nacheinander ein (jeder fügt die Kapazität von mehr Wasser hinzu) und wieder aus.

## Was du sehen solltest

- Leer und erste Stufe: beide LEDs dunkel, still.
- Zweite Stufe: Die grüne LED leuchtet.
- Voll: Auch die rote LED leuchtet, und der Piezo piept.

## Warum es funktioniert

Jede Flanke der 1,1-kHz-Rechteckspannung schiebt eine Ladung, die zur Kapazität des Glases passt, durch 22 kΩ. Operationsverstärker 1 mit einer Diode in der Rückkopplung lässt nur die positiven Impulse durch, ohne eine Diodenspannung zu verlieren; 10 kΩ und 220 nF mitteln sie, und Operationsverstärker 2 verstärkt das gegen einen kleinen Versatz. Der Schmitt-Eingang von NAND-Gatter 1 schaltet bei etwa 5,2 V, Gatter 2 sieht die Spannung über einen Teiler und braucht deshalb einen höheren Stand. Der Ausgang von Gatter 2 steuert außerdem einen Transistor, der den Kondensator des LM386-Piepers auf 0 V hält, bis das Glas voll ist.

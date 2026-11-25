# Kontaktprellen: ein Zähler zählt einen Tastendruck mehrfach

Drück einmal auf den Taster, und der Zähler springt um vier weiter. Die Kontakte im Taster prellen ein paar Tausendstelsekunden lang, zu schnell zum Sehen, aber nicht zu schnell für einen Zähler. Ein zweiter Taster zeigt, wie man das zähmt.

**Vermittelt:** Kontaktprellen, Binärzähler, Entprellen mit RC-Glied und Schmitt-Trigger

## Was zu tun ist

Klick auf **Sim**. Drück **BOUNCY** einmal und lass los, und lies die drei LEDs als Binärzahl. Drück **RESET**. Schieb **CLOCK FROM** auf den entprellten Taster und drück **CLEAN** ein paar Mal.

## Was du sehen solltest

- BOUNCY: Ein Druck ergibt 4, das Loslassen 7.
- CLEAN: Jeder Druck zählt genau eins.

## Warum es funktioniert

Wenn Metallkontakte schließen, federn sie innerhalb weniger Millisekunden mehrmals auseinander und wieder zusammen. Jedes Öffnen ist für den Zähler eine fallende Flanke, und er zählt. Der entprellte Taster lädt stattdessen einen Kondensator über einen Widerstand; die kurzen Lücken des Prellens reichen nicht, ihn zu leeren. Ein 555 als Schmitt-Trigger macht aus der langsam steigenden Spannung eine einzige scharfe Flanke.

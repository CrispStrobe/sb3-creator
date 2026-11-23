# Kurzwelle und Mischung: Morsezeichen mit dem eigenen Oszillator hören

Wieder der Rückkopplungsempfänger, aber mit einer Kurzwellenspule: Derselbe Drehkondensator reicht jetzt bis etwa 6 MHz. Ein Sender dort ist eine Morsebake — ein bloßer Träger, ein- und ausgeschaltet, ohne jeden Ton darauf. Ein gewöhnlicher Gleichrichter hört nur leises Knacken. Lass den Empfänger schwingen, und sein eigenes Signal mischt sich mit dem Träger der Bake: Ihre Differenzfrequenz ist ein hörbarer Ton, an bei jedem Punkt und Strich.

**Vermittelt:** Kurzwellenabstimmung, Mischung (Summen- und Differenzfrequenz), Überlagerungsempfang von Morsezeichen

## Was zu tun ist

Klick auf **Sim**. Hör mit dem Rückkopplungsknopf auf 0,85 zu: nichts. Dreh ihn auf 0,75 und hör noch einmal hin, dann warte, bis die Taste losgelassen wird.

## Was du sehen solltest

- Auf 0,85 schwingt der Empfänger nicht: Der Träger der Bake erreicht den Transistor, aber ein gleichbleibender Träger macht keinen Ton.
- Auf 0,75 schwingt er; solange die Taste der Bake gedrückt ist, spielt der Ohrhörer einen Ton von ein paar kHz.
- Wird die Taste losgelassen, verklingt der Ton: Der Empfänger schwingt weiter, aber ohne etwas zum Mischen bleibt er still.

## Warum es funktioniert

Die Basis-Emitter-Strecke des Transistors ist nichtlinear: Bekommt sie zwei Signale zugleich, enthält ihr Strom deren Summe und deren Differenz. Die Summe (12 MHz) führt nirgendwohin, aber die Differenz zwischen der eigenen Schwingung des Empfängers und dem Träger der Bake — ein paar kHz — geht direkt zum Ohrhörer. Stimm ein wenig nach, und die Tonhöhe ändert sich, weil sich die Differenz ändert. So hört jeder Kurzwellenempfänger Morsezeichen (mit einem Überlagerungsoszillator), und mit fester Differenz arbeitet so ein Superhet. Die Antenne ist nur über 20 pF angekoppelt: Bei 6 MHz belastet ein Langdraht an der Spule den Schwingkreis so stark, dass ihn keine Rückkopplung mehr zum Schwingen bringt.

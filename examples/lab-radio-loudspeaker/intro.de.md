# Radio mit Lautsprecher

Ein Detektorempfänger füllt einen Ohrhörer mit der Energie aus der Antenne, aber ein Lautsprecher braucht viel mehr. Setz einen LM386-Audioverstärker zwischen Gleichrichter und Lautsprecher, dann liefert die Batterie die Leistung und der Sender nur noch das Muster.

**Vermittelt:** Gleichrichter plus Leistungsverstärker, warum ein Lautsprecher Leistung braucht, Koppelkondensatoren

## Was zu tun ist

Klick auf **Sim** und hör auf den Lautsprecher. Dreh den Abstimmknopf auf 0,1 für den fernen Sender und auf etwa 0,26 für den Sender mit zwei Tönen.

## Was du sehen solltest

- Den 400-Hz-Ton des Ortssenders, laut.
- Bei 0,1 einen 1-kHz-Ton, viel leiser, der nach dem Drehen noch einen Moment lang etwas leiser wird.
- Bei etwa 0,26 zwei Töne im Wechsel.

## Warum es funktioniert

Das Eingangsteil ist der Detektorempfänger: Spule und Drehkondensator wählen den Sender, die Germaniumdiode und der 2,2-nF-Kondensator gewinnen den Ton zurück. Dieser Ton hat nur einige Zehntel Volt aus einer Quelle, die fast keinen Strom liefern kann. Der LM386 macht ihn zwanzigmal größer und holt den Strom aus der Batterie. Der 100-nF-Kondensator davor und der 220-µF-Kondensator dahinter lassen den Ton durch, sperren aber die Gleichspannungen, sodass Verstärkereingang und Lautsprecher nur die Änderungen sehen.

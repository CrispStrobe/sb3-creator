# Ein MOSFET merkt sich was: Ladung am Gate

Das Gate eines MOSFET ist vom Rest des Transistors isoliert. Bringt man Ladung darauf, bleibt sie dort und hält den Transistor (und eine LED) eingeschaltet, obwohl nichts mehr angeschlossen ist. Das ist eine Speicherzelle, dieselbe Idee wie ein Bit im DRAM, nur viel größer und langsamer.

**Vermittelt:** isoliertes Gate, Ladungsspeicher, Leckstrom und Auffrischen, spannungsgesteuerter Widerstand

## Was zu tun ist

Alles sitzt auf einem Steckbrett. Klick auf **Sim** und halte „Write 1“ eine Sekunde lang gedrückt: Die LED leuchtet. Lass los. Die LED bleibt an, obwohl nichts mehr das Gate speist. Warte und beobachte, wie sie nach 10 bis 20 Sekunden verblasst, weil die Ladung abfließt. Halte „Write 1“ erneut, um sie aufzufrischen, oder „Write 0“, um sie zu löschen. Kurzes Tippen auf einen der Taster verändert die Helligkeit in Stufen.

## Was du sehen solltest

- Die LED bleibt an, nachdem du „Write 1“ losgelassen hast.
- Nach etwa 20 Sekunden ist sie von selbst verblasst.
- „Write 0“ schaltet sie in etwa einer Sekunde aus.

## Warum es funktioniert

Gate und Kondensator bilden zusammen einen kleinen Ladungsspeicher. Der Widerstand mit 1,5 MΩ ist das Leck, das jedes echte Gate hat, hier stark vergrößert, damit du es arbeiten siehst. Echte DRAM-Zellen verlieren ihre Ladung in Millisekunden, deshalb schreibt ein Speicherchip jede Zelle viele Male pro Sekunde neu.

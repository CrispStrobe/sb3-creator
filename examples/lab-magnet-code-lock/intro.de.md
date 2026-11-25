# Ein magnetisches Codeschloss: drei schnelle Nordpol-Durchgänge

Ein Schloss, das sich mit einem Magneten öffnet: Führ seinen Nordpol dreimal schnell hintereinander am Sensor vorbei, und das Schloss öffnet sich mit einem Ton. Ein Südpol dazwischen oder zu langsame Durchgänge, und es bleibt zu.

**Vermittelt:** Hallsensoren, Impulse mit einem Kondensator zählen, Flipflops

## Was zu tun ist

Klick auf **Sim**. Nimm den Feldregler des Hallsensors: Schieb ihn dreimal schnell auf etwa +0,8 und zurück auf 0. Drück LOCK. Probier dann Nord, Nord, Süd (−0,8), Nord; und drei langsame Durchgänge.

## Was du sehen solltest

- Drei schnelle Nordpol-Durchgänge: Die grüne LED leuchtet, und der Ton erklingt.
- Ein Südpol dazwischen: Es bleibt verschlossen.
- Zu langsam: Es bleibt verschlossen.

## Warum es funktioniert

Jeder Nordpol-Durchgang gibt einen Impuls, und jeder Impuls fügt einem Kondensator eine Stufe Ladung hinzu, wie Wasser, das in einen undichten Eimer gegossen wird. Nur drei schnelle Stufen füllen ihn über die Marke; langsame versickern dazwischen, und ein Südpol leert ihn sofort. Wird die Marke überschritten, kippen die Gatter ein Flipflop, das das Schloss offen hält, bis du LOCK drückst.

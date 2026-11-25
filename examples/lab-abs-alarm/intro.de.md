# ABS-Modell: Ein Rad, das stehen bleibt, löst eine Warnung aus

Beim Antiblockiersystem eines Autos überwachen Sensoren jedes Rad; bleibt ein Rad stehen, während das Auto noch fährt, rutscht es. Dieses Modell überwacht ein Rad: Ein Magnet auf der Welle gibt bei jeder Umdrehung einen Impuls, und wenn die Impulse ausbleiben, gehen eine rote LED und ein Warnton an.

**Vermittelt:** Erkennen ausbleibender Impulse, Hallsensoren, Gatter und Oszillatoren

## Was zu tun ist

Klick auf **Sim** und lass das Rad laufen. Belaste dann die Welle des Motors stark (sein Lastmoment), als würdest du sie festhalten, und lass sie wieder los.

## Was du sehen solltest

- Es dreht sich: grüne LED, Stille.
- Festgehalten: Nach wenigen Hundertstelsekunden leuchtet die rote LED, und ein Ton erklingt.
- Losgelassen: wieder grün und still.

## Warum es funktioniert

Jeder Impuls von der Welle schaltet einen Transistor ein, der einen Kondensator entleert. Zwischen den Impulsen lädt sich der Kondensator langsam auf, aber nie weit, weil der nächste Impuls zu früh kommt. Steht das Rad, entleert ihn nichts mehr, und er lädt sich über die halbe Betriebsspannung; der Operationsverstärker schaltet um, die Gatter tauschen die LEDs und geben den Tonoszillator frei.

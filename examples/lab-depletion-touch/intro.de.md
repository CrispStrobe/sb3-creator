# Ein Transistor, der leitet, bis eine Ladung kommt

Die meisten Transistoren sperren, bis man sie einschaltet. Dieser, ein MOSFET vom Verarmungstyp, leitet ohne irgendetwas am Gate: Die LED leuchtet von Anfang an. Bring eine elektrische Ladung in die Nähe seines Gates, und sie geht aus, ganz ohne Berührung.

**Vermittelt:** MOSFETs vom Verarmungstyp, ein isoliertes Gate, das von influenzierter Ladung bewegt wird

## Was zu tun ist

Klick auf **Sim**: Die LED leuchtet. Dreh den Regler an der Feldsonde (eine geladene Fingerspitze) auf, um sie nah ans Gate zu bringen, und wieder zurück. Bring sie dann noch einmal nah heran, drück den Taster (dein Finger verbindet Gate und Source) und lass los, und nimm die Ladung danach weg.

## Was du sehen solltest

- Ladung weit weg: Die LED leuchtet (etwa 3,7 mA).
- Ladung nah: Die LED geht aus. Weggenommen: Sie leuchtet wieder.
- Bei naher Ladung berührt, dann die Ladung weggenommen: Die LED leuchtet heller als vorher und bleibt so.

## Warum es funktioniert

Beim Verarmungs-MOSFET ist der Kanal zwischen Drain und Source schon eingebaut, also fließt Strom, wenn das Gate auf dem Potenzial der Source liegt. Ein negatives Gate drängt die Elektronen aus dem Kanal; unter etwa −1,2 V ist er abgeschnürt. Das Gate ist isoliert: Eine negative Ladung in der Nähe zieht es negativ, ohne dass Strom fließt. Berührt man das Gate, während die Ladung nah ist, füllt es sich auf 0 V auf; geht die Ladung dann weg, bleibt das Gate positiv zurück und öffnet den Kanal noch weiter.

# Ein Thyristor, gezündet von einem Lichtblitz

Ein Thyristor bleibt an, wenn er einmal eingeschaltet wurde. Hier bilden zwei Transistoren einen, und das Einschaltsignal kommt vom Licht: Leuchte kurz auf den Fototransistor, und die LED bleibt an.

**Vermittelt:** Selbsthalteschaltungen, der Thyristor, Zünden durch Licht

## Was zu tun ist

Klick auf **Sim**. Schieb den Lichtregler des Fototransistors kurz auf etwa 0,3 und wieder auf 0. Schalte dann den Hauptschalter aus und wieder ein.

## Was du sehen solltest

- Zuerst dunkel, und ein wenig Licht (0,05) bewirkt nichts.
- Ein Lichtblitz: Die LED geht an und bleibt an, auch im Dunkeln.
- Hauptschalter aus und ein: Die LED ist wieder dunkel bis zum nächsten Blitz.

## Warum es funktioniert

Ist der NPN-Transistor an, zieht er Strom aus der Basis des PNP und schaltet ihn ein; der eingeschaltete PNP speist die Basis des NPN und hält ihn an. Jeder hält den anderen. Der Fototransistor muss dem NPN nur einen Anstoß geben. Um das Paar auszuschalten, muss der Strom durch es kurz unterbrochen werden. Lichtgezündete Thyristoren schalten große Lasten über ein Lichtsignal, ganz ohne elektrische Verbindung zur Steuerung.

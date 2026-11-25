---
level: foundation
age: 11+
prereqs: [cp1-switch-input, cp1-blink]
teaches: [cp1-input, cp1-output, relay, isolated-load, release-to-rearm]
---
## Signale mit CP4-Relais

Zwei Kanäle zeigen, wie eine CP4-Relaisschnittstelle getrennte Lasten schaltet. Port 2 des CP1 steuert zwei Transistorstufen. Jede Stufe zieht ein Relais an und schließt seinen Schließerkontakt. Die grüne Einfahrtlampe und die rote Ausfahrtlampe beziehen ihren Strom aus einer eigenen Batterie. Verfolge in der Schaltungsansicht die Stromkreise von Spulen und Lampen getrennt.

1. **Brickwright-Monitor verwenden** wählen, die CPU starten und die Bereitschaftsanzeige abwarten. Beide Lampen leuchten, weil der Monitor Port 2 beim Start auf High setzt.
2. CPU anhalten, den mitgelieferten CP1-Quelltext ab Adresse 000 laden und ohne Reset weiterlaufen lassen. Am Tastenfeld **0, 0, 0, PC, RUN** eingeben. Beide Lampen erlöschen, da das Programm null an Port 2 ausgibt.
3. In der Schaltungsansicht **Instrumente** öffnen und den Schalter `request` schließen. Zuerst leuchtet Grün, dann Rot, danach erlöschen beide Lampen. Die Anzeige folgt den Ausgabewerten 1, 2 und 0.
4. Den Schalter geschlossen lassen. Die Folge läuft einmal. Den Schalter öffnen, um eine neue Anforderung zu ermöglichen, und erneut schließen. Im **Code** wartet die Schleife bei `rearm` darauf, dass der Eingang wieder High wird. Mit einem unterstützten Monitor lassen sich diese Befehle im **Debugger** einzeln ausführen.

Das ursprüngliche CP4 besitzt acht Relaiskanäle. Diese Schaltung bildet zwei Kanäle mit bearbeitbaren 5-V-Treibern und eigener 5-V-Lampenversorgung nach. Sie zeigt das Schaltverhalten. Originale Eingangsfilter, Kontaktentstörung und genaue Spulenversorgung sind nicht Teil des Modells.

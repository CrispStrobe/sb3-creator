# Ein Oszillator, der sich selbst ein- und ausschaltet

Ein Meißner-Oszillator auf einem Ferritstab erzeugt einen Mittelwellenträger, und ein Detektorempfänger einen halben Meter entfernt hört zu. Ein kleiner Detektor am Sender speist den Komparator LM393. Das Potentiometer stellt die Abschaltschwelle ein. Zwei Schiebeschalter können die Rückkopplungswicklung umpolen.

**Vermittelt:** Rückkopplung, Hüllkurvendetektion, Hysterese, sich selbst unterbrechende Schwingung

## Was zu tun ist

Klick auf **Sim** und warte einige zehn Millisekunden. Dreh dann das **Potentiometer für die Abschaltschwelle** auf etwa 0,05 herunter und hör in den Ohrhörer. Dreh es zurück auf 0,3. Leg zum Schluss **beide Schiebeschalter** um.

## Was du sehen solltest

- Bei 0,3 läuft der Sender gleichmäßig (sein Schwingkreis schwingt mit etwa 9 V); der Empfänger bekommt einen gleichmäßigen Träger, und nach dem Knacken beim Einschalten bleibt der Ohrhörer still.
- Heruntergedreht setzt die Schwingung immer wieder ein und aus — etwa tausendmal pro Sekunde. Der Ohrhörer brummt mit einem Ton bei etwa 1 kHz: Der Träger wurde mit einem Ton getastet.
- Mit umgepolter Wicklung schwingt gar nichts.

## Warum es funktioniert

Bei niedriger Schwelle lädt die Hochfrequenz des Senders den Detektorkondensator. Überschreitet seine Spannung die Schwelle, zieht der LM393 die Transistorvorspannung herunter. Ohne Träger entlädt sich der Kondensator und der Komparator gibt die Vorspannung wieder frei. So beginnt der nächste Impuls. Bei hoher Schwelle bleibt der Komparator offen und der Oszillator schwingt durchgehend. Umgepolt wirkt die Rückkopplung der Schwingung entgegen.

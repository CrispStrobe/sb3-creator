# Ein Oszillator, der sich selbst ein- und ausschaltet

Ein Meißner-Oszillator auf einem Ferritstab erzeugt einen Mittelwellenträger, und ein Detektorempfänger einen halben Meter entfernt hört zu. Die Basis des Transistors wird über die Koppelwicklung aus einem kleinen Speicherkondensator versorgt, den das Vorspannungspoti auflädt. Zwei Schiebeschalter können die Koppelwicklung umpolen.

**Vermittelt:** Phasenbedingung eines Oszillators, Selbstvorspannung, Pendeln (sich selbst unterbrechende Schwingung)

## Was zu tun ist

Klick auf **Sim** und warte einige zehn Millisekunden. Dreh dann das **Vorspannungspoti** auf etwa 0,05 herunter und hör in den Ohrhörer. Dreh es zurück auf 0,3. Leg zum Schluss **beide Schiebeschalter** um.

## Was du sehen solltest

- Bei 0,3 läuft der Sender gleichmäßig (sein Schwingkreis schwingt mit etwa 9 V); der Empfänger bekommt einen gleichmäßigen Träger, und nach dem Knacken beim Einschalten bleibt der Ohrhörer still.
- Heruntergedreht setzt die Schwingung immer wieder ein und aus — etwa neunhundertmal pro Sekunde. Der Ohrhörer brummt mit einem Ton bei etwa 0,9 kHz: Der Träger wurde mit einem Ton getastet.
- Mit umgepolter Wicklung schwingt gar nichts.

## Warum es funktioniert

Während der Schwingung richtet der Basis-Emitter-Übergang die Wechselspannung gleich und lädt den Speicherkondensator negativ auf, was den Transistor zurückregelt. Mit viel Vorspannungsstrom wird der Kondensator so schnell nachgefüllt, wie er entleert wird, und die Schwingung pendelt sich auf eine Größe ein. Mit wenig Vorspannungsstrom wird er schneller entleert als nachgefüllt: Die Schwingung reißt ab, der Kondensator erholt sich langsam, und sie setzt wieder ein. Umgepolt koppelt die Wicklung das Gegenteil dessen zurück, was der Schwingkreis tut, also wird jeder Anfang ausgelöscht.

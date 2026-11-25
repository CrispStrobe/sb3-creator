# Infrarot-Lichtschranke

Ein unsichtbarer Strahl quer durch eine Tür. Geh hindurch, und ein Alarm ertönt — oder, umgedreht, ein Ton zeigt an, dass der Strahl noch da ist.

**Vermittelt:** IR-Lichtschranke, Fototransistor, Tasten eines Oszillators, Invertieren

## Was zu tun ist

Klick auf **Sim**. Dreh den **Knopf** der Lichtstrecke auf 1 (Hand im Strahl) und zurück auf 0. Schieb dann den **Schiebeschalter** nach rechts und wiederhole das.

## Was du sehen solltest

- Links: Stille, bis der Strahl unterbrochen ist, dann der Alarm.
- Rechts: ein Ton, solange der Strahl frei ist, Stille, wenn er unterbrochen ist.

## Warum es funktioniert

Der Fototransistor leitet nur, solange IR-Licht ihn erreicht. Dieser Strom hält einen Transistor eingeschaltet, der den Tongenerator sperrt. Unterbrich das Licht, und der Generator ist frei. Der Inverter-Transistor rechts dreht die Logik um.

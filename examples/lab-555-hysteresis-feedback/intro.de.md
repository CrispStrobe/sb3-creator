# Wie Rückkopplung die Hysterese bestimmt

Ein Transistor und ein 555 ergeben einen Schalter mit einer Lücke zwischen „ein“ und „aus“. Ein Rückkopplungswiderstand vom Ausgang des 555 macht diese Lücke schmaler – und wenn er zu klein wird, fängt der Schalter an zu schwingen.

**Vermittelt:** Hysterese, Rückkopplung, warum zu viel Rückkopplung eine Schaltung schwingen lässt

## Was zu tun ist

Klick auf **Sim**. Dreh EINGANG (potentiometer_3) langsam auf, bis die rote LED leuchtet, dann langsam zurück, bis sie ausgeht. Merk dir beide Stellungen. Dreh RÜCKKOPPLUNG (potentiometer_12) auf die Mitte und wiederhole das, dann auf drei Viertel. Dreh RÜCKKOPPLUNG zum Schluss ganz auf und bewege EINGANG zwischen 0,2 und 0,6.

## Was du sehen solltest

- RÜCKKOPPLUNG auf 0: ein bei etwa 0,39, aus bei etwa 0,25.
- In der Mitte etwa 0,38 und 0,26, bei drei Vierteln etwa 0,35 und 0,28 – die Lücke schließt sich.
- RÜCKKOPPLUNG ganz auf: unter etwa 0,5 flackert die LED sehr schnell, darüber bleibt sie an.

## Warum es funktioniert

Der 555 schaltet seinen Ausgang auf High, wenn sein Eingang unter 3 V fällt, und erst über 6 V wieder auf Low. Der Rückkopplungswiderstand führt ein wenig vom Ausgang zurück zum Eingang – in die falsche Richtung: Geht der Ausgang auf High, hebt er den Eingang Richtung „aus“. Je kleiner der Widerstand, desto größer dieser Schub und desto kleiner die Lücke. Ist der Schub größer als die ganze 3-V-Lücke, löst jedes Umschalten das nächste aus: Es schwingt.

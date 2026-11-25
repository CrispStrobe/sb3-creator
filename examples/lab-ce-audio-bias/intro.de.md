# Musik durch einen Transistor: der Arbeitspunkt

Ein einzelner Transistor verstärkt ein Tonsignal (der Generator steht für einen Musikspieler) in einen Ohrhörer. Das Vorspannungspoti bestimmt, wo der Transistor ruht, wenn kein Signal da ist — und damit, wie viel Platz das Signal nach oben und unten hat. Eine LED neben dem Kollektorwiderstand flackert mit der Musik.

**Vermittelt:** Arbeitspunkt, Begrenzung bei Sperren und Sättigung, Übersteuerung

## Was zu tun ist

Klick auf **Sim** und hör zu. Dreh das **Vorspannungspoti** langsam an beide Enden und zurück in die Mitte. Wähle dann den Generator und erhöhe seine `amplitude` von 0,1 auf 2,5 V.

## Was du sehen solltest

- In der Mitte (etwa 0,8) liegt der Kollektor bei etwa 6 V, und der Ton ist sauber.
- Ganz zurückgedreht steigt der Kollektor gegen 9 V: Der Transistor ist fast gesperrt, eine Hälfte jeder Welle wird flach abgeschnitten — der Ton wird rau.
- Ganz aufgedreht fällt der Kollektor auf etwa 2 V: Der Transistor ist fast gesättigt, und die andere Hälfte wird abgeschnitten.
- Mit einem viel größeren Eingangssignal werden beide Hälften abgeschnitten, egal wie gut der Arbeitspunkt sitzt: Übersteuerung.

## Warum es funktioniert

Der Kollektorstrom folgt dem Basisstrom. Ohne Signal legt die Vorspannung einen Ruhestrom und damit eine Ruhespannung am Kollektor fest. Das Signal kommt dazu und zieht davon ab. Liegt der Ruhepunkt nahe 9 V, kann der Kollektor nicht weiter steigen (der Transistor sperrt); liegt er ganz unten, kann er nicht weiter fallen (Sättigung). In der Mitte passen beide Hälften hinein.

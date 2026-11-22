# Horchverstärker: Millivolt werden hörbar

Ein Lautsprecher funktioniert auch rückwärts: Spricht man hinein, liefert er einige Millivolt. Das ist viel zu wenig zum Hören, deshalb verstärkt diese Schaltung das Signal etwa hundertfach. Ein Knopf stellt die Empfindlichkeit ein, wie bei einem Babyfon. Im Simulator spielt eine kleine 1-kHz-Quelle die Rolle des Lautsprechers.

**Vermittelt:** Wandler funktionieren in beide Richtungen, Spannungsverstärkung, ein Lautstärkeregler als Spannungsteiler, einen Verstärker auf halbe Versorgungsspannung legen

## Was zu tun ist

Klick auf **Sim** und warte eine halbe Sekunde, bis sich der Verstärker eingeschwungen hat. Hör auf den Piezo-Ohrhörer und schau dir den Ausgang auf dem Oszilloskop an. Dreh den Empfindlichkeitsknopf herunter und wieder hoch.

## Was du sehen solltest

- Aus dem leisen Eingang wird ein deutlich hörbarer Ton.
- Knopf auf halbem Weg: etwa 1 V Spitze-Spitze am Ausgang.
- Knopf am Anschlag: etwa doppelt so viel; Knopf herunter: fast nichts.

## Warum es funktioniert

Der Operationsverstärker multipliziert das Signal mit 1 + 100 kΩ / 1 kΩ = 101. Die Kondensatoren lassen den Ton durch, sperren aber Gleichspannung, sodass der Verstärker auf halber Versorgungsspannung sitzen und von dort nach oben und unten ausschlagen kann. Der Knopf teilt das Eingangssignal vor dem Verstärker, genau wie ein Lautstärkeregler.

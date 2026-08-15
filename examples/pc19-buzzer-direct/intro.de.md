---
level: beginner
age: 8+
prereqs: [pc01-led-resistor]
teaches: [series-resistor, voltage-divider, active-buzzer]
---

## Was du siehst

Drei Dinge in einer Schleife: die 5-V-Versorgung, ein Widerstand mit 100 Ohm
und ein Summer. Mehr ist die Schaltung nicht. Kein Chip, kein Programm, nichts
zum Drücken.

## Probier das aus

1. Klick auf **Sim** und miss die Spannung am Pluspol des Summers. Da sollten
   genau **2,5 V** stehen — die halbe Versorgung.
2. Frag dich, warum es genau die Hälfte ist. (Der Summer verhält sich wie ein
   100-Ohm-Widerstand, und darüber sitzt ein 100-Ohm-Widerstand. Zwei gleiche
   Teile teilen sich die 5 V gleichmäßig auf.)
3. Rechne den Strom aus: 5 V an 100 + 100 = 200 Ohm, also 5 ÷ 200 =
   **0,025 Ampere**, das sind **25 Milliampere**.
4. Öffne `circuit.json` und ändere den Widerstand von 100 auf **47** Ohm. Jetzt
   steigt der Anteil des Summers auf etwa 3,4 V und der Strom auf rund 34 mA —
   auf einem echten Tisch: lauter.
5. Probier **1000** Ohm. Der Summer bekommt nur noch etwa 0,45 V und knapp
   4,5 mA. Auf einem echten Tisch: fast nicht mehr zu hören.

## Was dahintersteckt

Es gibt zwei Sorten Summer, und sie auseinanderzuhalten ist der eigentliche
Zweck dieses Beispiels.

Ein **passiver** Summer (oft als Piezo-Element verkauft) ist eine nackte
Scheibe. Gib ihm gleichbleibende Gleichspannung, und er klickt einmal, während
er sich verbiegt, und schweigt danach. Für einen Ton musst du seine Spannung
tausendmal pro Sekunde auf und ab wackeln lassen — das ist Arbeit für einen
Mikrocontroller-Pin oder einen 555-Timer.

Ein **aktiver** Summer hat einen winzigen Oszillator eingebaut. Gib ihm
gleichbleibende Gleichspannung, und er übernimmt das Wackeln selbst. Ein
Anschluss, ein Dauerton, kein Programm. Um diese Sorte geht es hier, und
deshalb kommt die Schaltung ohne Chip aus.

Der Widerstand schützt den Summer nicht wirklich — er ist dein Lautstärkeregler.
Summer und Widerstand teilen sich die 5 V im Verhältnis ihrer Widerstandswerte,
und das ist derselbe Spannungsteiler wie bei zwei Widerständen hintereinander.
Gleiche Werte, gleiche Anteile, daher die glatten 2,5 V. Kleinerer Widerstand
heißt: Der Summer behält mehr und wird lauter. Größerer Widerstand heißt: Er
wird leiser. Schritt 4 und Schritt 5 sind die beiden Enden davon.

## Warum das wichtig ist

Den falschen Summer zu kaufen kostet zuverlässig einen Nachmittag: Du baust
einen aktiven ein und erwartest Stille, bis dein Programm piepen sagt — und er
kreischt schon beim Einschalten los. Oder du baust einen passiven ein, hörst
gar nichts und suchst einen Fehler, den es nicht gibt. Das Bauteil, das du
hast, bestimmt die Schaltung, die du brauchst.

## Wie es weitergeht

- **Als Nächstes:** [pc53-buzzer-switch](../pc53-buzzer-switch) — derselbe
  Summer mit einem Schalter, damit er nicht ständig läuft.
- **Danach:** [07-buzzer-siren](../07-buzzer-siren) — ein *passiver* Summer,
  von einem Programm angesteuert, das eine Tonleiter durchfährt.
- **Zum Ausprobieren:** Welcher Widerstand gäbe dem Summer genau 4 V? (Er
  braucht 4 der 5 Volt, für den Widerstand bleibt 1 V, also muss der Widerstand
  ein Viertel der 100 Ohm des Summers sein — 25 Ohm. Nimm 22, den nächsten
  Normwert, und schau, wie nah du landest.)

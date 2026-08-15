---
level: intermediate
age: 12+
prereqs: [pc17-current-compare, pc04-parallel-leds]
teaches: [additive-colour, parallel-branches, per-channel-resistor]
---

## Was du siehst

Eine rote, eine grüne und eine blaue LED nebeneinander, alle gleichzeitig an.
Rot und Grün haben je einen 330-Ohm-Widerstand, Blau einen mit 470 Ohm. Würdest
du durch ein Stück Transparentpapier auf die drei schauen, sähest du nicht drei
Lichter, sondern ein einziges weißliches.

## Probier das aus

1. Klick auf **Sim**. Alle drei leuchten.
2. Miss die Ströme: Rot **8,8 mA**, Grün **8,8 mA**, Blau **6,3 mA**. Rot und
   Grün stimmen bis zur letzten Stelle überein, weil sie identische Widerstände
   und identische Zweige haben.
3. Mach aus der Mischung eine Farbe, indem du Kanäle wegnimmst. Setz den
   Widerstand im roten Zweig auf etwas Riesiges — 100000 Ohm — und lass es
   laufen. Rot geht aus, übrig bleiben Grün + Blau, also **Cyan**.
4. Stell Rot zurück und nimm stattdessen Blau weg: Rot + Grün ist **Gelb**.
   Nimm Grün weg: Rot + Blau ist **Magenta**.
5. Ändere den blauen Widerstand von 470 auf 330, damit alle drei gleich sind.
   Jetzt läuft jeder Kanal mit 8,8 mA.

## Was dahintersteckt

Licht mischen ist nicht Farbe mischen. Beim Malen mischt man **subtraktiv**:
Jedes Pigment nimmt dem weißen Licht etwas weg, also wird es dunkler, je mehr
man hinzufügt, und Rot plus Grün ergibt ein schlammiges Braun. Licht mischt sich
**additiv**: Jede LED legt ihre Farbe obendrauf, also wird es heller, je mehr
man hinzufügt, und Rot plus Grün ergibt **Gelb**. Rot plus Grün plus Blau ergibt
Weiß.

Deshalb liegen genau diese drei Farben auf dem Brett und nicht drei andere. Dein
Auge hat drei Sorten farbempfindlicher Zellen, ungefähr auf Rot, Grün und Blau
abgestimmt, und jede Farbe, die du siehst, ist eine Kombination daraus, wie
stark diese drei gekitzelt werden. Gib einem Auge die richtigen Mengen von genau
drei Lichtern, und es kann das Ergebnis nicht vom Echten unterscheiden.
Bildschirme arbeiten seit hundert Jahren so.

Womit wir bei den Widerständen wären und dabei, warum der blaue anders ist. Jeder
Zweig ist unabhängig — drei getrennte Wege an derselben Versorgung, kein Teilen —
also hat jeder seinen eigenen Widerstand und seinen eigenen Strom, genau wie in
[pc17-current-compare](../pc17-current-compare). Diese drei Ströme zu wählen
*ist* das Wählen der Farbe. Blau läuft hier absichtlich rund 30 % unter den
anderen beiden: Echte blaue und weiße LEDs geben pro Milliampere mehr sichtbares
Licht ab als rote, und wer alle drei gleich einstellt, bekommt eine Mischung,
die kalt und blaustichig wirkt. Kanalweise nachzujustieren ist der Weg zu einem
Weiß, das auch weiß aussieht.

Schritt 5 macht genau diese Justage rückgängig, damit du siehst, wozu sie da
war.

## Warum das wichtig ist

Jeder Bildschirm, den du besitzt, macht das einige Millionen Mal gleichzeitig.
Jeder adressierbare LED-Streifen auch: Ein NeoPixel ist genau das — drei LEDs in
einem Gehäuse mit einem Chip, der die drei Ströme einstellt — und
`(255, 200, 120)` ist ein Mensch, der drei Zahlen mit derselben Überlegung
wählt, die du gerade angestellt hast.

## Wie es weitergeht

- **Als Nächstes:** [pc44-push-pull-led](../pc44-push-pull-led) — LEDs von
  etwas ansteuern, das sie schalten kann, statt sie dauernd anzulassen.
- **Danach:** [40-led-color-mix](../40-led-color-mix) — dieselbe Mischung unter
  Programmsteuerung, wo sich die drei Stufen mit der Zeit ändern können.
- **Zum Ausprobieren:** Ziel **Orange**. Orange ist Rot mit ein wenig Grün —
  lass Rot bei 330 Ohm und heb Grün auf etwa 1000 an, damit Grün ungefähr ein
  Drittel des roten Stroms bekommt. Dann justiere weiter, bis es aufhört, gelb
  auszusehen.

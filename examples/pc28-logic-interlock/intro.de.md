---
level: intermediate
age: 12+
prereqs: [pc36-series-interlock, pc01-led-resistor]
teaches: [and-gate, logic-levels, pull-down-resistor, floating-input, truth-table]
---

## Was du siehst

Zwei Schalter, ein Logikgatter und eine LED. Die beiden zusätzlichen
Widerstände nach Masse sind keine Deko — ohne sie funktioniert die Schaltung
nicht mehr zuverlässig. Die LED leuchtet nur, wenn beide Schalter geschlossen
sind.

## Probier das aus

1. Klick auf **Sim** und probier alle vier Kombinationen durch: keiner der
   Schalter, nur `sw_a`, nur `sw_b`, dann beide.
2. Schreib auf, was die LED jeweils macht. Diese Tabelle ist der eigentliche
   Inhalt der Schaltung — man nennt sie **Wahrheitstabelle**.
3. Miss `gate1.out`. In drei von vier Fällen stehen dort **0 V**, im vierten
   **4,86 V**.
4. Miss `in0`, während `sw_a` offen ist. Es zeigt **0 V**, festgehalten von
   `pull_a`.
5. Lösche jetzt `pull_a` samt Drähten und öffne `sw_a` wieder. Dieser Eingang
   hängt nun an gar nichts mehr, und das Gatter fängt an zu raten.

## Was dahintersteckt

Ein UND-Gatter beantwortet eine einzige Frage: *Sind alle meine Eingänge hoch?*
Zwei Schalter, vier mögliche Antworten, und nur eine davon heißt ja.

Dasselbe hast du schon mit zwei Schaltern in Reihe gebaut
([pc36](../pc36-series-interlock)) — wozu also ein Chip? Weil diese beiden
Eingänge jetzt **Entscheidungen sind, keine Strompfade**. Die Schalter führen den
LED-Strom nicht mehr; sie informieren nur das Gatter, und das Gatter treibt. So
können die beiden Bedingungen von überall herkommen: eine vom Schalter, eine vom
Sensor, eine vom Pin eines Mikrocontrollers, eine vom Ausgang eines anderen
Gatters. Bei der Reihenschaltung muss alles auf demselben Draht liegen. In der
Logik nichts.

Jetzt zu den Widerständen. Ein CMOS-Eingang ist extrem hochohmig — er schaut nur
auf die Spannung und zieht so gut wie keinen Strom. Ein Eingang, der an nichts
hängt, liest deshalb nicht 0 V, sondern behält die Ladung, die zufällig da ist,
und fängt sich das Brummen aus deiner Hand und den Drähten daneben ein. Er
**floatet**, und ein floatender Eingang lässt ein Gatter ohne jeden Grund
zwischen den Antworten hin- und herspringen.

`pull_a` und `pull_b` beheben das. Jeder ist eine sanfte Verbindung mit 100 kΩ
nach Masse: Ist der Schalter offen, hält dieser Widerstand den Eingang
zuverlässig auf 0 V. Schließt der Schalter, kommen 5 V über einen fast
widerstandslosen Weg und gewinnen mühelos — der Pull-down lässt dann eben
5 V / 100 kΩ = 0,05 mA nach Masse abfließen, was niemanden stört. Stark genug zum
Entscheiden, schwach genug zum Überstimmtwerden.

## Warum das wichtig ist

"Zwei unabhängige Bedingungen müssen beide erfüllt sein" ist ein Sicherheits-
muster: eine Presse, die beide Hände auf den Tastern verlangt, eine Mikrowelle,
die eine geschlossene Tür *und* eine laufende Uhr braucht. Und jeder Taster, den
du je an einen Mikrocontroller hängst, braucht einen Pull-down oder Pull-up,
genau aus dem Grund aus Schritt 5 — der häufigste Anfängerfehler der
Digitaltechnik überhaupt.

## Wie es weitergeht

- **Zum Vergleich:** [pc36-series-interlock](../pc36-series-interlock) —
  dieselbe Logik ganz ohne Chip, und warum das nicht immer reicht.
- **Als Nächstes:** [19-logic-or-gate](../19-logic-or-gate) — die
  *Oder*-Variante.
- **Danach:** [pc45-nand-test](../pc45-nand-test) — das Gatter, aus dem sich
  alle anderen bauen lassen.
- **Zum Ausprobieren:** Stell `pull_a` von 100000 auf 1000000 Ohm. Es
  funktioniert immer noch. Überleg dann, warum auf echten Platinen trotzdem
  niemand überall 10 MΩ einsetzt. (Tipp: Was hängt sonst noch an diesem Draht,
  und wie schnell schaffen 0,05 µA das leerzuräumen?)

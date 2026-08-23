---
level: Einsteiger
age: 8+
prereqs: []
teaches: [Variablen, Steuerfeld, Matrix-Widget, Anzeige-Widget, Lego-Hub]
---

## Spike Prime Hub — Virtuelles Bedienfeld

Ein virtuelles Bedienfeld fuer den Spike Prime Hub (auch Robot Inventor —
gleiche Hardware). Das Steuerfeld zeigt, was die Sensoren und Motoren des
Hubs gerade tun — ohne echten Hub.

- **5x5-Lichtmatrix** — das LED-Gitter des Spike Prime, mit rotierender Linie
- **Motor-Anzeige** — Winkel von -180° bis +180°
- **Distanz-Anzeige** — simulierter Ultraschallsensor, 10–190 cm
- **Farb-Anzeige** — Lego-Farb-IDs durchlaufend (0–10)

## Probiere das

1. Klicke auf die gruene Flagge — alle vier Anzeigen starten.
2. Beobachte die Matrix: die Linie dreht sich durch vier Positionen.
3. Beobachte die Motoranzeige: sie pendelt gleichmaessig.
4. Distanz und Farbe folgen demselben Zyklus.

## Was passiert hier

Das Programm schreibt vier Variablen pro Takt: `hub_matrix` (25-Bit-Maske),
`motor_angle`, `dist_cm` und `colour_id`. Die Matrix- und Anzeige-Widgets
lesen diese Variablen und stellen sie live dar.

Auf echter Hardware wuerden die Ausgaben ueber die Lego-Laufzeittreiber
(Remote oder On-Device ueber brickwright-bridges) laufen. Die Widget-Anzeigen
sind identisch — sie zeigen, was die Variablen enthalten.

## Andere Lego-Hubs

Jeder Lego-Hub ist ein eigenstaendiges Geraet, keine Variante dieses einen:
sie unterscheiden sich in der Anzeige-Hardware, und darum braucht jeder sein
eigenes Bedienfeld statt einer Umfaerbung des Spike-Prime-Felds. Alle fuenf
werden inzwischen mitgeliefert:

| Hub | Anzeige | Erweiterung | Bedienfeld |
|-----|---------|-------------|------------|
| **Spike Prime / Robot Inventor** | 5x5-LED-Matrix | `spikeprime` | dieses Beispiel (`matrix` + 3x `gauge`) |
| **EV3** | 178x128 Mono-LCD | `ev3comprehensive` | `ev3-faceplate` (`mono_lcd` + 3x `button`) |
| **NXT** | 100x64 Mono-LCD | `legonxt` | `nxt-faceplate` (`mono_lcd` + 3x `button`) |
| **WeDo 2.0** | RGB-Statuslicht | `wedo2unified` | `wedo2-faceplate` (`rgb_light` + 2x `slider`) |
| **Boost / Powered Up** | RGB-Statuslicht | `legoboostunified` | `boost-faceplate` (`rgb_light` + `slider`) |

Geteilt wird das *Geruest* — Variablenbindung, die Widget-Pumpe und das
Format `controller.json` — nicht der Widget-Satz. Jeder Hub bekommt sein
eigenes Beispiel auf diesem Geruest, mit den Widgets, die seine Anzeige
wirklich hat.

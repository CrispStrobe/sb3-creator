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

Dieses Bedienfeld ist fuer den Spike Prime gebaut, aber dasselbe Muster
gilt fuer jeden Lego-Hub — sie unterscheiden sich in Matrixgroesse und
Sensorausstattung, nicht im Modell. Um ein Bedienfeld fuer einen anderen
Hub zu erstellen: dieses Beispiel klonen, Matrixgroesse anpassen (oder
entfernen fuer Hubs ohne Gitter) und die Anzeigen an die Sensoren des
jeweiligen Hubs anpassen.

# Widerstandsmännchen mit Hund an AA-Zellen

Dies ist die ausdrücklich neu verdrahtete AA-Variante, nicht die Originalplatine für 9 V. [Originalanleitung](https://www.winklerschulbedarf.com/Documents/Anleitungen_Werkpackungen/PDF_Ger/102170.pdf).

4,5 V, 14 × 220 Ω und R5=470 Ω. Alle acht Füße liegen an Minus. Plus speist den Händeknoten zwischen R5 und R9. R9 versorgt gemeinsam den rechten Menschen und den Hund. Die Vorderbeine des Hundes liegen parallel zu Rücken plus Hinterbeinen. Der Außenarm R4 und die Schwanzdiode bleiben einseitig offen und führen keinen Strom.

Mit konstanten LED-Spannungen von 2,0/2,1 V ergibt die Handrechnung etwa 3,13 / 3,26 / 3,22 mA. Das Simulator-Kniemodell mit dynamischem Widerstand liefert andere Werte. Ein Vergleich mit beliebigen SPICE-Diodenparametern wäre kein Solvernachweis. Reale LEDs und Batterien haben ebenfalls andere Kennlinien; gleiche Ströme bedeuten nicht gleiche wahrgenommene Helligkeit.

R4 und die offene Schwanzdiode auf 0 A, gleiche parallele Beinströme und die Stromsumme an R9 prüfen. Diese Gleichstromschaltung erzeugt keinen Dauerton.

## Batterievarianten

Die Galerie enthält dieselbe neu verdrahtete Schaltung mit folgenden Nennwerten:

| Variante | Versorgung | Widerstände |
| --- | --- | --- |
| Ausgewogenes Ausgangsbeispiel | 3 AA-Alkali, 4,5 V | R5 470 Ω, die übrigen 14 je 220 Ω |
| 3 AA · 220 Ω | 4,5 V | alle 15 je 220 Ω |
| 3 NiMH · 220 Ω | 3,6 V | alle 15 je 220 Ω |
| 2 AA · 100 Ω | 3,0 V | alle 15 je 100 Ω |
| 2 NiMH · 100 Ω | 2,4 V | alle 15 je 100 Ω |

Die Varianten sind gespeicherte Schaltungen: Versorgung und Widerstandswerte
bleiben beim Speichern und Öffnen erhalten. Alle 15 Widerstände tragen die
gewählte Belastbarkeit 0,25 W für die Messwertwarnung. Für die unbekannten
Bausatz-LEDs wird kein maximal zulässiger Strom erfunden.
Zellspannungen sind Nennwerte; zwei NiMH-Zellen bieten wenig Spannungsreserve.
Der gemeinsame Arm, sämtliche Rückwege und der offene Arm/Schwanz bleiben
unverändert. Maßgeblich sind die gemessenen Ströme, nicht eine angenommene
konstante LED-Spannung oder gleiche Helligkeit.

# Widerstandsmännchen mit Hund an AA-Zellen

Dies ist die ausdrücklich neu verdrahtete AA-Variante, nicht die Originalplatine für 9 V. [Originalanleitung](https://www.winklerschulbedarf.com/Documents/Anleitungen_Werkpackungen/PDF_Ger/102170.pdf).

4,5 V, 14 × 220 Ω und R5=470 Ω. Alle acht Füße liegen an Minus. Plus speist den Händeknoten zwischen R5 und R9. R9 versorgt gemeinsam den rechten Menschen und den Hund. Die Vorderbeine des Hundes liegen parallel zu Rücken plus Hinterbeinen. Der Außenarm R4 und die Schwanzdiode bleiben einseitig offen und führen keinen Strom.

Mit konstanten LED-Spannungen von 2,0/2,1 V ergibt die Handrechnung etwa 3,13 / 3,26 / 3,22 mA. Das Simulator-Kniemodell mit dynamischem Widerstand liefert andere Werte. Ein Vergleich mit beliebigen SPICE-Diodenparametern wäre kein Solvernachweis. Reale LEDs und Batterien haben ebenfalls andere Kennlinien; gleiche Ströme bedeuten nicht gleiche wahrgenommene Helligkeit.

R4 und die offene Schwanzdiode auf 0 A, gleiche parallele Beinströme und die Stromsumme an R9 prüfen. Diese Gleichstromschaltung erzeugt keinen Dauerton.

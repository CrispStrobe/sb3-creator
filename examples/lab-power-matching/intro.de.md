---
level: intermediate
age: 13+
prereqs: [pc77-klemmenspannung, pc78-belastete-quelle]
teaches: [internal-resistance, short-circuit-current, maximum-power-transfer, thevenin-source]
---
## Was du siehst
Jede Batterie versteckt einen Widerstand in sich. Hier ist er offen aufgebaut: eine ideale 6-V-Quelle mit 10 Ω in Reihe. Ein Drehknopf (LOAD) stellt den Lastwiderstand zwischen 0 und 40 Ω ein, ein Amperemeter misst den Strom und ein Voltmeter die Spannung an der Last.

## Probier das
1. Dreh LOAD von groß nach klein und notiere Spannung und Strom bei mehreren Stellungen. Die Spannung fällt, während der Strom steigt.
2. Drück SHORT. Der Strom schießt nicht ins Unendliche: Er bleibt bei knapp 0,6 A stehen.
3. Rechne für jede Stellung P = U · I aus. Wo ist sie am größten? Vergleiche diesen Lastwiderstand mit den 10 Ω in der Quelle.

## Was dahintersteckt
Innenwiderstand und Last bilden einen Spannungsteiler. Eine kleine Last bekommt viel Strom, aber der Großteil der Spannung geht in der Quelle verloren; eine große Last behält die Spannung, nimmt aber wenig Strom. Dazwischen, bei R_Last = R_i, ist das Produkt U · I am größten: hier etwa 0,89 W. Antennen, Lautsprecher und Solarmodule werden genau deshalb an ihre Quelle angepasst. Der Preis ist der Wirkungsgrad: Bei Anpassung heizt die Quelle sich selbst genauso stark wie die Last.

## Weiter geht's
- [pc78-belastete-quelle](../pc78-belastete-quelle): eine Batterie mit Innenwiderstand an LED-Lasten.
- [pc80-quellen-vergleich](../pc80-quellen-vergleich): frische und verbrauchte Batterie im Vergleich.

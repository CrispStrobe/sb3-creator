---
level: intermediate
age: 12+
prereqs: [pc40-opamp-threshold]
teaches: [voltage-follower, buffer, impedance-matching]
---
## Was du siehst
Ein Operationsverstaerker, dessen Ausgang direkt auf seinen invertierenden Eingang zurueckgefuehrt wird. Die Ausgangsspannung folgt dem Eingang exakt — Verstaerkung eins, keine Verstaerkung, aber der Ausgang kann Lasten treiben, die die Quelle nicht treiben kann.

## Probier das
1. Stelle den Eingang auf 2,5 V und pruefe, dass der Ausgang 2,5 V anzeigt.
2. Schliesse einen Lastwiderstand an den Ausgang an und pruefe, dass die Spannung bei 2,5 V bleibt, obwohl die Last Strom zieht.
3. Schliesse dieselbe Last direkt an die Eingangsquelle (am Op-Amp vorbei) und beobachte den Spannungsabfall.

## Was passiert hier
Der Operationsverstaerker treibt seinen Ausgang so, dass die Spannungsdifferenz zwischen seinen beiden Eingaengen null wird. Bei 100% Rueckkopplung (Ausgang mit invertierendem Eingang verbunden) muss der Ausgang dem nichtinvertierenden Eingang entsprechen. Die Verstaerkung ist genau 1. Der Hauptvorteil ist die Impedanztransformation: der Eingang zieht fast keinen Strom von der Quelle, waehrend der Ausgang Milliampere an eine Last liefern kann. Der Op-Amp wirkt als Puffer und isoliert die Quelle von der Last.

## Warum das wichtig ist
Viele Sensoren und Referenzschaltungen liefern die richtige Spannung, koennen aber kaum Strom bereitstellen. Ein Spannungsfolger erlaubt es, diese Spannung fuer LEDs, ADC-Eingaenge oder andere Schaltungen zu nutzen, ohne die Quelle zu belasten. Es ist eine der haeufigsten Op-Amp-Konfigurationen in der Praxis.

## Dreh am Potentiometer

Das Poti ist der Eingang des Folgers. Dreh daran, um die Eingangsspannung
durchzufahren, und beobachte, wie der Ausgang folgt — genau das leistet ein
Puffer: Der Ausgang ist gleich dem Eingang, kann jetzt aber eine Last treiben,
die das Poti allein nicht schafft.

## Weiter geht's
- [pc40-opamp-threshold](../pc40-opamp-threshold) — ein Op-Amp als Komparator statt als Puffer.
- [pc55-ntc-indicator](../pc55-ntc-indicator) — ein Sensorausgang, der von Pufferung profitieren koennte.
- Experiment: Fuege einen zweiten Spannungsfolger in die Kette ein und pruefe, dass die Ausgangsspannung immer noch dieselbe ist — Puffer in Reihe veraendern das Signal nicht.

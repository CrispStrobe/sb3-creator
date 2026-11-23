---
level: advanced
age: 14+
prereqs: [pc54-opamp-follower, pc40-opamp-threshold]
teaches: [op-amp, negative-feedback, inverting-amplifier, non-inverting-amplifier, virtual-ground]
---
## Was du siehst
Ein Operationsverstärker-Chip, zwei Verstärker. Beide hören auf denselben INPUT-Knopf, der nur ein halbes Volt um Masse herum verstellt. Der linke dreht das Signal um und macht es 4,7-mal größer, der rechte behält das Vorzeichen und macht es 5,7-mal größer. Zwei 9-V-Quellen liefern dem Chip eine Plus- und eine Minus-Versorgung.

## Probier das
1. Dreh an INPUT und lies die drei Voltmeter ab. Teile jeden Ausgang durch den Eingang: Die Zahlen bleiben bei jeder Stellung gleich.
2. Miss den invertierenden Eingang des linken Verstärkers. Er hat keine Verbindung zu Masse, zeigt aber 0 V.
3. Berechne die Verstärkungen aus den Widerständen (470k/100k und 1 + 47k/10k), bevor du sie an den Messgeräten prüfst.

## Was dahintersteckt
Ein Operationsverstärker allein verstärkt die Differenz seiner Eingänge hunderttausendfach, viel zu viel, um nützlich zu sein. Führt man einen Teil des Ausgangs auf den invertierenden Eingang zurück, korrigiert er sich selbst: Er stellt seinen Ausgang so ein, dass beide Eingänge gleich sind. Beim invertierenden Verstärker muss der Eingangsstrom durch R_in weiter durch R_f fließen, also ist der Ausgang −R_f/R_in mal der Eingang. Beim nichtinvertierenden Verstärker muss der Teiler R_f/R_g genau die Eingangsspannung zurückgeben, also ist der Ausgang (1 + R_f/R_g) mal der Eingang. Die Verstärkung hängt jetzt nur noch von Widerständen ab, die du wählst.

## Weiter geht's
- [pc54-opamp-follower](../pc54-opamp-follower): Verstärkung 1, die einfachste Rückkopplung.
- [lab-opamp-integrator](../lab-opamp-integrator): ein Kondensator statt R_f.

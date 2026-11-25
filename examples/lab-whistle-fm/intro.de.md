# Pfeifen, und der Ton jault

Ein Zwei-Transistor-Multivibrator singt über eine Piezoscheibe einen gleichmäßigen Ton. Seine Basiswiderstände gehen nicht an die Batterie, sondern an einen Steuerpunkt — und ein Verstärker-IC, gespeist von einem Lautsprecher als Mikrofon, schiebt diesen Punkt mit jedem Geräusch auf und ab. Die Tonhöhe folgt.

**Vermittelt:** Frequenzmodulation eines Multivibrators, der Lautsprecher als Mikrofon

## Was zu tun ist

Wähle das Lautsprecher-Mikrofon und stell seinen **Schall** auf still, klick auf **Sim** und hör zu. Erhöhe dann den Schallpegel (sprich oder pfeif hinein — 110 dB ist direkt hineingerufen).

## Was du sehen solltest

- Still: ein gleichmäßiger Ton bei etwa 425 Hz, jede Periode gleich (2,34–2,35 ms).
- Mit Schall: Der Ton jault und trillert; seine Perioden streuen von etwa 1,9 bis 2,6 ms.

## Warum es funktioniert

Jede Hälfte des Multivibrator-Takts dauert so lange, wie ein Kondensator braucht, um sich über einen Basiswiderstand umzuladen. Je höher die Spannung, an der dieser Widerstand hängt, desto schneller geht das und desto höher ist der Ton. Der verstärkte Schall bewegt genau diese Spannung, also bewegt sich die Tonhöhe mit dem Schall.

# Spule und Kondensator, die nicht aufhören: ein LC-Oszillator

Sich selbst überlassen, schwingen Spule und Kondensator eine Weile und verstummen dann, weil jede Schwingung etwas Energie verliert. Ein Transistor, der in jeder Schwingung im richtigen Moment nachschiebt, lässt die Schwingung nie enden. Das ist ein Oszillator.

**Vermittelt:** Resonanz, Mitkopplung, wie ein Oszillator seine Verluste ersetzt

## Was zu tun ist

Klick auf **Sim** und öffne das Oszilloskop. Beobachte den Kollektor (Kanal 1) und den Emitter (Kanal 2). Ändere dann einen der beiden Kondensatoren und hör auf die Tonhöhe.

## Was du sehen solltest

- Einen Sinus von etwa 1,67 kHz, der seine Größe behält.
- Der Emitter schwingt im Takt mit dem Kollektor, aber viel schwächer.
- Größere Kondensatoren ergeben einen tieferen Ton.

## Warum es funktioniert

Die Spule und die beiden Kondensatoren bilden einen Schwingkreis. Die Kondensatoren wirken zugleich als Teiler: Ein kleiner Teil der Kollektorschwingung kommt am Emitter an. Weil die Basis festgehalten wird, verstärkt der Transistor das und speist es im Takt der Schwingung in die Spule zurück. Jede Periode bekommt zurück, was sie verloren hat, so bleibt die Amplitude gleich. In lab-lc-ringing schwingen dieselbe Spule und derselbe Kondensator ohne Transistor.

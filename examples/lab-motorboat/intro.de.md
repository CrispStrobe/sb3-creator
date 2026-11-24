# Motorbooten: wenn die Batterie den Verstärker schwingen lässt

Ein dreistufiger Verstärker ganz ohne Eingangssignal. An einer guten Batterie ist er still. An einer schwachen Batterie fängt er von selbst an zu tuckern wie ein Motorboot. Ein Kondensator an der richtigen Stelle beruhigt ihn.

**Vermittelt:** Innenwiderstand der Versorgung, Mitkopplung, Siebkondensatoren

## Was zu tun ist

Klick auf **Sim** und beobachte die Versorgungsleitung (die rechte Seite des 47-Ω-Widerstands) und den Lautsprecher. Schalte den Schalter **weak** um (links: frische Batterie, rechts: schwache Batterie mit 47 Ω innen) und den Schalter **dec** (rechts: die ersten beiden Stufen über 1 kΩ und 470 µF versorgt).

## Was du sehen solltest

- Schwache Batterie, keine Siebung (wie geladen): Versorgung und Lautsprecher schwingen von selbst auf und ab.
- Frische Batterie: ruhig, still.
- Schwache Batterie mit Siebung: Das Schwingen klingt ab.

## Warum es funktioniert

Die Endstufe zieht einige zehn Milliampere. Über den Innenwiderstand der Batterie verschiebt jede Änderung dieses Stroms die Versorgungsspannung. Der Kollektor der ersten Stufe hängt an dieser Versorgung, also geht die Änderung wieder in den Verstärker, wird von der zweiten Stufe einmal umgedreht und ändert den Ausgangsstrom in dieselbe Richtung wie vorher: Die Schleife nährt sich selbst und schwingt. Der 1-kΩ-Widerstand und der 470-µF-Kondensator geben den ersten Stufen eine eigene ruhige Versorgung, und die Schleife ist unterbrochen. Jeder echte Verstärker hat solche Siebkondensatoren.

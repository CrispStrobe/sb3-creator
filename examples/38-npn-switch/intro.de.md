---
level: intermediate
age: 12+
prereqs: [37-voltage-divider-basic]
teaches: [npn-transistor, switching, button-control]
---
## Was du siehst
Ein Taster, ein Basiswiderstand, ein NPN-Transistor und eine LED mit Vorwiderstand. Wenn der Taster gedrueckt wird, schaltet der Transistor durch und die LED leuchtet. Laesst du den Taster los, erlischt die LED. Der Transistor wirkt als elektronischer Schalter, gesteuert durch einen winzigen Basisstrom.

## Probier das
1. Druecke den Taster und beobachte, wie die LED angeht — der Transistor leitet.
2. Aendere den Basiswiderstand auf einen viel groesseren Wert und beobachte, wie die LED schwaecher wird oder gar nicht leuchtet, weil der Basisstrom zu klein ist, um den Transistor in die Saettigung zu treiben.
3. Entferne den Basiswiderstand ganz und beobachte, was passiert — in einer echten Schaltung koennte zu viel Basisstrom den Transistor beschaedigen.

## Was passiert hier
Ein NPN-Transistor hat drei Anschluesse: Basis, Kollektor und Emitter. Ein kleiner Strom in die Basis (Mikro- bis Milliampere) erlaubt einen viel groesseren Strom vom Kollektor zum Emitter. Der Basiswiderstand begrenzt diesen Steuerstrom auf ein sicheres Mass. Wenn genug Basisstrom fliesst, geht der Transistor in die Saettigung und verhaelt sich wie ein geschlossener Schalter mit nur etwa 0,2 V Kollektor-Emitter-Spannung. So treiben Mikrocontroller Lasten, die mehr Strom brauchen, als ein GPIO-Pin liefern kann.

## Warum das wichtig ist
Transistorschalten ist die Grundlage der Digitalelektronik. Jedes Logikgatter, jeder Motortreiber und jeder Verstaerker baut auf diesem Prinzip auf. Einen Transistor mit einem Taster zu steuern, bereitet darauf vor, ihn mit einem Mikrocontroller-Pin zu steuern.

## Weiter geht's
- [44-darlington-motor](../44-darlington-motor) — staple zwei Transistoren fuer noch hoehere Verstaerkung, um einen Summer anzutreiben.
- [46-port-overcurrent](../46-port-overcurrent) — sieh, warum man einen Transistor braucht, wenn ein einzelner MCU-Pin nicht genug Strom liefern kann.
- Experiment: Miss den Basisstrom und den Kollektorstrom und berechne die Stromverstaerkung des Transistors (hFE = Ic / Ib).

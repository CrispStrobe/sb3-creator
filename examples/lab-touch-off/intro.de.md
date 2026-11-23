---
level: intermediate
age: 12+
prereqs: [lab-touch-darlington]
teaches: [darlington, shunt-switching, inverting, touch-switch]
---
## Was du siehst
Eine gelbe LED leuchtet, sobald die Simulation läuft. Direkt parallel zu ihr sitzt ein Darlington-Paar, und ein Berührungstaster (mit einem Widerstand als Ersatz für deinen Finger) speist dessen Basis.

## Probier das
1. Klick auf **Sim**: die LED ist an.
2. Drück den Berührungstaster: die LED geht sofort aus.
3. Beobachte den Strom aus der Batterie, während du berührst. Sinkt er, wenn das Licht ausgeht?

## Was passiert hier
Die Transistoren liegen nicht in Reihe mit der LED, sondern parallel zu ihr. Ohne Berührung sind sie gesperrt, und die LED bekommt den ganzen Strom durch den 1-kΩ-Widerstand. Eine Berührung lässt ein paar Mikroampere in das Paar fließen, es schaltet voll durch und zieht das obere Ende der LED unter ein Volt – zu wenig, damit die LED leitet. Der Strom fließt jetzt durch die Transistoren, die Schaltung verbraucht also weiter Energie, obwohl die Lampe dunkel ist. Das ist der Preis des Kurzschließens.

## Weiter geht's
- [lab-touch-darlington](../lab-touch-darlington) — dasselbe Paar schaltet eine Lampe ein.
- [lab-shunt-gates](../lab-shunt-gates) — Kurzschließen mit einfachen Tastern ergibt Logikgatter.

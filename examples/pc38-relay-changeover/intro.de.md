---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch]
teaches: [relay, changeover-contact, electromechanical]
---
## Was du siehst
Ein Relais mit einem gemeinsamen Kontakt, der zwischen zwei Zielen hin- und herschaltet — dem Ruhekontakt (NC) und dem Arbeitskontakt (NO). Zwei LEDs zeigen an, welcher aktiv ist.

## Probier das
1. Klick auf **Sim** bei unerregter Spule. Die NC-LED (gelb) leuchtet — der Kontakt ruht auf NC, wenn das Relais nicht erregt ist.
2. Errege die Spule. Nach einer kurzen Verzögerung (~5 ms) kippt der Kontakt: Die NC-LED erlischt und die NO-LED (grün) leuchtet.
3. Schalte die Spule ab. Der Kontakt kehrt nach derselben Verzögerung zu NC zurück.

## Was passiert hier
Ein Relais ist ein elektromagnetisch betätigter Schalter. Wenn Strom durch die Spule fließt, zieht das Magnetfeld einen Metallarm von einem Kontakt zum anderen. Der Umschaltertyp (SPDT) hat drei Anschlüsse: COM, NC und NO. COM ist immer mit genau einem der anderen beiden verbunden — nie mit beiden, nie mit keinem. Die 5-ms-Schaltverzögerung modelliert die physische Bewegung des Arms.

## Warum das wichtig ist
Relais trennen Steuerschaltungen von Hochleistungslasten. Ein 5-V-Mikrocontroller-Signal kann über ein Relais ein 240-V-Netzgerät schalten, ohne elektrische Verbindung zwischen beiden. Umschaltkontakte werden für Motorumkehr, Failover-Schaltung und Sicherheitsverriegelungen verwendet.

## Weiter geht's
- [pc25-relay-isolator](../pc25-relay-isolator) — ein Relais zur Signaltrennung.
- [pc36-series-interlock](../pc36-series-interlock) — verriegelte Relais für die Sicherheit.
- Experiment: Was passiert, wenn du eine Last zwischen NC und NO anschließt? (Hinweis: Sie sieht abwechselnd die Pfade, wenn das Relais taktet.)

---
level: advanced
age: 16+
prereqs: [28-diode-polarity, 38-npn-switch, 10-motor-speed]
teaches: [inductance, flyback, back-emf, transistor-protection]
---

## Was du siehst

Ein Pin des STC12 steuert über einen 1-kΩ-Basiswiderstand einen
TIP120-Darlington an, und der schaltet einen Gleichstrommotor im
Sekundentakt ein und aus. Der Motor besteht hier aus zwei Bauteilen in Reihe:
einem `dc_motor` für Wicklungswiderstand und Gegen-EMK und einer Spule
(`inductor`, 1 mH) für die Induktivität der Wicklung. Was **fehlt**, und zwar
mit Absicht, ist die Freilaufdiode parallel zum Motor. Diese Schaltung wird dir
gezeigt, damit du sie nicht baust.

## Probier das aus

1. Klick auf **Sim** und lass ein paar Ein-/Aus-Zyklen durchlaufen.
2. Leg einen Tastkopf an den Kollektorknoten — den Punkt zwischen Spule und
   TIP120. Solange der Transistor durchschaltet, siehst du dort etwa
   **0,83 V**, die Sättigungsspannung des Darlingtons.
3. Achte auf den Moment, in dem der Transistor sperrt. Der Kollektor springt
   weit über die 5 V der Versorgung hinaus.
4. Jetzt der entscheidende Schritt: Ändere die Abtastrate. Sieh dir das
   Abschalten mit 100 µs Schrittweite an, dann mit 10 µs, dann mit 1 µs. Der
   Spitzenwert liegt bei rund 9 V, dann 47 V, dann **422 V**. Je genauer du
   hinsiehst, desto höher wird er.
5. Ergänze die fehlende Diode: eine `diode` mit **Kathode an VCC** und
   **Anode am Kollektor**, parallel zum Motor. Wiederhole Schritt 4. Jetzt
   bleibt die Spitze bei 7–10 V und bewegt sich kaum noch, egal wie fein du
   abtastest.

## Was dahintersteckt

Eine Spule wehrt sich gegen jede *Änderung* des Stroms. Solange der TIP120
leitet, steigt der Strom durch die Wicklung an und speichert Energie im
Magnetfeld. Wenn der Transistor sperrt, fließt dieser Strom immer noch und
muss irgendwohin — und in dieser Schaltung gibt es kein Irgendwohin.

Die Wicklung antwortet mit U = L·di/dt. Öffnet der Schalter ideal, ist di/dt
praktisch unendlich, und damit ist die Spannung unbegrenzt. Genau das zeigt dir
Schritt 4: Der Simulator spinnt nicht, wenn der Wert immer weiter steigt — er
sagt dir die Wahrheit über eine Gleichung, die keine Lösung hat. Es gibt hier
keinen „richtigen" Spitzenwert, den man nennen könnte, und deshalb nennt dieses
Beispiel auch keinen. **Die Antwort ist keine Zahl, sondern das Wort
„unbegrenzt".**

Echte Hardware liefert natürlich einen endlichen Wert — weil vorher etwas
nachgibt. Ein wenig fängt die Streukapazität ab, und dann geht die
Kollektor-Emitter-Strecke des TIP120 in den Lawinendurchbruch. Seine
Vceo-Grenze liegt bei 60 V, und diese Schaltung reißt sie bei jedem einzelnen
Schaltvorgang. Manchmal stirbt der Transistor sofort. Häufiger stirbt er nach
ein paar hundert Zyklen, und das ist schlimmer — denn dann hat dein Aufbau
lange genug „funktioniert", dass du ihm vertraut hast.

Die Freilaufdiode löst das, indem sie dem Strom genau den Weg gibt, den er
verlangt. Sperrt der Transistor, wird die Diode leitend, der Wicklungsstrom
kreist gefahrlos in der Masche aus Motor und Diode weiter und klingt über den
Wicklungswiderstand ab. Der Kollektor wird auf etwa VCC + 0,7 V begrenzt. Achte
auf die Polung: Im normalen Betrieb ist die Diode in Sperrrichtung gepolt und
tut gar nichts, sie leitet nur während des Abschaltvorgangs. Baust du sie
falsch herum ein, schließt du deine Versorgung kurz.

Eine Anmerkung zum Modell, die man sich merken sollte: Ohne das ausdrückliche
Bauteil `l1` würde dieses Beispiel überhaupt nichts zeigen. Der `dc_motor` der
Engine kennt nur Widerstand und Gegen-EMK — ein Motor ohne eigene
Wicklungsinduktivität liefert beim Abschalten glatte 5 V und ist damit von
einer korrekt geschützten Schaltung nicht zu unterscheiden. Eine Simulation
kann dich immer nur vor der Physik warnen, die du ihr mitgegeben hast.

## Warum das wichtig ist

Jede Relaisspule, jeder Hubmagnet, jeder Motor und jeder Transformator, den du
je schaltest, macht dir das — und eine vergessene Freilaufdiode gehört zu den
häufigsten Arten, wie sich ein funktionierender Prototyp im Feld still und
leise selbst zerlegt. Zwischen deiner Treiberstufe und einem Lawinendurchbruch
pro Schaltzyklus steht ein einziges Bauteil für zehn Cent.

## Wie es weitergeht

- **Die richtige Variante:** [10-motor-speed](../10-motor-speed) — dieselbe
  Treiberstufe, aber mit Diode.
- **Verwandtes Begrenzen:** [39-zener-clamp](../39-zener-clamp) — eine Spannung
  mit einem anderen Bauteil und derselben Idee in Schach halten.
- **Danach:** [54-motor-driver](../54-motor-driver) — eine H-Brücke L293D, bei
  der die Freilaufdioden schon im Chip sitzen, damit man sie nicht vergessen
  kann.
- **Zum Ausprobieren:** Lösch `l1` aus `circuit.json` und miss das Abschalten
  erneut. Die Spannungsspitze verschwindet vollständig — glatte 5 V, genau wie
  bei einer Schaltung mit Diode. An der Verdrahtung hat sich nichts geändert;
  du hast die *Physik* entfernt. Das ist hier die schärfste Lektion: Ein
  Simulator zeigt dir bereitwillig ein harmloses Ergebnis für eine Schaltung,
  die sich auf dem Labortisch zerstören würde — wenn in dem Modell, das du ihm
  gegeben hast, keine Induktivität steckt.

> **Hinweis zum Wert von `l1`.** Wenn du die Zahl bei `henrys` änderst, ändert
> sich am Verhalten des Solvers derzeit nichts — der Transientenpfad der Engine
> liest diesen Parameter unter einer anderen Schreibweise, sodass jede Spule
> mit 1 mH gerechnet wird. Festgehalten ist das in [AUDIT.md](../AUDIT.md).
> Bis das behoben ist, behandle `l1` als vorhanden-oder-nicht statt als
> einstellbar, und überleg dir größere Spulen auf dem Papier: Eine
> Relaiswicklung mit einigen zehn Millihenry speichert deutlich mehr Energie
> als dieser Motor und verzeiht entsprechend weniger.

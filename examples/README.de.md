# Erste Schritte — ein geführter Weg durch die Beispiele

Alles hier läuft **komplett im Browser**. Keine Hardware, kein Download, keine
Installation. Der Simulator berechnet echte Spannungen und Ströme — wenn eine LED
leuchtet, kommt die Helligkeit aus dem Ohmschen Gesetz, angewandt auf deine
Schaltung, nicht aus einer Schätzung.

Es gibt 94 Beispiele. Öffne nicht alle. Folge dem Weg unten; jeder Schritt baut
auf dem vorherigen auf. Überspringe, was dir vertraut vorkommt.

---

## Schritt 1: Eine LED zum Leuchten bringen (kein Programmieren, kein Steckbrett)

Öffne **`pc09-direct-led`**. Du siehst eine 9-V-Batterie, einen 1-kΩ-Widerstand
und eine rote LED, direkt verdrahtet. Die LED leuchtet. Nichts zu klicken, nichts
zu starten.

**Was du siehst:** Der Simulator hat die Schaltung gelöst und gefunden, dass
I = (9 − 2) / 1000 = 7 mA durch die LED fließen. Die Helligkeit (0,35) kommt
von diesem Strom, nicht von einer Einstellung.

**Ändere eine Sache:** Ändere den Widerstand von 1000 Ω auf 220 Ω. Die LED wird
heller — der Strom stieg auf 31,8 mA. Ändere ihn auf 10000 Ω, und sie glimmt
kaum. Das ist das Ohmsche Gesetz: I = U / R.

**Was auf einer echten Platine passieren würde:** genau dasselbe. Entferne den
Widerstand ganz und öffne **`31-no-resistor-led`**, um zu sehen, warum man das
nicht tun sollte.

## Schritt 2: Ein Steckbrett benutzen

Öffne **`pc01-led-resistor`**. Dieselbe Schaltung, aber die Bauteile stecken in
einem Steckbrett. Die Streifen leiten — das rechte Bein des Widerstands und das
linke Bein der LED teilen sich eine Spalte und sind dadurch verbunden.

Öffne **`pc14-mini-led`**. Dieselbe Schaltung auf einem **Mini-Steckbrett** —
17 Spalten, keine Stromschienen. Die Batterie verbindet sich direkt mit den
Streifenlöchern. Das zeigt: Stromschienen sind bequem, aber nicht nötig.

## Schritt 3: Spannung und Widerstand

Öffne **`pc02-voltage-divider`**. Zwei 10-kΩ-Widerstände in Reihe an einer
9-V-Batterie. Der Punkt zwischen ihnen liegt bei 4,5 V — die Hälfte, weil die
Widerstände gleich sind. Ändere einen auf 20 kΩ, und er wandert auf 6 V.

Öffne **`pc17-current-compare`**. Drei LEDs mit 220 Ω, 470 Ω und 1 kΩ. Die
220-Ω-LED ist am hellsten (13,6 mA), die 1-kΩ am dunkelsten (3 mA). Gleiche
Versorgung, gleiche LED — nur der Widerstand ist anders.

## Schritt 4: Aktive Bauteile

Öffne **`pc05-npn-switch`**. Ein Transistor schaltet eine LED. Ein kleiner
Basisstrom (~0,4 mA durch 10 kΩ) schaltet einen großen Kollektorstrom (~6 mA
durch 470 Ω + LED). Diese Verstärkung macht Transistoren nützlich.

Öffne **`pc18-zener-clamp`**. Eine 5,1-V-Zener-Diode begrenzt die Spannung
einer 9-V-Batterie. Die LED hinter der Zener sieht 5,1 V, egal was die
Batterie macht.

## Schritt 5: Zeit

Öffne **`pc06-rc-charge`**. Ein 10-kΩ-Widerstand und ein 100-µF-Kondensator.
Der Kondensator lädt sich mit der Zeitkonstante τ = R × C = 1,0 Sekunde.
Nach einem τ hat er 63 % der Versorgung erreicht; nach fünf τ ist er voll.

---

## Schritt 6: Dein erstes Programm

Öffne **`01-blink`**. Jetzt gibt es einen Mikrocontroller. Das Programm hat
vier Zeilen:

```
WHEN flag clicked:
  FOREVER:
    turn on led1
    wait 0.5 seconds
    turn off led1
    wait 0.5 seconds
```

Die LED blinkt mit 1 Hz. Jede Zeile entspricht einem Scratch-Block.

**Ändere eine Sache:** Ändere `0.5 seconds` auf `0.1 seconds`. Die LED blinkt
fünfmal schneller. Ändere `turn on` / `turn off` zu einfach `toggle led1` —
dasselbe Ergebnis, kürzeres Programm.

**Was `ACTIVE LOW` bedeutet:** Die LED ist von VCC über einen Widerstand zum
Pin verdrahtet. `turn on` treibt den Pin auf LOW (0 V), wodurch Strom von
VCC durch die LED in den Pin fließt. Der STC12 kann 20 mA senken, aber nur
~230 µA liefern — Active-Low nutzt die starke Richtung.

## Schritt 7: Eingabe

Öffne **`05-counter-7seg`**. Das Programm wartet auf einen Tastendruck, zählt
ihn und lässt die LED entsprechend oft blinken. `wait until read button` ist
das Lauschen; `change count by 1` ist das Merken.

## Schritt 8: Die Senke/Quelle-Lektion

Öffne **`32-source-vs-sink`**. Zwei LEDs, gleicher Widerstand, gleicher
`turn on`-Befehl. Eine ist hell (3 mA, Active-Low-Senke), die andere fast
dunkel (0,23 mA, Active-High-Quelle). Der Faktor-13-Unterschied in der
Helligkeit IST die Lektion.

Das ist die wichtigste Eigenschaft des STC12: Er senkt 20 mA, liefert aber
nur ~230 µA. Deshalb ist jede LED in diesem Projekt active-low verdrahtet.

## Schritt 9: Mehrere Aufgaben

Öffne **`04-thermostat`**. Das Programm liest einen Sensor (ADC), vergleicht
mit zwei Schwellwerten (300 und 500) und schaltet eine Heizungs-LED ein oder
aus. Der Abstand zwischen den Schwellwerten ist Hysterese — er verhindert,
dass der Ausgang flattert, wenn der Eingang nahe einem Schwellwert liegt.

## Schritt 10: Sicherheit

Öffne **`09-relay-clicker`**. Ein Relais ist über einen TIP120-Darlington-Treiber
verdrahtet. Der Pin treibt die Basis des Transistors (~3,6 mA); der Transistor
treibt die Relaisspule (~43 mA von der Versorgungsschiene). Ohne den Treiber
kann der Pin nicht genug Strom liefern, und das Relais bleibt tot — der
Simulator fängt das ab.

Öffne **`46-port-overcurrent`**. Acht LEDs an einem Port. Jede zieht 6,4 mA —
einzeln in Ordnung. Zusammen 51,2 mA von einem Port, nahe am Gesamtbudget
des Chips von ~120 mA. Der Simulator warnt, wenn die Deklarationen das Limit
überschreiten.

---

## Was Hardware braucht

**Nichts in dieser Galerie braucht Hardware zum Ausprobieren.** Jedes Beispiel
läuft im Browser-Simulator. Die Schaltungen werden von einer echten
MNA-Engine gelöst; die Programme laufen auf einem emulierten STC12.

Wenn du ein Programm auf einen echten Chip flashen willst, brauchst du:
- Ein STC12C5A60S2-Board (~2 €)
- Einen USB-Seriell-Adapter (CH340 oder CP2102)
- `stcgal` zum Flashen (dokumentiert in der README des stc-Repos)

Die Ergebnisse des Simulators sind **zwischen zwei Emulatoren gegengeprüft**
(Kategorie 2b), aber **für die meisten Peripherien noch nicht auf echtem
Silizium verifiziert**. Die ADC-Registerfolge ist zwischen Modellen verifiziert;
ihr Analogpfad nicht (`BENCH-ADC`). Die PWM-Tastrate ist zwischen Modellen
verifiziert; sie wurde noch nicht mit einem Frequenzzähler gemessen (`BENCH-PWM`).
GPIO (`01-blink`) ist das einzige Beispiel, das physisch auf einem echten Chip
gelaufen ist.

## Dateistruktur

Jedes Beispiel ist ein Verzeichnis mit drei Dateien:

| Datei | was sie enthält |
|---|---|
| `program.bw` | Das Pseudocode-Programm (oder ein Kommentar bei reinen Schaltungen) |
| `circuit.json` | Die Schaltung: Bauteile, Drähte, Steckbrettpositionen |
| `EXPECTED.md` | Was passieren sollte, mit berechneten Werten |

`index.json` listet jedes Beispiel mit englischem und deutschem Titel,
einer Kategorie, einem Schwierigkeitsgrad (1–5) und ob es eine `circuit`
(Schaltung) oder ein `program` (Programm) ist.

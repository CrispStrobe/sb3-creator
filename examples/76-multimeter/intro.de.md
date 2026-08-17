# Bau dir dein eigenes Multimeter

Die Multimeter-Bausätze (das HU-050-Board in vielen deutschen Sets)
sind innen alle dieselbe Maschine: ein kleiner Mikrocontroller, ein
ADC, ein paar clevere analoge Eingangsstufen und eine gemultiplexte
LED-Anzeige. Dieses Beispiel baut diese Maschine aus Einzelteilen auf —
so siehst du jeden Trick, den ein echtes Messgerät benutzt.

## Drei Messungen, drei Eingangsstufen

**Volt** — der ADC verträgt nur 0–5 V, also teilt ein
**Spannungsteiler** (30 kΩ/10 kΩ = ÷4) die Eingangsspannung zuerst
herunter. Die Firmware rechnet wieder hoch. Jeder Bereichsschalter
eines echten Multimeters ist nur ein anderer Teiler.

**Ampere** — Strom misst man, indem man ihn durch einen winzigen
**Shunt-Widerstand** fließen lässt (0,02 Ω, derselbe Wert wie im
echten Bausatz) und den Spannungsabfall liest. 100 mA durch 0,02 Ω
sind nur 2 mV — viel zu wenig für den ADC — deshalb verstärkt ein
**LM358-Operationsverstärker** zuerst ×46,5 (nichtinvertierend,
Verstärkung über das 100-kΩ/2,2-kΩ-Rückkopplungspaar). Den Rest
erledigt das Ohmsche Gesetz: I = U / R.

**Temperatur** — ein **NTC-Thermistor** im Spannungsteiler. Sein
Widerstand sinkt, wenn er warm wird; die Teilerspannung folgt. Diese
Stufe zeigt die rohen Millivolt — die Umrechnung in °C braucht die
Thermistorgleichung, das ist Stufe zwei.

## Die Anzeige

Ein 3-stelliger Siebensegment-Block: acht Segmentleitungen für alle
Ziffern gemeinsam, ein Common pro Ziffer. Die Firmware leuchtet immer
nur eine Ziffer, je 2 ms — dein Auge integriert den Scan zu einer
ruhigen Anzeige, genau wie bei den Matrix-Beispielen. Der Dezimalpunkt
markiert den Volt-Modus.

Die MODE-Taste schaltet V → A → T durch (der Summer piept). Zieh im
SIM an den beiden Potis, um die „gemessene" Spannung und den Strom zu
ändern, und ändere den NTC, um ihn zu erwärmen.

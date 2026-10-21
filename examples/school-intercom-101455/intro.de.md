# Gegensprechanlage mit drei Transistoren

Quellen: [PRINT-Verstärker 101455](https://www.winklerschulbedarf.com/Documents/Anleitungen_Werkpackungen/PDF_Ger/101455.pdf) und [Gegensprechanlage 101450](https://www.winklerschulbedarf.com/Documents/Anleitungen_Werkpackungen/PDF_Ger/101450.pdf).

R1–R11 und C1–C7 folgen dem Herstellerplan; Volume hat 100 kΩ und steht zunächst in der Mitte. Der optionale Mikrofonanschluss U bleibt frei. Drei ausdrücklich generische NPN-Exponentialmodelle stehen für die BC337: IS=1e-14 A, BF=100, BR=1, N=1, RB=10 Ω, RC=1 Ω, CJE=10 pF, CJC=4 pF, TF=0,3 ns. Das sind keine gemessenen BC337-Daten.

Jeder Lautsprecher wird durch 8 Ω Spulenwiderstand und eine Quelle für die erzeugte Mikrofonspannung dargestellt. Acoustic-A speist 1 mV Spitze bei 1 kHz ein, Acoustic-B ist still. Das ist ein elektrisches Prüfsignal; Live-Mikrofon, Schallausbreitung und akustische Rückkopplung sind nicht modelliert.

DPDT-A und DPDT-B sind die beiden Pole eines gemeinsamen Umschalters: beide auf 0 für A → B, beide auf 1 für B → A. Für B → A zusätzlich Acoustic-A auf 0 V Amplitude und Acoustic-B auf 0,001 V stellen. Im Editor sind die Pole einzeln einstellbar.

Den empfangenden Lautsprecher differenziell messen. Erst die Einschwingzeit der Koppelkondensatoren abwarten, dann stationäre Verstärkung angeben. Eine getrennte Rechnung ab dem DC-Arbeitspunkt liefert 41,851× gegenüber 41,817× in ngspice und maximal etwa 41 µV Abweichung über 801 Werte. Das ist Modellprüfung, keine Messung von realer Verständlichkeit oder Verstärkung.

Echte Spektrum-Abtastwerte lassen sich abspielen und als WAV ausgeben. Es wird die endliche Aufnahme ohne Gleichanteil mit fester Skalierung wiedergegeben.

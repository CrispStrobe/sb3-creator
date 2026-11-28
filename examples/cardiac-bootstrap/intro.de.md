# Ein Programm mit einem Programm laden

Beginne mit der festen Zelle 00. Der Eingabestreifen baut einen Lader auf, installiert ein Additionsprogramm und liefert dann 035.

Beginne bei 00 mit dem festen Wort 001. Die ersten beiden Eingaben schreiben INP 02 in Zelle 01 und JMP 00 in Zelle 02. Jedes folgende Paar aus Adresswort und Datenwort installiert ein Programmwort. Das Wort 820 ersetzt schließlich Zelle 01 durch JMP 20. Die verbleibende Eingabe 035 gelangt in das installierte Programm, das die gespeicherte 007 addiert und 042 ausgibt. Verfolge Schreibzugriffe auf 01, 02, 20 bis 25, 81 und 99. Der Eingabestreifen enthält Ladebefehle und Programmdaten; ihre Rolle ergibt sich aus der Ausführungsreihenfolge.

Diese eigenständig verfasste Übung nutzt eine dezimale Lernmaschine. Sie ist kein allgemeines Übersetzungsziel für Scratch, Python, JavaScript oder C.

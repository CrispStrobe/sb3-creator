# Batterietester

Eine unbelastete Batterie lügt über ihren Zustand — eine fast leere
Zelle zeigt im Leerlauf noch eine gesunde Spannung. Darum misst dieser
Tester **unter Last**: der 10-Ω-Widerstand zieht echten Strom, während
der ADC die Zelle liest. AA-Urteile: FULL über 1400 mV, GOOD über
1200, WEAK über 1000, sonst DEAD. Im SIM die Zellenspannung als
Parameter ändern und das Urteil auf dem OLED kippen sehen.

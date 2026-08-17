# Amperemeter

Echte Amperemeter messen Strom auf die einzige Art, die die Physik
erlaubt: der Strom fließt durch einen kleinen **Shunt-Widerstand**,
gemessen wird die Spannung darüber — den Rest erledigt das Ohmsche
Gesetz, `I = U / R`. Hier ist der Shunt 10 Ω, das Potentiometer die
veränderliche Last: ziehen, und die Milliampere auf dem I²C-LCD ändern
sich. Warum 10 Ω statt 0,1 Ω wie im echten Messgerät? Damit der ADC bei
Steckbrett-Strömen etwas zu lesen hat — und genau dieser Kompromiss
(Bürdenspannung) ist die Lektion.

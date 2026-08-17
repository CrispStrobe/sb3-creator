# Battery Tester

An unloaded battery lies about its health — a nearly dead cell still
shows a fine open-circuit voltage. So this tester measures **under
load**: the 10 Ω resistor draws real current while the ADC reads the
cell. AA verdicts: FULL above 1400 mV, GOOD above 1200, WEAK above
1000, DEAD below. Edit the cell's voltage parameter in SIM and watch
the verdict change on the OLED.

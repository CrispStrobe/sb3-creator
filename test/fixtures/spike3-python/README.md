# SPIKE App 3 Python corpus

Small programs written for this repository against LEGO's documented SPIKE App 3
Python API (spike.legoeducation.com/prime/help/lls-help-python). They exercise the
shapes real programs take — drive bases, gyro turns, line following, sensor waits,
two coroutines, helper functions — and are not copies of LEGO's examples.
`test/spike3-python.test.mjs` imports each one, compiles it, and holds the
round trip and the list of what each program cannot express.

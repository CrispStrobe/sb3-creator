#!/usr/bin/env python
"""
Full-carrier ngspice reference for lab-meissner-squegg (the Meissner
transmitter with a switchable slow emitter bypass, and its linked receiver).

bw-board puts an RF tank in an envelope band and never integrates the
~800 kHz carrier itself. This script does: ngspice integrates the carrier,
with the values bw-board resolves for the bench. It is the oracle the
lesson's squegging claims are measured against. It was adapted from bw-board
test/golden/run_ngspice_meissner.py (bw-board PR #783), which names the
engine source line behind each value:

  * ferrite_coil (FERRITE_DEFAULTS): main winding 250 uH; coupling winding
    250 uH * couplingRatio^2, coupling 0.9; loss Q 120 as a series wL/Q;
    copper 2 Ohm * turns.
  * tuning_cap: 10 pF + 490 pF * position.
  * linkTo: k = (0.1 m / distanceM)^3 between the main windings.
  * potentiometer: R(a-wiper) = ohms * (1 - position); slide_switch 0.1 Ohm.
  * npn beta 100: Is 1e-14, Bf 100, with the RF view's Cjc 4 pF and
    fT 300 MHz.
  * 1N34A: Is 2e-7, N 1.3, Rs 5. Crystal earphone: 100 Ohm + 10 nF, with a
    10 MOhm leak.

Usage:
  python scripts/ngspice-meissner-squegg.py '{"couplingRatio":0.2}' [case ...]
  python scripts/ngspice-meissner-squegg.py --record test/measurements/rf-meissner-squegg-ngspice-2026-11-28.json
The first form prints one JSON line per case (sq, steady, rev). --record runs
the lesson's circuit (LESSON below) at two steps and two methods and writes
the record the scenario test cites. Needs ngspice on PATH (47 measured).
"""

import json, math, os, subprocess, sys, tempfile, time

AUTHORED = dict(couplingRatio=0.02, distanceM=0.5, tct=0.3, tcr=0.309, potOhms=1e6, potPos=0.3,
                rb=10e3, cb=4.7e-9, re=1e3, ce=1e-9, cbig=1e-6, cd=2.2e-9, rd=47e3)
# The redesigned lesson (2026-11-28): see LESSON_WHY in the record.
LESSON = dict(AUTHORED, couplingRatio=0.2, distanceM=0.22)
LESSON_WHY = ('The authored circuit (couplingRatio 0.02) does not squeg at the full carrier: the collector '
              'bottoming out holds its swing (bw-board PR #783). Ten times the coupling-winding turns over-drive '
              'the base, each burst over-charges the bias capacitor past cut-off, and the stage squegs at ~1.06 kHz; '
              'the receiver 0.22 m away (link 0.094) hears it with a detector swing above 0.5 V. Swept 2026-11-28: '
              'coupling 0.1/0.15/0.2, distance 0.5/0.3/0.25/0.23/0.22/0.21/0.2 m, receiver tuning 0.3/0.305, '
              'detector 47k/220k/470k and 2.2n/1n/0.47n. 0.2 m makes the small-bypass control squeg too; '
              '0.25 m and beyond leave the detector swing below 0.5 V.')

WINDOWS = {'sq': (6e-3, 9e-3), 'steady': (22e-3, 25e-3), 'rev': (5e-3, 8e-3)}


def tuning(pos):
    return 10e-12 + 490e-12 * pos


def netlist(out, p, case, tmax='5n', tstep='10n', method='gear', reltol='1e-4'):
    ct, cr = tuning(p['tct']), tuning(p['tcr'])
    esr = lambda c: (1 / math.sqrt(250e-6 * c)) * 250e-6 / 120
    n = p['couplingRatio']
    k = min(0.999, (0.1 / p['distanceM']) ** 3)
    sw = 'Rsa base c2 0.1\nRsb x c1 0.1' if case == 'rev' else 'Rsa base c1 0.1\nRsb x c2 0.1'
    big = f"Rsw e eb 0.1\nCbig eb 0 {p['cbig']}" if case == 'sq' else '* small bypass only'
    tstop = WINDOWS[case][1] + 0.2e-3
    return f"""* lab-meissner-squegg, full carrier (sb3-creator scripts/ngspice-meissner-squegg.py)
V1 vcc 0 9
L1 vcc l1m 250u IC=1u
R1 l1m coll {esr(ct)}
Ct vcc coll {ct}
L2 c1 l2m {250e-6 * n * n}
R2 l2m c2 {max(0.01, 2 * n) + esr(ct) * n * n}
L3 0 l3m 250u
R3 l3m rx {esr(cr)}
Cr rx 0 {cr}
K12 L1 L2 0.9
K13 L1 L3 {k}
Q1 coll base e QD
.model QD NPN(Is=1e-14 Bf=100 Br=1 Cjc=4p Tf=0.5305n)
{sw}
Rbb wiper x {p['rb']}
Rpot vcc wiper {max(1, p['potOhms'] * (1 - p['potPos']))}
Cb x 0 {p['cb']}
Re e 0 {p['re']}
Ce e 0 {p['ce']}
{big}
D1 rx det D34
.model D34 D(Is=2e-7 N=1.3 Rs=5)
Cd det 0 {p['cd']}
Rd det 0 {p['rd']}
Resr det epm 100
Cep epm 0 10n
Rleak det 0 10meg
* Measurement only (no load on the circuit): the collector through three
* 20 ns low-pass stages. They pass the ~800 kHz tank (x0.984, divided out in
* analyse(): x0.9848 at 795 kHz, x0.9840 at 828 kHz) and remove
* the ~35 MHz parasitic oscillation of the coupling winding with the
* transistor's capacitances (~85x), which is not part of the tank's band.
Ebuf cb0 0 coll 0 1
Rf1 cb0 cf1 1k
Cf1 cf1 0 20p
Ebuf2 cb1 0 cf1 0 1
Rf2 cb1 cf2 1k
Cf2 cf2 0 20p
Ebuf3 cb2 0 cf2 0 1
Rf3 cb2 cf3 1k
Cf3 cf3 0 20p
.options method={method} reltol={reltol} abstol=1e-12 vntol=1e-7 interp
.tran {tstep} {tstop} 0 {tmax} uic
.control
set wr_singlescale
set wr_vecnames
run
wrdata {out} v(cf3) v(det) v(x) v(e) v(coll)
quit
.endc
.end
"""


def analyse(path, t0, t1, fHz=None):
    """The scenario's observables over [t0, t1]: the tank's swing (half the
    peak-to-peak of the low-passed collector over each 1.3 us window, one
    carrier period at 770-830 kHz), sampled every 20 us as x.rf every
    0.02 ms; the detector's span; the bursts.

    The detector, emitter and bias node are averaged over the same windows:
    the engine's DC solve carries their carrier-cycle average, not the
    carrier ripple left on a 2.2 nF detector capacitor. A ~35 MHz parasitic
    oscillation of the coupling winding with the transistor's capacitances
    (resolved at steps of 2-5 ns) lies far outside the tank's band; the
    measurement low-pass in the netlist keeps it out of the swing. (The
    oscillation does not run at the bare tank's frequency: with a fifth of
    the turns on the coupling winding it is pulled ~3 % up, so the swing is
    read peak to peak, not demodulated at a fixed frequency.)"""
    win = 1.3e-6
    gain = (1 + (2 * math.pi * 810e3 * 20e-9) ** 2) ** -1.5   # the measurement low-pass
    env, det, ve, vx = [], [], [], []
    wstart, lo, hi, acc = None, None, None, None
    with open(path) as f:
        next(f)
        for line in f:
            t, vc, d, x, e, _raw = map(float, line.split())
            if wstart is None or t >= wstart + win:
                if lo is not None and acc[3] > 0 and t0 - 1e-4 <= wstart <= t1:
                    mid = wstart + win / 2
                    env.append((mid, (hi - lo) / 2 / gain))
                    if t0 <= mid <= t1:
                        det.append((mid, acc[0] / acc[3])); vx.append(acc[1] / acc[3]); ve.append(acc[2] / acc[3])
                wstart, lo, hi, acc = t, vc, vc, [0.0, 0.0, 0.0, 0]
            else:
                lo, hi = min(lo, vc), max(hi, vc)
            acc[0] += d; acc[1] += x; acc[2] += e; acc[3] += 1
    ts = [t for t, _ in env]; vs = [v for _, v in env]
    def at(t):
        i = max(1, min(len(ts) - 1, next((j for j, x in enumerate(ts) if x >= t), len(ts) - 1)))
        a, b = ts[i - 1], ts[i]
        return vs[i - 1] + (vs[i] - vs[i - 1]) * (t - a) / (b - a)
    samples = [at(t0 + 20e-6 * (i + 1)) for i in range(int(round((t1 - t0) / 20e-6)))]
    inwin = [(t, v) for t, v in env if t0 <= t <= t1]
    peak = max(v for _, v in inwin)
    rises = [inwin[i][0] for i in range(1, len(inwin)) if inwin[i][1] >= 0.5 * peak > inwin[i - 1][1]] if peak > 0.05 else []
    periods = [b - a for a, b in zip(rises, rises[1:])]
    dv = [d for _, d in det]
    return {
        'rfSampledMinV': min(samples), 'rfSampledMaxV': max(samples),
        'envelopeMinV': min(v for _, v in inwin), 'envelopeMaxV': peak,
        'detectorMinV': min(dv), 'detectorMaxV': max(dv), 'detectorSpanV': max(dv) - min(dv),
        'bursts': len(rises),
        'burstHz': (1 / (sum(periods) / len(periods))) if periods else 0,
        'burstPeriodSpread': ((max(periods) - min(periods)) / (sum(periods) / len(periods))) if len(periods) > 1 else None,
        'emitterV': [min(ve), max(ve)], 'biasNodeV': [min(vx), max(vx)],
    }


def run(p, case, **kw):
    with tempfile.TemporaryDirectory() as tmp:
        dat, cir = os.path.join(tmp, 'o.dat'), os.path.join(tmp, 'c.cir')
        with open(cir, 'w') as f:
            f.write(netlist(dat, p, case, **kw))
        t = time.time()
        r = subprocess.run(['nice', '-n', '19', 'ngspice', '-b', cir], capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(dat):
            return {'case': case, 'error': (r.stdout + r.stderr)[-1500:]}
        return {'case': case, **kw, **analyse(dat, *WINDOWS[case], 1 / (2 * math.pi * math.sqrt(250e-6 * tuning(p['tct'])))), 'seconds': round(time.time() - t, 1)}


def main():
    if sys.argv[1] == '--record':
        out = sys.argv[2]
        res = []
        for case in ('sq', 'steady', 'rev'):
            for kw in ({'tmax': '5n', 'tstep': '10n'}, {'tmax': '2n', 'tstep': '10n'}, {'tmax': '2n', 'tstep': '10n', 'method': 'trap'}):
                r = run(LESSON, case, **kw); print(json.dumps(r)); res.append(r)
        ver = subprocess.run(['ngspice', '-v'], capture_output=True, text=True).stdout
        doc = {'generator': 'scripts/ngspice-meissner-squegg.py --record', 'circuit': LESSON, 'authored': AUTHORED, 'why': LESSON_WHY,
               'ngspice': [l for l in ver.splitlines() if 'ngspice-' in l][:1], 'windowsSec': WINDOWS, 'results': res}
        with open(out, 'w') as f:
            json.dump(doc, f, indent=1); f.write('\n')
        return
    p = dict(AUTHORED, **json.loads(sys.argv[1]))
    for case in (sys.argv[2:] or ['sq', 'steady', 'rev']):
        print(json.dumps({'params': {k: v for k, v in p.items() if AUTHORED.get(k) != v}, **run(p, case)}))


if __name__ == '__main__':
    main()

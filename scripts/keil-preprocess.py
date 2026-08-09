#!/usr/bin/env python3
"""Batch keil2sdcc preprocessing for all corpus .c files.
Outputs JSON: { "path": "translated_source", ... } to stdout.
Only processes files that contain Keil-specific constructs."""

import json
import os
import sys
import glob

# stc-compiler is a sibling checkout, not a package. An absolute path here
# worked on one machine and nowhere else; look beside this repo instead, and
# say which of the two things is missing rather than dying on the import.
_here = os.path.dirname(os.path.abspath(__file__))
_candidates = [os.environ.get('STC_COMPILER'),
               os.path.join(_here, '..', '..', 'stc-compiler'),
               os.path.join(_here, '..', '..', '..', 'stc-compiler')]
for _c in _candidates:
    if _c and os.path.isfile(os.path.join(_c, 'keil2sdcc.py')):
        sys.path.insert(0, os.path.abspath(_c))
        break
else:
    sys.exit('keil2sdcc.py not found: check out stc-compiler beside this repo, '
             'or set STC_COMPILER to it')
from keil2sdcc import translate

corpus_dir = sys.argv[1] if len(sys.argv) > 1 else 'corpus'
files = sorted(glob.glob(f'{corpus_dir}/**/*.c', recursive=True))

results = {}
processed = 0
changed = 0

for f in files:
    try:
        src = open(f, 'r', errors='replace').read()
    except Exception:
        continue

    # Only translate files with Keil constructs
    import re
    if re.search(r'\bsbit\b|\bsfr\b|\b_nop_\b|\bxdata\b|\bidata\b|\bpdata\b|\bcode\s+\w|\breentrant\b|\b_at_\b|\busing\s+\d', src):
        try:
            result = translate(src)
            if result.changes:
                results[f] = result.text
                changed += 1
        except Exception as e:
            pass  # keep original on failure

    processed += 1
    if processed % 100 == 0:
        print(f"  {processed}/{len(files)} processed, {changed} changed", file=sys.stderr)

print(f"Done: {processed} files, {changed} changed by keil2sdcc", file=sys.stderr)
json.dump(results, sys.stdout)

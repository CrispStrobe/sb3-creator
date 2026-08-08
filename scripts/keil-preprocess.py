#!/usr/bin/env python3
"""Batch keil2sdcc preprocessing for all corpus .c files.
Outputs JSON: { "path": "translated_source", ... } to stdout.
Only processes files that contain Keil-specific constructs."""

import json
import os
import sys
import glob

sys.path.insert(0, '/mnt/volume1/code/stc-compiler')
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

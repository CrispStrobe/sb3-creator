#!/bin/sh
set -eu
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cl65 -t none -C "$here/program.cfg" --cpu 65c02 -O \
  -o "$here/rom.bin" "$here/startup.s" "$here/program.c"
test "$(wc -c < "$here/rom.bin" | tr -d ' ')" = 32768

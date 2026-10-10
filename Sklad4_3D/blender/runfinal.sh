#!/bin/bash
cd "$(dirname "$0")"; mkdir -p final10
NF=4350
for pass in 1 2 3; do
  for s in $(seq 0 150 $((NF-1))); do e=$((s+150)); [ $e -gt $NF ] && e=$NF
    n=0; for f in $(seq $s $((e-1))); do [ -s final10/f$(printf %05d $f).jpg ] && n=$((n+1)); done
    [ $n -eq $((e-s)) ] && continue
    python3 finalrender.py -- final10.blend final10 $s $e 2>&1 | grep --line-buffered -E "FRAME|Error|Traceback" >> final10.log
  done
done
echo ALLDONE >> final10.log

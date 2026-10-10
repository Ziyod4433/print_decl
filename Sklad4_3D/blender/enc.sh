#!/bin/bash
# Сборка ролика: кадры Cycles 960×540 → 1280×720, лёгкая резкость, виньетка, подписи поверх; H.264 в два прохода
cd "$(dirname "$0")"
BR=${1:-1260k}; OUT=${2:-Sklad4_process_Cycles.mp4}; N=${3:-}
FC="[0:v]scale=1280:720:flags=lanczos,unsharp=5:5:0.55:5:5:0.0,eq=contrast=1.03:saturation=1.05,eq=gamma=1.12:enable='between(n,0,109)+between(n,110,196)+between(n,278,357)+between(n,4196,4277)+between(n,4278,4349)',vignette=angle=PI/7[b];[b][1:v]overlay=0:0:format=auto,format=yuv420p[v]"
LIM=""; [ -n "$N" ] && LIM="-frames:v $N"
for P in 1 2; do
  ffmpeg -y -v error -framerate 24 -i final10/f%05d.jpg -framerate 24 -i ovl10/o%05d.png -filter_complex "$FC" -map "[v]" $LIM \
    -c:v libx264 -preset slow -b:v $BR -maxrate 3200k -bufsize 6400k -pass $P -passlogfile ./x264p -pix_fmt yuv420p -movflags +faststart -an \
    $( [ $P = 1 ] && echo "-f mp4 /dev/null" || echo "$OUT" )
done
ls -la "$OUT"

#!/bin/bash
# mk_video.sh <out_dir> <out.mp4> — аниматик: каждая сцена — медленный наезд (zoompan) + плавные стыки (xfade)
set -e
OUT=$1; MP4=$2; FPS=25
python3 - "$OUT" <<'PY' > /tmp/hf_list.txt
import json,sys; [print(f"{p}\t{d}") for p,d in json.load(open(sys.argv[1]+"/list.json"))]
PY
i=0; inputs=(); filt=""; prev=""; offs=0; XF=0.6
while IFS=$'\t' read -r p d; do
  inputs+=(-i "$p"); n=$((d*FPS))
  z=$([ $((i%2)) -eq 0 ] && echo "1+0.0007*on" || echo "1.07-0.0007*on")
  filt+="[$i:v]scale=2112:1188,zoompan=z='$z':d=$n:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=$FPS,format=yuv420p,setsar=1[v$i];"
  i=$((i+1))
done < /tmp/hf_list.txt
N=$i; durs=($(cut -f2 /tmp/hf_list.txt))
cur="[v0]"; acc=${durs[0]}
for ((k=1;k<N;k++)); do
  off=$(python3 -c "print(round($acc-$XF*$k,3))"); nxt="[x$k]"; [ $k -eq $((N-1)) ] && nxt="[vout]"
  filt+="$cur[v$k]xfade=transition=fade:duration=$XF:offset=$off$nxt;"; cur=$nxt; acc=$((acc+durs[k]))
done
filt=${filt%;}
ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$filt" -map "[vout]" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -movflags +faststart "$MP4"
echo done "$MP4"; ffprobe -v error -show_entries format=duration -of csv=p=0 "$MP4"

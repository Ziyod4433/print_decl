#!/bin/bash
# перезапуск финального рендера, если процесс умер (после перезапуска контейнера)
cd "$(dirname "$0")"
if ! pgrep -f "runfinal.sh" >/dev/null; then
  if ! grep -q ALLDONE final10.log 2>/dev/null; then
    python3 - <<'PY'
from PIL import Image; import glob, os
for f in sorted(glob.glob('final10/f*.jpg'))[-40:]:
    try: im=Image.open(f); im.load()
    except Exception: os.remove(f); print('removed',f)
PY
    nohup ./runfinal.sh > /dev/null 2>&1 &
    echo restarted
  fi
fi
echo frames $(ls final10 2>/dev/null | wc -l) $(tail -1 final10.log 2>/dev/null)

#!/bin/bash
# run_scenes.sh [model] [scene ids…] — генерация сцен ролика через Higgsfield CLI по tools/higgsfield/scenes.json
#   стартовый и конечный кадр — docs/higgsfield_кадры/, результат — docs/higgsfield_кадры/клипы/<id>_<model>.mp4
#   DRY=1 — только оценка стоимости, без заказа.   Пример: DRY=1 bash tools/higgsfield/run_scenes.sh minimax_hailuo
#                                                            bash tools/higgsfield/run_scenes.sh seedance_2_5 02 06 13
set -e
cd "$(dirname "$0")/../.."
MODEL=${1:-minimax_hailuo}; shift || true; IDS="$*"
K=docs/higgsfield_кадры; OUT=$K/клипы; mkdir -p "$OUT"
higgsfield account status || { echo "сначала: higgsfield auth login (см. docs/Higgsfield_промпт_ролика.md §9)"; exit 1; }
python3 - "$MODEL" "$IDS" <<'PY' > /tmp/hf_scenes.tsv
import json,sys
model,ids=sys.argv[1],sys.argv[2].split()
for s in json.load(open('tools/higgsfield/scenes.json',encoding='utf-8')):
  if ids and s['id'] not in ids: continue
  print('\t'.join([s['id'],s['start'],s['end'],str(s['dur']),s['prompt']]))
PY
TOTAL=0
while IFS=$'\t' read -r id st en dur prompt; do
  ST="$K/$st"; EN="$K/$en"; EXTRA=(); [ -f "$EN" ] && EXTRA=(--end-image "$EN")
  C=$(higgsfield generate cost "$MODEL" --prompt "$prompt" --duration "$dur" --start-image "$ST" "${EXTRA[@]}" --json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('credits','?'))")
  echo "сцена $id: $MODEL, $dur с, кадры $st → ${en} — $C кредитов"; TOTAL=$(python3 -c "print($TOTAL+${C/\?/0})")
  [ "${DRY:-0}" = "1" ] && continue
  JOB=$(higgsfield generate create "$MODEL" --prompt "$prompt" --duration "$dur" --start-image "$ST" "${EXTRA[@]}" --json 2>&1 | python3 -c "import sys,json
t=sys.stdin.read()
try: d=json.loads(t); print(d[0] if isinstance(d,list) else d.get('id',''))
except Exception: print('ERR '+t.strip()[:200])")
  case "$JOB" in ERR*) echo "  отказ: $JOB"; continue;; esac
  echo "  заказ $JOB, жду…"
  URL=$(higgsfield generate wait "$JOB" --timeout 15m --quiet --json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('result_url') or '')")
  [ -n "$URL" ] && curl -sS -o "$OUT/${id}_${MODEL}.mp4" "$URL" && echo "  готово: $OUT/${id}_${MODEL}.mp4" || echo "  результата нет (job $JOB)"
done < /tmp/hf_scenes.tsv
echo "итого по оценке: $TOTAL кредитов"

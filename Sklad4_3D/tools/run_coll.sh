#!/bin/bash
# Проверка столкновений в фильме: корпус погрузчика, вилы, стойка на вилах и люди против всех объектов сцены (каждые 0,08 с).
# Статическое слияние геометрии отключено (NOBATCH=1), иначе препятствия — объединённые сетки. Пустой список hits — норма.
cd "$(dirname "$0")/.." && NOBATCH=1 node tools/ev.js "${1:-Sklad4_realistic_film.html}" tools/checks/coll.js | python3 -c "
import sys,json
t=sys.stdin.read().strip()
try:
    d=json.loads(t)
    print('препятствий',d['nobs'])
    for h in d['hits']: print(h)
    print('люди',d['hum'])
    for h in d['hp']: print(h)
except Exception as e: print(t[:3000])"

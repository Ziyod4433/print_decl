#!/usr/bin/env python3
"""Ловушка 17: код, «съеденный» строчным комментарием. Ищет строки, где после // идёт что-то похожее на JS
(; ) { } => if( for( const let return и т. п.). python3 tools/comment_scan.py abc/*.js parts/*.js film/*.js"""
import re,sys
CODE=re.compile(r"(;\s*(if|for|const|let|var|return|else|while)\b|\)\s*\{|\}\s*\)|=>|\bcontinue;|\bbreak;|[a-zA-Z_]\w*\([^)]*\)\s*;)")
bad=0
for f in sys.argv[1:]:
    for i,l in enumerate(open(f,encoding='utf-8'),1):
        # грубо: вырезать строки в кавычках, чтобы // внутри строк и URL не считались
        t=re.sub(r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"|`(?:\\.|[^`\\])*`","''",l)
        if '//' not in t: continue
        c=t[t.index('//')+2:]
        if CODE.search(c): print(f'{f}:{i}: {c.strip()[:140]}'); bad+=1
print('найдено',bad); sys.exit(1 if bad else 0)

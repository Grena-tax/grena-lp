#!/bin/bash
# LP デプロイ前 自動チェック（壊れリンク/アンカー/画像/JSON-LD/旧ドメイン残りを検出）
# 使い方: bash check.sh   （問題があれば非0で終了＝pre-pushで止められる）
cd "$(dirname "$0")"
ERR=0; note(){ echo "  ⚠️ $1"; ERR=1; }
code(){ curl -sL -o /dev/null -w '%{http_code}' --max-time 12 "$1" 2>/dev/null || echo 000; }

for F in index.html en/index.html; do
  echo "=== $F ==="
  # 1) 外部リンク死活
  for u in $(grep -oE 'href="https?://[^"]+"' "$F" | sed 's/href="//;s/"//' | sort -u); do
    case "$u" in *fonts.googleapis*|*fonts.gstatic*) continue;; esac
    c=$(code "$u"); [ "$c" = "200" ] || [ "$c" = "301" ] || [ "$c" = "302" ] || note "外部リンク $c: $u"
  done
  # 2) 内部アンカー(#x)の飛び先idが在るか
  for a in $(grep -oE 'href="#[a-zA-Z0-9_-]+"' "$F" | sed 's/href="#//;s/"//' | sort -u); do
    grep -q "id=\"$a\"" "$F" || note "内部アンカー先が無い: #$a"
  done
  # 3) 禁止文字列（消し忘れ・壊れドメイン）
  for bad in 'rul.moj.ge' 'github.io' 'lorem ipsum' 'ダミー' 'href="#"' '準備中のリンク'; do
    n=$(grep -c "$bad" "$F"); [ "$n" -eq 0 ] || note "禁止文字列『$bad』が $n 箇所"
  done
  # 4) JSON-LD 妥当性
  python3 -c "import re,json,sys;h=open('$F',encoding='utf-8').read();m=re.findall(r'application/ld\+json\">(.*?)</script>',h,re.S);[json.loads(b) for b in m]" 2>/dev/null || note "JSON-LD が壊れている"
done
# 5) 「動きを減らす」で全消えする書き方の再発防止（2026-07-22追加）
echo "=== 全消え・構文・版番号チェック ==="
for F in grena.css style.css patch.css en/index.html; do
  if grep -q "prefers-reduced-motion" "$F" 2>/dev/null; then
    grep -A2 "prefers-reduced-motion *: *reduce\|prefers-reduced-motion:reduce" "$F" | grep -q "animation: *none\|animation:none" && note "$F: reduce内の animation:none（ヒーロー全消えの原因）を検出"
  fi
done
# 6) JSの構文
node --check script.js 2>/dev/null || note "script.js が構文エラー"
# 7) 文字化け（置換文字）の混入
for F in index.html en/index.html grena.css style.css patch.css script.js; do
  grep -q $'\xEF\xBF\xBD' "$F" 2>/dev/null && note "$F: 文字化け(置換文字)が混入"
done
# 8) HTMLが参照するCSSファイルが実在するか
for F in index.html en/index.html privacy/index.html terms/index.html tokusho/index.html; do
  d=$(dirname "$F")
  for c in $(grep -oE 'href="[^"]+\.css[^"]*"' "$F" | sed 's/href="//;s/"//;s/\?.*//'); do
    [ -f "$d/$c" ] || note "$F: 参照CSSが無い → $c"
  done
done

echo ""
if [ "$ERR" -eq 0 ]; then echo "✅ チェック合格（問題なし）"; else echo "❌ 問題あり（上記）— 修正するまで公開しないこと"; fi
exit $ERR

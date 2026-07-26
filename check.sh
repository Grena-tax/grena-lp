#!/bin/bash
# LP デプロイ前 自動チェック（壊れリンク/アンカー/画像/JSON-LD/旧ドメイン残りを検出）
# 使い方: bash check.sh   （問題があれば非0で終了＝pre-pushで止められる）
cd "$(dirname "$0")"
ERR=0; note(){ echo "  ⚠️ $1"; ERR=1; }
# info(): 事実として食い違うが「どちらが正か」は白井さんの判断＝pushは止めない
INFO=0; info(){ echo "  ℹ️ $1"; INFO=1; }
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
for F in index.html en/index.html privacy/index.html terms/index.html tokusho/index.html en/privacy/index.html en/terms/index.html en/tokusho/index.html; do
  d=$(dirname "$F")
  for c in $(grep -oE 'href="[^"]+\.css[^"]*"' "$F" | sed 's/href="//;s/"//;s/\?.*//'); do
    [ -f "$d/$c" ] || note "$F: 参照CSSが無い → $c"
  done
done

# 9) 同じ金額の書き方が全ページで揃っているか（2026-07-27追加）
#    事故：¥198,000 が本番8か所にあり「〜」の有無がバラバラ／内訳を割って粗利が読める状態だった
#    ★HTMLタグを外した"実際に見える文字"で判定する（タグをまたぐ ¥330,000</span><span>〜 を誤検知しないため）
echo "=== 金額の表記ゆれチェック ==="
JP_PAGES="index.html kiyaku/index.html tokusho/index.html"
EN_PAGES="en/index.html en/tokusho/index.html"
strip() { sed 's/<[^>]*>//g' "$1"; }

# 9-1) 日本語：レンジ価格なのに「〜」が付いていない
for F in $JP_PAGES; do
  [ -f "$F" ] || continue
  for AMT in "198,000/年" "330,000" "258,000"; do
    n=$(strip "$F" | grep -o "¥${AMT}" | wc -l | tr -d ' ')
    m=$(strip "$F" | grep -o "¥${AMT}〜" | wc -l | tr -d ' ')
    if [ "$n" -gt "$m" ]; then
      info "$F: ¥${AMT} が ${n} 件中 ${m} 件しか「〜」付き（どちらが正かは要判断。決めたら全ページ揃える）"
    fi
  done
done

# 9-2) 英語：from に統一されていない書き方
for F in $EN_PAGES; do
  [ -f "$F" ] || continue
  n=$(strip "$F" | grep -o "¥198,000/yr\|¥330,000+\|¥258,000+\|¥288,000+" | wc -l | tr -d ' ')
  [ "$n" -gt 0 ] && info "$F: 英語のレンジ価格が from に統一されていない（${n} 件）"
done

# 9-3) 料金の内訳を割って書いていないか（既決『内訳を分解しない』）
for F in $JP_PAGES $EN_PAGES; do
  [ -f "$F" ] || continue
  n=$(strip "$F" | grep -o "などの実費＋\|の実費＋\|actual costs such as.*plus our\|rent & renewal, plus" | wc -l | tr -d ' ')
  [ "$n" -gt 0 ] && note "$F: 料金の内訳を割って書いている（${n} 件）＝粗利が引き算で読まれる"
done

# 9-4) 提携先・第三者の"提示額"を公開していないか
for F in $JP_PAGES $EN_PAGES; do
  [ -f "$F" ] || continue
  n=$(strip "$F" | grep -o "現地パートナー提示\|パートナー提示の実費\|a third-party actual cost" | wc -l | tr -d ' ')
  [ "$n" -gt 0 ] && note "$F: 提携先の提示額を公開している（${n} 件）＝中抜き導線＋不当表示のもと"
done

echo ""
[ "$INFO" -eq 1 ] && echo "ℹ️ 表記ゆれの指摘あり（上記）— 止めないが、決めたら全ページ揃えること"
if [ "$ERR" -eq 0 ]; then echo "✅ チェック合格（止める問題なし）"; else echo "❌ 問題あり（上記）— 修正するまで公開しないこと"; fi
exit $ERR

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

# 9-2) 英語：レンジ価格なのに from が付いていない（2026-07-27 作り直し）
#   ★元の検査は "¥330,000+" のような『+付き』を探していたが、本番にその表記は1件も無く
#     ＝永久に鳴らない検査だった。実際は en/index.html に from 無しの生の金額が残っていた。
#     日本語の「〜」に当たるのが英語の「from」。生の金額＝定額の意味になり不当表示になりうる。
for F in $EN_PAGES; do
  [ -f "$F" ] || continue
  for AMT in "198,000" "330,000" "258,000"; do
    n=$(strip "$F" | grep -o "¥${AMT}" | wc -l | tr -d ' ')
    m=$(strip "$F" | grep -o "from ¥${AMT}" | wc -l | tr -d ' ')
    if [ "$n" -gt "$m" ]; then
      info "$F: ¥${AMT} が ${n} 件中 ${m} 件しか from 付き（日本語は「〜」付き＝レンジ。英語だけ定額に見える）"
    fi
  done
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
# 10) 同じ値が複数ページに散らばる物の一致検査（2026-07-27追加）
#     事故の型＝1か所だけ直して他が古いまま／片方だけ書き換わって食い違う
echo "=== 散らばる値の一致チェック ==="
ALL="index.html en/index.html kiyaku/index.html tokusho/index.html en/tokusho/index.html terms/index.html privacy/index.html en/terms/index.html en/privacy/index.html"
OWN_ID="400433768"          # 当社の法人ID（全ページ共通）
PARTNER_ID="406365525"      # 提携先の法人ID（出してよいのはトップのみ）
MAIL="info@grena-tax.com"
LINE_URL="lin.ee/QGHmD7i"
GA_ID="G-B2QJLFPZN0"
ADDR="Erosi Manjgaladze St. N75a"

for F in $ALL; do
  [ -f "$F" ] || continue
  T=$(sed 's/<[^>]*>//g' "$F")

  # 10-1) 当社IDが入っていない／別のIDに化けていないか
  printf '%s' "$T" | grep -q "$OWN_ID" || note "$F: 当社の法人ID($OWN_ID)が無い"
  for ID in $(printf '%s' "$T" | grep -oE '4[0-9]{8}' | sort -u); do
    [ "$ID" = "$OWN_ID" ] || [ "$ID" = "$PARTNER_ID" ] && continue
    note "$F: 見覚えのない法人ID $ID が入っている"
  done

  # 10-2) 旧ドメインのメール（.ge）が復活していないか＝過去に事故あり
  # ※LINE公式アカウントのIDは「@grena-tax.ge」が正しい。@の直前に文字がある物だけ＝メールとして判定する
  printf '%s' "$T" | grep -qE "[A-Za-z0-9._-]+@grena-tax\.ge" && note "$F: 旧メール（○○@grena-tax.ge）が残っている（正しくは $MAIL。LINEのID @grena-tax.ge はそのままでよい）"

  # 10-3) 住所の表記ゆれ
  if printf '%s' "$T" | grep -qi "Manjgaladze"; then
    printf '%s' "$T" | grep -q "$ADDR" || note "$F: 住所の書き方が他ページと違う（正＝$ADDR）"
  fi

  # 10-4) LINEのリンク違い
  for L in $(grep -oE 'lin\.ee/[A-Za-z0-9]+' "$F" | sort -u); do
    [ "$L" = "$LINE_URL" ] || note "$F: 見覚えのないLINEリンク $L（正＝$LINE_URL）"
  done
done

# 10-5) 計測タグが消えていないか（消えると数字が取れなくなるのに気づけない）
for F in index.html en/index.html; do
  [ -f "$F" ] || continue
  grep -q "$GA_ID" "$F" || note "$F: GA4の測定ID($GA_ID)が消えている＝アクセスが数えられない"
done

# 10-6) 返金の条件は「契約書」と「特商法」で同一であること（契約書に同一と明記してある）
if [ -f kiyaku/index.html ] && [ -f tokusho/index.html ]; then
  for KEY in "¥10,000" "30%" "現地パートナーへの依頼開始前" "現地手続き着手後"; do
    a=$(sed 's/<[^>]*>//g' kiyaku/index.html  | grep -c "$KEY")
    b=$(sed 's/<[^>]*>//g' tokusho/index.html | grep -c "$KEY")
    [ "$a" -eq "$b" ] || note "返金条件の食い違い：「$KEY」が 契約書${a}件 / 特商法${b}件（同一でなければならない）"
  done
fi

# 10-7) 期間の数字が契約書と特商法で揃っているか
if [ -f kiyaku/index.html ] && [ -f tokusho/index.html ]; then
  for KEY in "7〜10営業日" "7営業日以内"; do
    a=$(sed 's/<[^>]*>//g' kiyaku/index.html  | grep -c "$KEY")
    b=$(sed 's/<[^>]*>//g' tokusho/index.html | grep -c "$KEY")
    { [ "$a" -gt 0 ] && [ "$b" -gt 0 ]; } || note "期間の食い違い：「$KEY」が 契約書${a}件 / 特商法${b}件（両方に必要）"
  done
fi

# 11) 「壊れたら商売が止まる物」の生存確認（2026-07-27追加）
echo "=== 止まったら困る物のチェック ==="
FORM_ID="1FAIpQLSfrd1BglyF7m2O5cFe2lnylRcFD29_z5B38eLWXMk5Y29x_ZQ"

# 11-1) 申込フォームのリンクが正しいか（違うIDに変わると申込が届かなくなる＝一番の事故）
for F in index.html en/index.html; do
  [ -f "$F" ] || continue
  grep -q "$FORM_ID" "$F" || note "$F: 申込フォームのリンクが違う／消えている＝申込が届かなくなる"
  for ID in $(grep -oE 'forms/d/e/[A-Za-z0-9_-]+' "$F" | sed 's|forms/d/e/||' | sort -u); do
    [ "$ID" = "$FORM_ID" ] || note "$F: 見覚えのない申込フォーム $ID が混ざっている"
  done
done

# 11-2) スマホでフッターが空にならないか（2026-07-26に実際に起きた事故）
#      .foot-pc はCSSで640px未満は非表示。foot-pc があるのに foot-sp が無い＝スマホでリンクが1本も出ない
for F in $ALL; do
  [ -f "$F" ] || continue
  pc=$(grep -c 'foot-pc' "$F"); sp=$(grep -c 'foot-sp' "$F")
  [ "$pc" -gt 0 ] && [ "$sp" -eq 0 ] && note "$F: スマホ用フッター(foot-sp)が無い＝スマホで法務リンクが1本も出ない"
done

# 11-3) 法務ページへの導線が全ページにあるか
for F in index.html en/index.html; do
  [ -f "$F" ] || continue
  for L in terms privacy tokusho; do
    grep -q "/$L\"\|/$L/\"\|\"$L\"\|\.\./$L" "$F" || note "$F: $L へのリンクが無い（特商法・規約・プライバシーは全ページから辿れること）"
  done
done

[ "$INFO" -eq 1 ] && echo "ℹ️ 表記ゆれの指摘あり（上記）— 止めないが、決めたら全ページ揃えること"
if [ "$ERR" -eq 0 ]; then echo "✅ チェック合格（止める問題なし）"; else echo "❌ 問題あり（上記）— 修正するまで公開しないこと"; fi
exit $ERR

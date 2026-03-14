<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>ジョージア法人設立・個人事業主登録・口座開設｜GRENA GROUP LLC</title>

<link rel="stylesheet" href="./style.css?v=20251103a">
<link rel="stylesheet" href="./patch.css?v=20260314a">
<meta name="theme-color" content="#0f2040">

<!-- ▼ Grena LP 用 追加スタイル（patch.cssに移行済み・最小限のみ） -->
<style>
  /* ほかと被らないように glp- で統一 */
  .glp-hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(15,23,42,0.72);
    font-size: 11px;
    margin-bottom: 10px;
  }
  .glp-hero-kicker span { display: inline-block; }
</style>

<!-- ▼ 初期状態の翻訳クッキー掃除 -->
<script>
(function(){
  try{
    var host = location.hostname.replace(/^www\./,'');
    var m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/i);
    if (!m) return;
    var v = decodeURIComponent(m[1]||'');
    if (v === '/ja/ja' || v === '/ja/en') return;
    var exp='Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie='googtrans=; expires='+exp+'; path=/';
    document.cookie='googtrans=; expires='+exp+'; path=/; domain=.'+host;
    document.cookie='googtrans=; expires='+exp+'; path=/; domain='+host;
  }catch(_){}
})();
</script>
</head>
<body>

<div id="page-top" aria-hidden="true"></div>

<!-- 右上：言語スイッチ（patch.cssで非表示） -->
<button class="lang-button" id="langBtn" aria-controls="langDrawer" aria-expanded="false" aria-label="Select language">
  <span class="globe" aria-hidden="true">🌐</span>
</button>
<div class="lang-wrap" id="langDrawer" aria-hidden="true">
  <div class="lang-backdrop" id="langBackdrop"></div>
  <aside class="lang-panel" role="dialog" aria-modal="true" aria-label="Select language">
    <div class="lang-head">
      <strong class="lang-title">Select language</strong>
      <button class="lang-close" id="langClose" aria-label="Close">×</button>
    </div>
    <div class="lang-body">
      <div class="ls-search">
        <input id="langSearch" type="search" placeholder="Search language (English names)" inputmode="search" autocomplete="off">
      </div>
      <div id="langList" class="ls-list" role="listbox" aria-label="Languages"></div>
      <div id="google_translate_element"></div>
      <p class="text-sm muted" style="margin:.6rem 0 0;">Powered by Google Translate</p>
    </div>
  </aside>
</div>

<!-- 右上ハンバーガー -->
<button class="menu-button" id="menuBtn" aria-controls="menuDrawer" aria-expanded="false" aria-label="メニューを開閉">
  <span class="bars"><span></span></span>
</button>
<nav class="menu-wrap" id="menuDrawer" aria-hidden="true">
  <div class="menu-backdrop" id="menuBackdrop"></div>
  <aside class="menu-panel" role="dialog" aria-modal="true" aria-label="目次（各セクションへ移動）">
    <div class="menu-head">
      <strong class="menu-title">目次（各セクションへ移動）</strong>
      <button class="menu-close" id="menuClose" aria-label="閉じる">×</button>
    </div>
    <div class="menu-groups" id="menuGroups"></div>
  </aside>
</nav>

<!-- ======== Grena LP ======== -->
<div id="glp-landing" class="glp-wrapper">
  <div class="glp-inner">

    <!-- ヒーロー -->
    <section class="glp-hero">
      <div class="glp-hero-bg" aria-hidden="true">
        <img src="tbilisi-hero.jpg" alt="ジョージア・トビリシの街並み" class="glp-hero-img" decoding="async" fetchpriority="high">
        <div class="glp-hero-gradient" aria-hidden="true"></div>
      </div>
      <div class="glp-hero-content">
        <div class="glp-hero-kicker">
          <span>🌍 EU加盟候補国ジョージア</span>
          <span>×</span>
          <span>現地提携の法律事務所</span>
        </div>
        <p class="glp-hero-title">
          ジョージアで、はじめる。<br>現地制度に沿った、法人・個人事業主・口座の書類整備サポート。
        </p>
        <p class="glp-hero-lead">
          現地提携の法律事務所・会計士と連携し、<br>
          公開資料に基づく一般情報の提供と、手続き書類の整備サポートを行います。
        </p>
        <p class="glp-hero-note">
          ※ 当社は税務・法務の個別判断は行わず、公開資料に基づく一般情報の共有と書類整備の事務サポートのみ提供します。<br>
          ※ 税務・法務の最終判断は、お住まいの国の有資格専門家（税理士・弁護士等）に必ずご確認ください。
        </p>
        <div class="glp-hero-actions">
          <a href="https://line.me/R/ti/p/@georgia-tax" class="glp-btn glp-btn-main" data-glp-target="lp-start">
            無料相談はこちら
          </a>
          <a href="#corp-setup" class="glp-btn glp-btn-sub">
            制度の全体像を見る
          </a>
        </div>
      </div>
    </section>

    <!-- 免責バナー（最上部に配置） -->
    <div style="background:#f4f8fd;border:1px solid #c8d8f0;border-radius:12px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#334155;line-height:1.7;">
      <strong style="color:#0f2040;">【重要なご案内】</strong>
      本サイトは、ジョージアの法人設立・個人事業主登録・銀行口座開設に関する<strong>公開資料に基づく一般情報の提供と、書類整備の事務サポート</strong>のみを目的としています。
      税務・法務の個別助言、金融商品の勧誘・媒介・代理、銀行口座の代理開設は行いません。
      開設可否は各銀行の審査判断であり、成功を保証するものではありません。
      お住まいの国の税理士・弁護士等の専門家に必ずご確認のうえ、ご自身の判断でご利用ください。
    </div>

    <!-- 帯 -->
    <section class="glp-band">
      <p class="glp-band-title">
        ジョージアの法人・個人事業主制度に関する一般情報と書類整備サポート
      </p>
      <ul class="glp-band-list">
        <li>EU加盟候補国・ジョージアの公開制度資料をもとに、一般情報をご案内します</li>
        <li>書類整備・現地法律事務所との連絡調整を、文面ベースでサポートします</li>
        <li>税務・法務の個別助言は行いません。専門家へのご相談を推奨しています</li>
      </ul>
      <p class="glp-band-note">
        ※ 当社のサービスは書類整備・情報提供の事務サポートです。税務効果・法務効果を保証するものではありません。
      </p>
    </section>

    <!-- ジョージアってどんな国？ -->
    <section class="glp-country">
      <p class="glp-country-title">ジョージアってどんな国？</p>
      <div class="glp-country-photos">
        <img src="田舎の教会のデザイン.jpg 3.jpg" alt="ジョージアの教会と城塞" loading="lazy" decoding="async">
        <img src="Untitled design 3.jpg" alt="ジョージアのチーズパン・ハチャプリ" loading="lazy" decoding="async">
        <img src="Untitled design 2.jpg" alt="ジョージア・トビリシの広場" loading="lazy" decoding="async">
      </div>
    </section>

    <!-- 6枚のカード -->
    <section class="glp-cardgrid">

      <article class="glp-card">
        <img src="ジョージア国旗のデザイン.jpg 2.jpg" alt="ジョージア国旗" class="glp-card-flag" loading="lazy" decoding="async">
        <h3 class="glp-card-title">ジョージア法人設立</h3>
        <p class="glp-card-text">
          現地制度に沿った法人設立の書類整備を、現地の法律事務所と連携してサポートします。
        </p>
        <a href="#corp-setup" class="glp-btn glp-btn-sub" data-glp-target="corp">詳しくはこちら</a>
      </article>

      <article class="glp-card">
        <img src="ジョージア国旗のデザイン.jpg 2.jpg" alt="ジョージア国旗" class="glp-card-flag" loading="lazy" decoding="async">
        <h3 class="glp-card-title">ジョージア個人事業主（IE）登録</h3>
        <p class="glp-card-text">
          ジョージア政府が定める正規制度「IE登録」の一般情報提供と、登録書類の整備サポートです。
        </p>
        <a href="#sole-setup" class="glp-btn glp-btn-sub" data-glp-target="ie">詳しくはこちら</a>
      </article>

      <article class="glp-card">
        <img src="ジョージア国旗のデザイン.jpg 2.jpg" alt="ジョージア国旗" class="glp-card-flag" loading="lazy" decoding="async">
        <h3 class="glp-card-title">ジョージア銀行口座（書類整備サポート）</h3>
        <p class="glp-card-text">
          口座開設に必要な書類の整備・確認サポートを提供します。開設可否は各銀行の審査判断です。
        </p>
        <a href="#personal-account" class="glp-btn glp-btn-sub" data-glp-target="bank">今すぐチェック</a>
      </article>

      <article class="glp-card">
        <img src="Untitled design 3.jpg" alt="寿司など和食イメージ" class="glp-card-flag" loading="lazy" decoding="async">
        <h3 class="glp-card-title">和食店をあなたの国に</h3>
        <p class="glp-card-text">
          現地パートナーと連携し、店舗立ち上げ・職人紹介・契約面の確認サポートをご提供します。
        </p>
        <a href="#precheck" class="glp-btn glp-btn-green" data-glp-target="washoku">無料相談する</a>
      </article>

      <article class="glp-card">
        <img src="夜の街並みのデザイン.jpg 4.jpg" alt="海外不動産イメージ" class="glp-card-flag" loading="lazy" decoding="async">
        <h3 class="glp-card-title">海外不動産購入・賃貸</h3>
        <p class="glp-card-text">
          ジョージアを含む海外不動産について、現地パートナーと連携した物件選び・契約プロセスのサポートです。
        </p>
        <a href="#precheck" class="glp-btn glp-btn-gray" data-glp-target="realestate">準備中</a>
      </article>

      <article class="glp-card">
        <img src="Untitled design.jpg" alt="サポートイメージ" class="glp-card-flag" loading="lazy" decoding="async">
        <h3 class="glp-card-title">その他・企画サポート</h3>
        <p class="glp-card-text">
          企画・PR・多拠点展開など、ジョージアを起点にしたビジネスアイデアの検討・設計サポートです。
        </p>
        <a href="#disclaimer" class="glp-btn glp-btn-sub" data-glp-target="others">詳しくはこちら</a>
      </article>

    </section>

  </div>
</div>

<main id="main">
  <h1 class="sr-only" style="position:absolute;left:-9999px;clip:rect(0 0 0 0);width:1px;height:1px;overflow:hidden;">
    ジョージア法人設立・個人事業主登録・個人口座書類整備サポート｜公開資料に基づく一般情報提供
  </h1>

  <!-- 法人設立 -->
  <section id="corp-setup" class="container mx-auto max-w-4xl px-4 py-16">
    <h2 class="text-2xl md:text-3xl font-bold mb-6">
      ジョージア法人設立｜書類整備・情報提供サポート
    </h2>

    <div class="price-promo quick-summary" aria-label="サクッと要点">
      <div class="row">
        <span class="label">サクッと要点（Quick summary）</span>
      </div>
      <p class="qs-tag">こんな方におすすめ</p>
      <ul class="qs-list">
        <li>海外での法人設立を検討しており、現地制度の一般情報を収集したい方</li>
        <li>すでに海外取引があり、現地制度に沿った法人の書類整備をしたい方</li>
        <li>ジョージア語や現地手続きに不安があり、日本語ベースで進めたい方</li>
      </ul>
      <p class="qs-tag">サポート内容</p>
      <ul class="qs-list">
        <li>法人登記に関する書類整備サポート（現地登記官との連絡調整の取次）</li>
        <li>法人口座開設に向けた書類確認・連絡の取次（開設可否は各銀行の審査判断）</li>
        <li>公開資料をもとにした現地制度の一般情報の共有（税務・法務の個別助言は含みません）</li>
      </ul>
      <p class="qs-tag">料金の目安</p>
      <ul class="qs-list">
        <li>法人設立の基本プラン：<strong>¥330,000（税込）〜</strong></li>
        <li>LP付き・フルサポートなどの上位プランもあります（いずれも書類整備・取次サポートの対価です）</li>
        <li>書類提出〜登記完了の目安：現地営業日ベースで<strong>7〜10営業日程度</strong>（案件・時期により変動します）</li>
      </ul>
      <p class="meta">※ 税務・法務の効果を保証するものではありません。詳細は必ず有資格の専門家にご確認ください。</p>
    </div>

    <div class="progress-steps" aria-label="ご利用の3ステップ">
      <div class="step">1. メッセージで相談</div>
      <div class="step">2. ヒアリングシート記入 → ご提案</div>
      <div class="step">3. お申し込み → 現地手続き → 完了報告</div>
    </div>

    <div class="space-y-3 accordion">

      <details>
        <summary>ジョージア法人制度の概要（公開資料に基づく一般情報）</summary>
        <div class="content">
          <p>OECDやPwC等が公表している一般資料を参照した、<strong>ジョージアの法人税制度に関する一般的な説明</strong>です。現地法では、利益の分配時に課税される仕組みが採られているとされています（内容・例外は時点により異なります）。</p>
          <span class="note">※ 当社はOECD／PwCの認定・提携機関ではありません。記載は公表資料を参照した一般情報であり、助言・保証を目的とするものではありません。</span>
          <p><strong>必ずご確認ください</strong></p>
          <ul>
            <li>お住まいの国の税法（CFC規制・移転価格規制等）の適用可能性があります。</li>
            <li>実際の税務効果は居住地・所得区分・資本構成など個別事情によって大きく異なります。</li>
            <li><strong>税務・法務の判断は当社では行いません。必ず有資格の専門家にご相談ください。</strong></li>
          </ul>
          <p>書類のやりとりは文面ベースで完結します。渡航・英語・オンライン会議は原則として不要です。</p>
        </div>
      </details>

      <details>
        <summary>よくある検討動機（一般的な例）</summary>
        <div class="content">
          <ul>
            <li>海外法人の設立を検討しているが、言語や現地手続きに不安がある</li>
            <li>将来的な税務・コンプライアンス対応を見据え、現地制度の情報を収集しておきたい</li>
            <li>国際的なビジネス拠点の選択肢を検討している</li>
          </ul>
          <span class="note">※ CFC＝タックスヘイブン対策税制（Controlled Foreign Company）。お住まいの国の税理士に必ずご確認ください。</span>
          <p>本ページは<strong>制度理解のための一般情報</strong>であり、特定の行為を推奨・勧誘するものではありません。</p>
        </div>
      </details>

      <details>
        <summary>暗号資産に関する一般的注意点</summary>
        <div class="content">
          <p><strong>移管・構成変更の課税タイミングはお住まいの国の税制に依存</strong>します。移管自体が課税対象となる場合もあるため、事前に専門家への確認が必要です。</p>
          <ul>
            <li>ジョージア法人への移管は現地法上の手続に過ぎず、居住国での課税関係に影響しない場合もあれば、影響する場合もあります。</li>
            <li>税務リスク低減には、<strong>帳簿・証憑の厳格な整備</strong>が重要です（当社は書類整備の事務サポートのみ行います）。</li>
          </ul>
          <span class="note">※ 証憑＝請求書・契約書・送金記録など、取引の裏づけ資料</span>
        </div>
      </details>

      <details>
        <summary>制度・運用上のポイント</summary>
        <div class="content">
          <ul>
            <li>根拠法：ジョージア商法に基づく正規手続き</li>
            <li>公開資料（PwC・OECD等）の参照に基づく一般情報の提供</li>
            <li>現地法律事務所「TREX LEGAL」との連携体制（MoU）</li>
            <li>帳簿・用途証憑の書類整備を事務的にサポートします（助言は含みません）</li>
          </ul>
          <span class="note">※ MoU＝覚書（Memorandum of Understanding）。開設や審査結果の保証ではありません。</span>
        </div>
      </details>

      <details>
        <summary>法人税制の一般説明（公開資料参照）</summary>
        <div class="content">
          <p>OECDやPwCが公表する資料によれば、ジョージアでは<strong>利益の分配時に課税される仕組み</strong>が採られているとされています（例外あり）。ただし、<strong>お住まいの国のCFC規制等により、実際の税負担は大きく異なります</strong>。必ず専門家にご確認ください。</p>
          <p>参考資料（外部リンク）：</p>
          <ul>
            <li><a href="https://www.pwc.com/ge/en/assets/pdf/April_2020/OECD_Secretariat_Analysis_EN.pdf" target="_blank" rel="noopener noreferrer">PwCの公表資料（外部）</a></li>
            <li><a href="https://www.oecd.org/tax/transparency/documents/georgia-supplementary-report-2020.htm" target="_blank" rel="noopener noreferrer">OECDの公表資料（外部）</a></li>
          </ul>
          <p class="text-sm muted">※ 当社は各機関の認定・提携を受けていません。リンクは公表資料の参照です。</p>
        </div>
      </details>

      <details>
        <summary>法律事務所との提携（MoU）</summary>
        <div class="content">
          <ul>
            <li>パートナー：TREX LEGAL（ジョージア現地法律事務所）</li>
            <li>提携範囲：登記、各種登録、書類整備・連絡の取次等</li>
            <li>法人ID：406365525</li>
          </ul>
          <span class="note">※ MoUは業務連携の覚書であり、審査・結果の保証を意味しません。</span>
        </div>
      </details>

      <details>
        <summary>初年度の書類整備サポート範囲</summary>
        <div class="content">
          <ul>
            <li>法人登記書類の整備・取次（目安：現地営業日ベース7〜10営業日／変動あり）</li>
            <li>バーチャルオフィス（12ヶ月）</li>
            <li>英文契約書の取得・公証（アポスティーユ手配案内含む）</li>
            <li>法人口座開設に向けた<strong>書類整備支援・取次</strong>（開設可否は各銀行の審査判断）</li>
            <li>eSIM設定の案内</li>
          </ul>
          <span class="note">
            ※ IBAN＝国際銀行口座番号。
            RS.ge（ジョージア税務ポータル）開設支援はオプション（<strong>¥33,000〜</strong>）。
          </span>
        </div>
      </details>

      <details>
        <summary>Nominee構成（UBO開示を含む一般説明）</summary>
        <div class="content">
          <ul>
            <li>名義：ジョージア国籍の代表者・株主を設定する構成（任意）</li>
            <li>MoU＋委任状＋支配者証明に基づく正規の手続き</li>
            <li>実務は依頼者本人が行い、<strong>UBO（実質的支配者）開示が必要</strong>です</li>
            <li>年額：€2,500<span class="text-sm">（税込／2025年8月時点）</span></li>
            <li>国際的な情報交換制度（CRS等）の対象となり得ます</li>
          </ul>
          <span class="note">※ UBO＝Ultimate Beneficial Owner（実質的支配者）。脱税・租税回避を目的とした利用はお断りします。</span>
        </div>
      </details>

      <details>
        <summary>KYC・監督当局（FMS）に関する注意</summary>
        <div class="content">
          <p><strong>KYC（本人確認）</strong>：パスポート・住所証明・（暗号資産取引時は）取引履歴等が必要です。</p>
          <p><strong>FMS（金融監督当局）</strong>：高額送受金や暗号資産取引の状況により、追加提出や確認が求められることがあります。</p>
          <p class="text-sm muted">※ KYC＝Know Your Customer／FMS＝Financial Monitoring Service（ジョージア）</p>
          <p class="text-sm muted">※ 反社会的勢力該当・AML/CFT上の合理的疑いがある場合は支援をお断りします。</p>
        </div>
      </details>

    </div>
  </section>

  <!-- 料金プラン -->
  <section id="plans" class="container mx-auto max-w-4xl px-4 py-12">
    <div class="space-y-3 accordion">
      <details>
        <summary>料金プラン（書類整備・情報提供サポートの対価）</summary>
        <div class="content">

          <h3 class="smallish">料金と手続き日数の早見表</h3>

          <div class="plan-table-wrap" aria-label="料金と手続き日数の早見表">
            <table>
              <thead>
                <tr>
                  <th>内容</th>
                  <th>サポート料金（税込）</th>
                  <th>手続きの目安</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>法人設立 基本プラン</td>
                  <td>¥330,000〜</td>
                  <td>書類提出〜登記：現地営業日ベース 7〜10営業日程度</td>
                </tr>
                <tr>
                  <td>個人事業主（IE＋SBS）</td>
                  <td>¥288,000</td>
                  <td>書類提出〜登録：オンライン申請ベース 7〜10営業日程度</td>
                </tr>
                <tr>
                  <td>口座開設書類サポート</td>
                  <td>¥258,000</td>
                  <td>書類到着〜審査完了：数週間〜（銀行判断）</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="text-sm muted">※ <strong>いずれも目安です。</strong>案件・時期・銀行当局の方針により<strong>前後します。</strong>税務・法務の効果を保証するものではありません。</p>

          <details>
            <summary><strong>基本プラン</strong>：¥330,000 <span class="text-sm">（税込）</span></summary>
            <div class="content">
              <ul>
                <li>法人登記書類の整備・取次（現地登記官との連絡含む）</li>
                <li>法人口座<strong>開設書類の整備支援</strong>（TBC／BOG 他・開設可否は各銀行の審査判断）</li>
                <li>登記住所（1年）</li>
                <li>書類翻訳・郵送の事務サポート</li>
                <li>日本語ベースで文面完結（オンライン会議・英語は原則不要）</li>
              </ul>
              <span class="note">※ 表示価格は<strong>書類整備・取次・情報提供サポートの対価</strong>であり、銀行手数料・預入金等とは無関係です。開設を保証するものではありません。</span>
            </div>
          </details>

          <details>
            <summary><strong>設立＋LPパック</strong>：¥498,000 <span class="text-sm">（税込）</span></summary>
            <div class="content">
              <ul>
                <li>基本プランの範囲に加え：</li>
                <li>.geドメイン取得手続</li>
                <li>初期LP（問い合わせフォーム＋運用ガイドPDF）</li>
                <li>月1回の軽微な相談（チャットベース）</li>
                <li>ライティング構成アドバイス（一般情報）</li>
              </ul>
              <span class="note">※ LP＝ランディングページ。金融商品の勧誘表示は行いません。</span>
            </div>
          </details>

          <details>
            <summary><strong>フルサポートパック</strong>：¥598,000 <span class="text-sm">（税込）</span></summary>
            <div class="content">
              <ul>
                <li>設立＋LPパックの範囲に加え：</li>
                <li><strong>【参考資料提供】</strong>現地制度・書類管理に関する一般参考資料（助言ではありません）</li>
                <li>帳簿テンプレート／書類リストPDF</li>
                <li>職業別の一般的留意点（個別送付）</li>
                <li>月1回の運用レビュー（文面型）</li>
              </ul>
              <span class="note">※ 税務・法務の助言は含みません（参考情報の提供・書類整備サポートです）。</span>
            </div>
          </details>

          <details>
            <summary><strong>追加オプション</strong></summary>
            <div class="content">
              <ul>
                <li><strong>Nominee構成</strong>：€2,500/年 <span class="text-sm">（税込／2025年8月時点）</span><br><span class="text-sm muted">UBO開示が必要です（CRS等の国際情報交換制度の対象となり得ます）。</span></li>
                <li><strong>LP＋.geドメイン（2年目以降）</strong>：¥250,000 <span class="text-sm">（税込）</span></li>
                <li><strong>RS.ge税務ポータル開設支援（希望者のみ）</strong>：¥33,000〜</li>
                <li><strong>公証／アポスティーユ</strong>：¥15,000〜／書類</li>
                <li><strong>国際郵送</strong>（DHL）：¥5,000〜</li>
              </ul>
              <span class="note">※ 価格は時期・条件により変動し得ます。最新は事前にご確認ください。</span>
            </div>
          </details>

          <p class="text-sm muted" style="margin-top:10px;">※ €建ての表示は請求時点の為替で円換算します。</p>

        </div>
      </details>

      <details>
        <summary>2年目以降の維持・保守</summary>
        <div class="content">
          <h4>A.【法人維持のみ】　<strong>¥198,000／年</strong> <span class="text-sm">（税込）</span></h4>
          <ul>
            <li>登記住所更新（1年）</li>
            <li>書類更新の事務サポート（登記官との連絡調整等）</li>
            <li>現地パートナー連携（文面ベース）</li>
          </ul>

          <h4>B.【法人維持＋LP保守】　<strong>¥298,000／年</strong> <span class="text-sm">（税込）</span></h4>
          <ul>
            <li>Aの範囲すべて</li>
            <li>問い合わせフォームの保守・小修正</li>
            <li>年1回の軽微なLP調整・掲載相談</li>
          </ul>

          <div class="price-promo">
            <div class="row">
              <span class="label">LP＋.geドメイン追加（2年目以降）</span>
              <span class="now">¥250,000</span><span class="text-sm">（税込）</span>
            </div>
            <div class="meta">
              <small>※ 初年度「基本プラン」ご利用でLP・ドメイン未整備の方向け追加メニュー。</small>
            </div>
          </div>
        </div>
      </details>

    </div>
  </section>

  <!-- 個人事業主 -->
  <section id="sole-setup" class="container mx-auto max-w-4xl px-4 py-16">
    <h2 class="text-2xl md:text-3xl font-bold mb-6">ジョージア個人事業主（IE）登録｜現地制度の一般情報・書類整備サポート</h2>
    <p class="text-sm muted" style="margin-top:-0.5rem;margin-bottom:1rem;">
      <strong>※ ジョージア現地の法人税制度は公開資料に基づく一般情報です。日本を含むお住まいの国での税負担・申告義務とは異なる場合があります。必ず居住国の税理士等の専門家にご相談ください。</strong>
    </p>

    <div class="price-promo quick-summary" aria-label="サクッと要点">
      <div class="row">
        <span class="label">サクッと要点（Quick summary）</span>
      </div>
      <p class="qs-tag">こんな方におすすめ</p>
      <ul class="qs-list">
        <li>海外向けのビジネスを個人事業主として整備したい方</li>
        <li>現地制度の一般情報を収集し、書類を正規ルートで整えたい方</li>
      </ul>
      <p class="qs-tag">サポート内容</p>
      <ul class="qs-list">
        <li>IE（個人事業主）＋Small Business Status（SBS）のオンライン登録書類整備サポート</li>
        <li>書類テンプレ・提出フロー案内など、日本語ベースでご案内します</li>
      </ul>
      <p class="qs-tag">料金の目安</p>
      <ul class="qs-list">
        <li>IE＋SBS 登録書類整備一式：<strong>¥288,000（税込）</strong></li>
        <li>公証費用や郵送費などの実費は別途ご負担となります</li>
        <li>書類提出〜登録完了の目安：オンライン申請ベースで<strong>7〜10営業日</strong>（時期により変動します）</li>
      </ul>
      <p class="meta">※ 税務効果・法務効果は保証しません。お住まいの国の専門家にご相談ください。</p>
    </div>

    <div class="space-y-3 accordion">

      <details>
        <summary>IE＋Small Business Statusの一般説明（公開資料参照）</summary>
        <div class="content">
          <p>ジョージアには<strong>Small Business Status（SBS）</strong>という制度があり、一定の要件を満たした場合に軽減税率が適用されることが公開資料で示されています。ただし、<strong>お住まいの国での申告義務や税負担については、別途専門家への確認が必要</strong>です。</p>
          <ul>
            <li>登録対象：IE（個人事業主）＋SBS</li>
            <li>所要期間：7〜10営業日（変動あり）</li>
            <li>申請はオンライン（渡航は原則不要）</li>
            <li>MoU提携：TREX LEGAL（ジョージア現地法律事務所）</li>
          </ul>
          <span class="note">※ IE＝Individual Entrepreneur／SBS＝Small Business Status／MoU＝覚書</span>
        </div>
      </details>

      <details>
        <summary>本サービスの想定利用者（例）</summary>
        <div class="content">
          <ul>
            <li>海外クライアントと直接契約する個人事業者</li>
            <li>副業の海外展開をオンラインで書類整備したい個人</li>
            <li>現地制度への準拠と帳簿整備を重視する方</li>
          </ul>
        </div>
      </details>

      <details open>
        <summary>サポート範囲と料金</summary>
        <div class="content">
          <ul>
            <li>登録書類整備一式（IE＋SBS）／登録証明（複数言語）／納税ID取得サポート</li>
            <li>書類テンプレ一式・提出フローサポート（オンライン）</li>
          </ul>

          <div class="price-promo">
            <div class="row">
              <span class="label">料金：</span>
              <span class="now">¥288,000</span><span class="text-sm">（税込）</span>
            </div>
            <div class="meta">
              <small>※ 表示額は<strong>書類整備・情報提供サポートの対価</strong>です。公証・郵送などの実費は別途。</small>
              <small>※ 税務・法務の助言は含みません。</small>
              <small>※ 個人事業主登録と口座開設書類サポートを同時に希望される方向けに、セット料金（<strong>¥498,000（税込）</strong>）をご用意しています。</small>
            </div>
            <div class="proof">
              <span>MoU：TREX LEGAL</span>
              <span>オンライン完結</span>
              <span>複数言語対応</span>
            </div>
          </div>

          <h5>別途費用（必要に応じ実費）</h5>
          <ul>
            <li>国際郵送（DHL）：¥5,000〜</li>
            <li>公証／アポスティーユ：各¥15,000〜／書類</li>
            <li>RS.ge税務ポータル開設支援（希望者のみ）：¥33,000〜</li>
          </ul>
          <span class="note">※ RS.ge＝税務ポータル</span>
        </div>
      </details>

      <details>
        <summary>Small Business Statusの区分（公開資料に基づく一般情報）</summary>
        <div class="content">
          <table>
            <thead><tr><th>年収（ラリ）</th><th>日本円目安</th><th>現地税率（参考）</th><th>条件</th></tr></thead>
            <tbody>
              <tr><td>〜30,000</td><td>〜150万円</td><td>0%</td><td>全事業者対象</td></tr>
              <tr><td>30,001〜500,000</td><td>150〜2,500万円</td><td>1%</td><td>SBS取得必須</td></tr>
              <tr><td>500,000超</td><td>2,500万円〜</td><td>3〜5%</td><td>段階課税</td></tr>
            </tbody>
          </table>
          <p class="text-sm muted">※ 上記はジョージア現地制度の公開資料に基づく参考値です。お住まいの国での申告義務・税負担は別途専門家にご確認ください。</p>
        </div>
      </details>

      <details>
        <summary>KYC・FMSに関する一般的留意点／FAQ</summary>
        <div class="content">
          <p><strong>KYC（本人確認）</strong>：パスポート・住所証明。</p>
          <p><strong>FMS</strong>：高額送金・暗号資産規模に応じ確認が行われ得ます。</p>
          <h5>FAQ</h5>
          <ul>
            <li>Q. 海外から申請可能？ → A. 可能（原則オンライン）。</li>
            <li>Q. 口座開設は含まれる？ → A. 別サービスです（下記参照）。</li>
            <li>Q. 日本での税務申告は？ → A. 必ず日本の税理士にご確認ください（当社では対応していません）。</li>
          </ul>
          <span class="note">※ 助言は行いません。制度・手順の一般情報および書類整備サポート範囲です。</span>
        </div>
      </details>

      <details>
        <summary>個人 → 法人化の検討パス（一般論）</summary>
        <div class="content">
          <ul>
            <li>売上規模や商流に応じ、法人化で国際取引の書類整備がしやすくなる場合があります。</li>
            <li>IE登録者限定で、法人設立の基本プランを割引提供しています（内部枠管理・予告なく終了し得ます）。</li>
          </ul>
          <div class="price-promo">
            <div class="row"><span class="label">通常価格：</span><span class="old">¥330,000</span><span class="text-sm">（税込）</span></div>
            <div class="row"><span class="label">IE登録者限定：</span><span class="now">¥298,000</span><span class="text-sm">（税込）</span><span class="badge">先着枠・期間限定</span></div>
            <div class="meta"><small>※ 枠・期間は内部管理。適用条件はお問い合わせ時点のご案内に従います。</small></div>
          </div>
        </div>
      </details>

    </div>
  </section>

  <!-- 個人口座 -->
  <section id="personal-account" class="container mx-auto max-w-4xl px-4 py-16">
    <h2 class="text-2xl md:text-3xl font-bold mb-6">ジョージア銀行｜口座開設に向けた書類整備サポート（開設可否は各銀行の審査判断）</h2>

    <div class="price-promo quick-summary" aria-label="サクッと要点">
      <div class="row">
        <span class="label">サクッと要点（Quick summary）</span>
      </div>
      <p class="qs-tag">こんな方におすすめ</p>
      <ul class="qs-list">
        <li>ジョージアの個人口座開設に向けた書類を正規ルートで整えたい方</li>
        <li>渡航は難しいが、書類整備を日本語ベースで進めたい方</li>
      </ul>
      <p class="qs-tag">サポート内容</p>
      <ul class="qs-list">
        <li>必要書類の案内・確認、公証・アポスティーユ取得方法のガイド</li>
        <li>提携法律事務所経由での書類取次と進捗連絡</li>
        <li>Wise登録など、実務準備の初期サポート</li>
      </ul>
      <p class="qs-tag">料金の目安</p>
      <ul class="qs-list">
        <li>口座開設書類整備サポート：<strong>¥258,000（税込）</strong></li>
        <li>IE＋口座書類セット：<strong>¥498,000（税込）</strong></li>
        <li>銀行・公証・郵送などの実費は別途ご負担となります</li>
        <li>書類到着〜審査完了の目安：<strong>数週間〜</strong>（銀行・時期により変動します）</li>
      </ul>
      <p class="meta">※ 口座開設可否は各銀行の審査判断です。当社は金融商品の勧誘・媒介・代理は行いません。</p>
    </div>

    <div class="space-y-3 accordion">

      <details>
        <summary>制度・市場の背景（参考情報）</summary>
        <div class="content">
          <ul>
            <li>主要行は国際市場で資金調達・英語対応・SWIFT送金が可能です</li>
            <li>預金保護制度あり（上限・条件は各行・時点の規定によります）</li>
            <li>非居住者の口座開設受付可否：<strong>各銀行の審査判断</strong>（事前確認を推奨します）</li>
          </ul>
          <p class="text-sm muted">※ 当社は特定の金融商品・銀行を推奨・斡旋しません。契約はお客様と各銀行の直接契約です。</p>
          <p class="text-sm muted">※ 金融商品取引法上の勧誘・媒介・代理に該当する行為は行いません。</p>
        </div>
      </details>

      <details>
        <summary>必要書類（海外在住・非居住者例）</summary>
        <div class="content">
          <ul>
            <li>パスポート（有効期限内）<strong>＋公証＆アポスティーユ</strong></li>
            <li>英語の住所証明（銀行残高証明／公共料金請求書 等・3ヶ月以内）</li>
            <li>署名（パスポート一致の筆跡／公証書への記載）</li>
            <li>原本郵送（PDF不可）</li>
          </ul>
          <p>当社提供：eSIM（SMS認証用）／取得マニュアル／委任状・英文書式／郵送先案内 等</p>
          <span class="note">※ アポスティーユ＝公文書の国際認証／eSIM＝組込型SIM</span>
        </div>
      </details>

      <details open>
        <summary>書類整備サポートの範囲と費用</summary>
        <div class="content">
          <ul>
            <li>提携法律事務所を通じた正規ルートでの書類取次（MoU連携）</li>
            <li>公証・アポスティーユ取得案内、翻訳補助、最終チェック</li>
            <li>Wise登録支援、連絡窓口（チャットベース）</li>
          </ul>

          <div class="value-box" role="region" aria-label="渡航不要のご案内">
            <h5 class="value-title">書類整備は原則として渡航不要</h5>
            <p>自国のことば（日本語）の文面だけで、公証・アポスティーユ・翻訳・郵送の段取りまでご案内します。</p>
            <ul class="value-list">
              <li>書類整備・連絡調整をオンラインでサポート</li>
              <li>MoU連携の正規ルートでの書類取次</li>
              <li>連絡はチャット中心（履歴が残って安心）</li>
            </ul>
            <p class="text-sm muted">※ 口座開設可否は各銀行の審査判断です。方針・時期により、追加書類や来店を求められる場合があります。</p>
          </div>

          <div class="price-promo">
            <div class="row"><span class="label">書類整備サポート費用：</span><span class="now">¥258,000</span><span class="text-sm">（税込）</span></div>
            <div class="row">
              <span class="label">IE＋口座書類セット：</span>
              <span class="old">通常合計 ¥546,000</span><span class="now">¥498,000</span><span class="text-sm">（税込）</span>
            </div>
            <div class="meta">
              <small>対価の範囲：書類案内・最終チェック・翻訳補助・公証/アポスティーユ取得方法の案内・現地法律事務所への書類取次・進捗連絡。</small><br>
              <small>含まれないもの：銀行の審査/結果・銀行/公証/郵送の実費・為替/送金手数料・税務/法務の助言。</small><br>
              <small><strong>重要：当社は銀行側のための募集・勧誘・代理行為は行いません。</strong>当社の業務は書類整備・連絡調整・取次の事務サポートのみです。</small><br>
              <small>当社は、いかなる銀行・金融機関からも紹介料・コミッション等を受け取っていません。</small><br>
              <small><strong>口座開設可否は各銀行の審査判断であり、成功保証はありません。</strong></small>
            </div>
            <div class="proof"><span>MoU：TREX LEGAL</span><span>書類整備サポート</span></div>
          </div>
        </div>
      </details>

      <!-- 複利ツール -->
      <details id="cf-tool-sec" class="calc-wrap">
        <summary>複利の概算ツール（参考・商品非特定）</summary>
        <div class="content">
          <div id="cf-tool" class="cf-card" role="form" aria-labelledby="cf-title">
            <h4 id="cf-title" class="smallish">複利の概算ツール（一般的な数式ベース／特定の商品・銀行は示しません）</h4>

            <div class="cf-grid">
              <label for="cf-currency">通貨</label>
              <select id="cf-currency">
                <option value="JPY" data-locale="ja-JP" data-symbol="¥" selected>JPY（円）</option>
                <option value="USD" data-locale="en-US" data-symbol="$">USD（ドル）</option>
                <option value="EUR" data-locale="de-DE" data-symbol="€">EUR（ユーロ）</option>
                <option value="GEL" data-locale="ka-GE" data-symbol="₾">GEL（ラリ）</option>
              </select>
              <label for="cf-principal">元本</label>
              <input id="cf-principal" type="number" inputmode="decimal" min="0" step="1" value="1000000">
              <label for="cf-rate">年率（%・任意入力）</label>
              <input id="cf-rate" type="number" inputmode="decimal" step="0.01" value="10.00">
              <div class="cf-subrow" aria-live="polite">入力中の年率：<strong id="cf-rate-display">10.00%</strong></div>
              <label for="cf-years">年数</label>
              <input id="cf-years" type="number" inputmode="numeric" min="0" step="1" value="7">
              <label for="cf-nper">回数/年</label>
              <select id="cf-nper">
                <option value="1">年1回</option>
                <option value="4">四半期</option>
                <option value="12" selected>月次</option>
                <option value="365">日次</option>
              </select>
              <label for="cf-is-comp">複利で計算</label>
              <input id="cf-is-comp" type="checkbox" checked>
            </div>

            <div class="cf-preset">
              <span class="cf-hint">年率の例：</span>
              <button type="button" class="cf-chip" data-rate="5">5%</button>
              <button type="button" class="cf-chip" data-rate="8">8%</button>
              <button type="button" class="cf-chip" data-rate="10">10%</button>
              <button type="button" class="cf-chip" data-rate="12">12%</button>
              <small class="note">※ 例示の数値であり、特定の商品・銀行を示すものではありません。</small>
            </div>

            <div class="cf-ack">
              <input id="cf-ack" type="checkbox">
              <label for="cf-ack">
                一般的な<strong>数学計算</strong>の参考ツールです。特定の商品・銀行・利回りの示唆ではありません。税・手数料・為替は加味していません。将来の成果を示唆・保証しません。
              </label>
            </div>

            <div class="cf-actions">
              <button id="cf-run" class="btn secondary" disabled>結果を表示</button>
              <button id="cf-clear" class="btn neutral" type="button">クリア</button>
            </div>

            <div id="cf-out" class="cf-out" aria-live="polite"></div>

            <div class="cf-ref" style="margin-top:10px;">
              <details>
                <summary>参考：公式の預金金利ページ（外部リンク）</summary>
                <ul class="cf-links">
                  <li><a href="https://bankofgeorgia.ge/en/retail/deposits" target="_blank" rel="noopener noreferrer nofollow">Bank of Georgia – Deposits</a></li>
                  <li><a href="https://www.tbcbank.ge/web/en/web/guest/deposits" target="_blank" rel="noopener noreferrer nofollow">TBC Bank – Deposits</a></li>
                </ul>
                <p class="text-sm muted">※ 当社は各行の金利を表示・保証しません。最新値は各行の公式情報をご確認の上、「年率」欄にご自身で入力してください。</p>
              </details>
            </div>

            <p class="text-sm muted" style="margin-top:.5rem;">※ 本ツールは教育・参考目的です。投資判断の根拠にはなりません。</p>
          </div>
        </div>
      </details>

    </div>
  </section>

  <!-- おすすめしません -->
  <section id="not-for" class="container mx-auto max-w-4xl px-4 py-8">
    <h2 class="text-xl md:text-2xl font-bold mb-4">こんな方にはおすすめしません</h2>
    <ul class="qs-list">
      <li>お住まいの国での申告・納税義務を軽視されている方</li>
      <li>短期の投機目的だけを考えている方</li>
      <li>書類整備や帳簿管理を一切行うつもりがない方</li>
      <li>専門家（税理士・弁護士）への相談を省略したい方</li>
    </ul>
    <p class="text-sm muted" style="margin-top:.5rem;">※ 現地制度に沿って適正に運営されたい方向けのサービスです。</p>
  </section>

  <!-- 相談前チェック -->
  <section id="precheck" class="container mx-auto max-w-4xl px-4 py-8">
    <h2 class="text-xl md:text-2xl font-bold mb-4">相談前に考えておいていただけるとスムーズです</h2>
    <ul class="qs-list">
      <li>主な収入の種類（IT・コンサル・デザイン・翻訳・輸出入 など）</li>
      <li>だいたいの売上規模（ざっくりでOK）</li>
      <li>「法人」から始めたいか、「個人事業主」から始めたいか</li>
      <li>口座を主に使うのは「生活用」か「事業用」か</li>
      <li>お住まいの国の税理士・専門家への相談状況</li>
    </ul>
    <p class="text-sm muted" style="margin-top:.5rem;">※ 全部決まっていなくても大丈夫です。「なんとなくこうしたい」で構いません。</p>
  </section>

  <!-- 免責事項 -->
  <section id="disclaimer" class="container mx-auto max-w-4xl px-4 py-8 text-sm">
    <h2 class="smallish">免責事項・キャンセルポリシー（必ずお読みください）</h2>

    <div class="accordion">
      <details>
        <summary>免責事項（必ずお読みください）</summary>
        <div class="content">
          <ul>
            <li>当サービスは<strong>公開資料に基づく一般情報の提供・書類整備の取次・事務サポート</strong>であり、<strong>銀行口座の代理開設・金融商品の勧誘・媒介・代理は行いません。</strong></li>
            <li>現地での書類提出・登記手続きは、現地の正規パートナー（法律事務所等）が現地法・各銀行規程に基づき実施します。</li>
            <li>当社の受領する料金は<strong>書類整備・情報提供・取次サポートの対価</strong>であり、銀行に支払う手数料・預入金等とは一切関係がありません。</li>
            <li>当社は、いかなる銀行・金融機関からも紹介料・コミッション等を受け取っていません。</li>
            <li><strong>税務・法務の個別助言は行いません。</strong>税務効果はお住まいの国・個別事情により異なります。必ず税理士・弁護士へご相談ください。</li>
            <li>ジョージア現地制度に関する情報は公開資料参照の一般情報です。<strong>お住まいの国での税負担・申告義務とは異なる場合があります。</strong></li>
            <li>口座開設可否・条件は各銀行の審査・方針により変動し、<strong>開設や条件は保証できません。</strong></li>
            <li>試算・事例等は参考情報であり、<strong>将来の成果を保証しません。</strong></li>
            <li>個人情報は、現地登記・登録・口座開設書類整備に必要な範囲および当社サービス運営の目的でのみ利用し、提携法律事務所・実務連携先の範囲でのみ共有します。目的外利用・第三者提供は行いません。</li>
            <li>提供主体は<strong>GRENA GROUP LLC（ジョージア法人）</strong>であり、契約の準拠法はジョージア法、<strong>専属的合意管轄はジョージアの裁判所</strong>とします。</li>
            <li>一部の法域では当社の免許・登録が求められるため、対象外となる場合があります。</li>
            <li>日本の居住者の方は、国外財産調書・国外転出時課税・CFC税制などの対象となり得ます。必ず日本の所轄税務署または税理士にご確認ください。</li>
          </ul>
          <p class="text-sm muted">※ 本サイトの情報は公開資料参照の一般情報であり、特定行為の勧誘・意思決定のための助言を目的としません。</p>
        </div>
      </details>

      <details>
        <summary>キャンセルポリシー（返金条件）</summary>
        <div class="content">
          <ul>
            <li>お客様都合のキャンセルは次のとおり：
              <ul>
                <li>現地パートナーへの依頼開始前：返金手数料（1万円）を差し引いた金額を返金</li>
                <li>現地パートナーへの依頼開始後：お支払い金額の100%がキャンセル料となり、<strong>ご返金はありません。</strong></li>
              </ul>
            </li>
            <li>当社の明確な不履行がある場合は、返金・再対応等の適切な措置を講じます。</li>
            <li>虚偽申告・反社会的勢力該当は支援不可。</li>
            <li>提供主体は<strong>GRENA GROUP LLC（ジョージア法人）</strong>であり、日本の特定商取引法のクーリングオフは適用対象外です。</li>
          </ul>
        </div>
      </details>
    </div>
  </section>

  <!-- 固定CTA -->
  <div class="fixed-cta" id="ctaBar" role="region" aria-label="お申込みと相談の操作バー">
    <div class="row">
      <a class="btn neutral" id="toTop" href="#page-top" aria-label="ページ上部へ">トップへ</a>
      <a class="btn secondary" href="https://line.me/R/ti/p/@georgia-tax" target="_blank" rel="noopener noreferrer">相談はこちら</a>
      <a class="btn success" id="applyNow" href="https://line.me/R/ti/p/@georgia-tax" target="_blank" rel="noopener noreferrer">今すぐ申し込み</a>
    </div>
  </div>
</main>

<footer class="site-foot" role="contentinfo">
  <small class="foot-pc">© 2025 GRENA GROUP LLC｜Since 2025｜ジョージア法人ID：406365525｜お問い合わせ：<a href="mailto:info@grena-tax.ge">info@grena-tax.ge</a>｜本サイトは一般情報の提供であり、勧誘・媒介ではありません。｜<a href="/terms" target="_blank" rel="noopener noreferrer">利用規約</a>｜<a href="/privacy" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a></small>
  <small class="foot-sp">©2025 GRENA GROUP LLC｜ID：406365525｜<a href="mailto:info@grena-tax.ge">info@grena-tax.ge</a>｜一般情報の提供のみ</small>
</footer>

<!-- スクロールスクリプト -->
<script>
(function() {
  var landing = document.getElementById('glp-landing');
  if (!landing) return;
  var keywordMap = {
    "lp-start": "ジョージア法人設立・個人事業主登録・個人口座",
    "corp":     "ジョージア法人設立｜書類整備",
    "ie":       "ジョージア個人事業主（IE）登録",
    "bank":     "ジョージア銀行｜口座開設",
    "washoku":  "相談前に考えておいていただけるとスムーズです",
    "realestate": "相談前に考えておいていただけるとスムーズです",
    "others":   "免責事項・キャンセルポリシー"
  };
  function scrollToKeyword(keyword) {
    if (!keyword) return;
    var tags = ["h1","h2","h3","h4","h5","h6","p","div","span","section"];
    var nodes = [];
    for (var i = 0; i < tags.length; i++) {
      var list = document.getElementsByTagName(tags[i]);
      for (var j = 0; j < list.length; j++) nodes.push(list[j]);
    }
    var target = null;
    for (var k = 0; k < nodes.length; k++) {
      var text = nodes[k].textContent || "";
      if (text.indexOf(keyword) !== -1) { target = nodes[k]; break; }
    }
    if (target) {
      var y = target.getBoundingClientRect().top + window.pageYOffset - 80;
      try { window.scrollTo({ top: y, behavior: "smooth" }); }
      catch (e) { window.scrollTo(0, y); }
    }
  }
  var links = landing.querySelectorAll("[data-glp-target]");
  for (var n = 0; n < links.length; n++) {
    links[n].addEventListener("click", function(ev) {
      ev.preventDefault();
      scrollToKeyword(keywordMap[this.getAttribute("data-glp-target")]);
    });
  }
})();
</script>

<script src="./script.js?v=20251110a" defer></script>

<!-- JP/EN切替 -->
<style>
.goog-te-banner-frame{display:none!important}
body{top:0!important}
#goog-gt-tt, .goog-te-balloon-frame{display:none!important}
#lpLangSwitch {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 10px);
  right: calc(env(safe-area-inset-right, 0px) + 10px + 48px + 10px);
  z-index: 9999;
  display: flex;
  gap: 6px;
  padding: 6px;
  border-radius: 12px;
  background: rgba(255,255,255,0.95);
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  backdrop-filter: blur(6px);
}
#lpLangSwitch button{
  appearance: none;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
#lpLangSwitch button[aria-pressed="true"]{
  background: #0f2040;
  color: #fff;
  border-color: #0f2040;
}
</style>

<script>
function lpGoogleTranslateInit() {
  try{
    if (window.google && google.translate && document.querySelector(".goog-te-combo")) return;
  }catch(_){}
  new google.translate.TranslateElement(
    { pageLanguage: "ja", includedLanguages: "ja,en", autoDisplay: false },
    "google_translate_element"
  );
}
</script>

<script>
(function(){
  "use strict";
  function setGoogTrans(value){
    var host = location.hostname.replace(/^www\./,'');
    var exp = new Date(Date.now() + 365*24*60*60*1000).toUTCString();
    document.cookie = "googtrans=" + encodeURIComponent(value) + "; expires=" + exp + "; path=/";
    document.cookie = "googtrans=" + encodeURIComponent(value) + "; expires=" + exp + "; path=/; domain=." + host;
    document.cookie = "googtrans=" + encodeURIComponent(value) + "; expires=" + exp + "; path=/; domain=" + host;
  }
  function mountSwitch(){
    if (document.getElementById("lpLangSwitch")) return;
    var box = document.createElement("div");
    box.id = "lpLangSwitch";
    box.className = "notranslate";
    box.setAttribute("translate","no");
    var jp = document.createElement("button");
    jp.type = "button"; jp.id = "lpLangJP";
    jp.className = "notranslate"; jp.setAttribute("translate","no");
    jp.innerHTML = '<span class="notranslate">JP</span>';
    var en = document.createElement("button");
    en.type = "button"; en.id = "lpLangEN";
    en.className = "notranslate"; en.setAttribute("translate","no");
    en.innerHTML = '<span class="notranslate">EN</span>';
    jp.addEventListener("click", function(){ localStorage.setItem("lp_lang","ja"); setGoogTrans("/ja/ja"); location.reload(); });
    en.addEventListener("click", function(){ localStorage.setItem("lp_lang","en"); setGoogTrans("/ja/en"); location.reload(); });
    box.appendChild(jp); box.appendChild(en);
    document.body.appendChild(box);
    var saved = localStorage.getItem("lp_lang") || "ja";
    jp.setAttribute("aria-pressed", saved === "ja" ? "true" : "false");
    en.setAttribute("aria-pressed", saved === "en" ? "true" : "false");
  }
  function boot(){
    mountSwitch();
    var saved = localStorage.getItem("lp_lang") || "ja";
    if (saved === "en") setGoogTrans("/ja/en");
    else setGoogTrans("/ja/ja");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
</script>

<script src="https://translate.google.com/translate_a/element.js?cb=lpGoogleTranslateInit"></script>

</body>
</html>

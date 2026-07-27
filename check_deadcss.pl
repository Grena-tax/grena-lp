#!/usr/bin/perl
# ============================================================================
# 「効かないCSS（死票）」検出   使い方: perl check_deadcss.pl <html> <patch.css>
#
# ★なぜ在るか（2026-07-28 の事故）
#   英語LPの料金カードが小さいスマホ(320px)で割れたので、インライン<style>に
#     @media (max-width:374px){ .price-num{ font-size:36px; } }
#   を足した。ところが patch.css:1203 が同じものを !important で押さえていたため、
#   この指定は【1ミリも効いていなかった】。見た目では気づけず、人が実測して初めて判明。
#   !important は"書いた場所の前後"に関係なく、付いていない指定に必ず勝つ。
#
# ★何を見るか（絞り込みの理由）
#   patch.css には !important が 589 件あり、en/index.html のインライン宣言 1740 件の
#   うち 234 件が元から死票。全部鳴らすと 234 件のノイズで誰も読まなくなる。
#   一方【@media の中の死票】に絞ると 3 件しか出ず、その1件が上の事故そのものだった。
#   直したら 2 件に減った＝狙い撃ちで効く。だから @media の中だけを見る。
#
# 出力: 死んでいる「セレクタ|プロパティ」を1行ずつ。何も無ければ何も出さない。
# ============================================================================
use strict; use warnings;
my ($htmlfile, $patchfile) = @ARGV;

# CSSテキストから (セレクタ, プロパティ, !important有無) を拾う。
# $mediaonly=1 なら @media の中の宣言だけを返す。
sub decls {
  my ($text, $mediaonly) = @_;
  $text =~ s{/\*.*?\*/}{}gs;                       # コメントは中身でないので落とす
  my (@stack, @res);
  while ($text =~ /\G(.*?)([{}])/gcs) {
    my ($chunk, $b) = ($1, $2);
    if ($b eq '{') {
      my $s = $chunk;
      $s =~ s/^.*[;}]//s;                          # 直前の宣言・ブロックを捨てる
      $s =~ s/\s+/ /g; $s =~ s/^ //; $s =~ s/ $//;
      push @stack, $s;
    } else {
      my $sel = @stack ? $stack[-1] : '';
      my $inmedia = grep { /^\@media/ } @stack;
      if ($sel ne '' && $sel !~ /^\@/ && (!$mediaonly || $inmedia)) {
        for my $d (split /;/, $chunk) {
          next unless $d =~ /^\s*([-a-zA-Z]+)\s*:(.*)$/s;
          push @res, [$sel, lc $1, ($2 =~ /!\s*important/ ? 1 : 0)];
        }
      }
      pop @stack;
    }
  }
  return @res;
}

open(my $p, '<', $patchfile) or exit 0;
my $pt = do { local $/; <$p> }; close $p;
my %strong;                                        # patch.css が !important で押さえている物
for my $d (decls($pt, 0)) { $strong{"$d->[0]|$d->[1]"} = 1 if $d->[2]; }

open(my $h, '<', $htmlfile) or exit 0;
my $ht = do { local $/; <$h> }; close $h;
my %hit;
while ($ht =~ /<style[^>]*>(.*?)<\/style>/gs) {    # HTMLの中の<style>だけが対象
  for my $d (decls($1, 1)) {
    next if $d->[2];                               # こちらも !important なら勝てる＝問題なし
    my $k = "$d->[0]|$d->[1]";
    $hit{$k} = 1 if $strong{$k};
  }
}
print "$_\n" for sort keys %hit;

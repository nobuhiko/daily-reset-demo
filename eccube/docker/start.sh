#!/bin/sh
# Apache を 1 番目のプロセスにしない。
# php:*-apache の止める合図は SIGWINCH(Apache の「静かに止まれ」)。Cloudflare のコンテナでは、この合図が
# 1 番目のプロセスに届くことがあり、Apache を直接動かすと起きてすぐ止まった。合図は無視して、Apache は子として動かす
trap '' WINCH
# ログはファイルに書く(公式イメージは標準出力に流す。本番で起き続けたのは、ファイルに書いたイメージだけだった)
apache2-foreground >> /var/log/apache2/demo.log 2>&1 &
pid=$!
trap 'kill -TERM "$pid" 2>/dev/null' TERM INT
wait "$pid"
wait "$pid" 2>/dev/null
exit $?

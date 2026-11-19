#!/bin/sh
# WordPress(日本語版。公式の SHA-1 で確かめる)と、SQLite で動かすための公式のプラグインを取る → .cache/
# 使い方: sh scripts/fetch.sh [バージョン(既定 7.1.4)]
set -eu
cd "$(dirname "$0")/.."
VER="${1:-7.1.4}"
mkdir -p .cache
TAR=".cache/wordpress-$VER-ja.tar.gz"
if [ ! -f "$TAR" ]; then
  curl -fsSL -o "$TAR.tmp" "https://ja.wordpress.org/wordpress-$VER-ja.tar.gz"
  want=$(curl -fsSL "https://ja.wordpress.org/wordpress-$VER-ja.tar.gz.sha1" | tr -d ' \n')
  got=$(shasum -a 1 "$TAR.tmp" | awk '{print $1}')
  [ "$want" = "$got" ] || { echo "SHA-1 が合いません: $want != $got" >&2; rm -f "$TAR.tmp"; exit 1; }
  mv "$TAR.tmp" "$TAR"
fi
echo "WordPress $VER: $TAR"
ZIP=.cache/sqlite-database-integration.zip
[ -f "$ZIP" ] || curl -fsSL -o "$ZIP" "https://downloads.wordpress.org/plugin/sqlite-database-integration.zip"
echo "SQLite Database Integration: $ZIP"

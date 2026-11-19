#!/bin/sh
# EC-CUBE 公式の配布物を GitHub の release から取り、公式のチェックサム(sha256)で確かめる → .cache/
# 使い方: sh scripts/fetch.sh [バージョン(既定 4.3.1-p1)]
set -eu
cd "$(dirname "$0")/.."
VER="${1:-4.3.1-p1}"
mkdir -p .cache
TAR=".cache/eccube-$VER.tar.gz"
if [ ! -f "$TAR" ]; then
  base="https://github.com/EC-CUBE/ec-cube/releases/download/$VER"
  curl -fsSL -o "$TAR.tmp" "$base/eccube-$VER.tar.gz"
  want=$(curl -fsSL "$base/eccube-$VER.tar.gz.checksum.sha256" | awk '{print $1}')
  got=$(shasum -a 256 "$TAR.tmp" | awk '{print $1}')
  [ "$want" = "$got" ] || { echo "チェックサムが合いません: $want != $got" >&2; rm -f "$TAR.tmp"; exit 1; }
  mv "$TAR.tmp" "$TAR"
fi
echo "EC-CUBE $VER: $TAR"

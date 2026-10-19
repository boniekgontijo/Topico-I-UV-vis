#!/bin/sh
# Copia as figuras e estruturas da aula para o site, com lado maior de 1000 px (macOS: sips).
set -e
ORIG="$(dirname "$0")/../../Aula_UV-vis"
DEST="$(dirname "$0")/../public/conteudo/uvvis/img"
mkdir -p "$DEST"
for f in "$ORIG"/figs/*.png "$ORIG"/estruturas/*.png; do
  sips -Z 1000 "$f" --out "$DEST/$(basename "$f")" >/dev/null
done
echo "$(ls "$DEST" | wc -l) imagens em $DEST"

#!/bin/sh
set -eu

: "${CASAR_HOST:=noivos.casar.com}"
: "${CASAR_PATH:=/mariafernandaeronaldo}"
: "${CASAR_PAINEL_HOST:=painel.casar.com}"
: "${SITE_URL:=https://mariafernandaeronaldo.com.br}"
: "${PORT:=10000}"

SITE_SLUG="${CASAR_PATH#/}"
export SITE_SLUG

OG_IMAGE_PREFIX="https://noivos.casar.com/thumb/200x200x1/dados/sitenoivos/wed1525655/paginas/"
OG_IMAGE_FILE=$(
  curl -fsSL "https://${CASAR_HOST}${CASAR_PATH}/" \
    | sed -n "s|.*<meta property=\"og:image\" content=\"${OG_IMAGE_PREFIX}\\([^\"]*\\)\".*|\\1|p" \
    | head -1
)

if [ -z "${OG_IMAGE_FILE}" ]; then
  echo "warning: could not detect Casar og:image filename; using fallback" >&2
  OG_IMAGE_FILE="1wDbv_1783383590.png"
fi

export OG_IMAGE_FILE

envsubst '${CASAR_HOST} ${CASAR_PATH} ${CASAR_PAINEL_HOST} ${SITE_URL} ${SITE_SLUG} ${PORT} ${OG_IMAGE_FILE}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'

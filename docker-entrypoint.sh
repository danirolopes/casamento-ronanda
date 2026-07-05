#!/bin/sh
set -eu

: "${CASAR_HOST:=noivos.casar.com}"
: "${CASAR_PATH:=/mariafernandaeronaldo}"
: "${CASAR_PAINEL_HOST:=painel.casar.com}"
: "${PORT:=10000}"

envsubst '${CASAR_HOST} ${CASAR_PATH} ${CASAR_PAINEL_HOST} ${PORT}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'

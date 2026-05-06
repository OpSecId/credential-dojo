#!/bin/sh
set -e
# Railway injects PORT — the container must listen there or the proxy returns 502.
LISTEN_PORT="${PORT:-80}"
UPSTREAM="${API_UPSTREAM:-http://api:3001}"
TEMPLATE=/etc/nginx/templates/default.conf.template
OUT=/etc/nginx/conf.d/default.conf
sed \
  -e "s|__LISTEN_PORT__|${LISTEN_PORT}|g" \
  -e "s|__API_UPSTREAM__|${UPSTREAM}|g" \
  "$TEMPLATE" >"$OUT"
exec nginx -g 'daemon off;'

#!/bin/sh
set -e
UPSTREAM="${API_UPSTREAM:-http://api:3001}"
# Escape sed delimiter characters in URL if ever needed (Railway HTTPS URLs use ://).
TEMPLATE=/etc/nginx/templates/default.conf.template
OUT=/etc/nginx/conf.d/default.conf
sed "s|__API_UPSTREAM__|${UPSTREAM}|g" "$TEMPLATE" >"$OUT"
exec nginx -g 'daemon off;'

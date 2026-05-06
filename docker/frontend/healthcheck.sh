#!/bin/sh
# Must match PORT nginx listens on (Railway sets PORT; default 80 for Compose).
P="${PORT:-80}"
wget -qO- "http://127.0.0.1:${P}/" >/dev/null || exit 1

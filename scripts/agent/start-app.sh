#!/usr/bin/env bash
# Démarre l'app pour les agents (MCP Playwright + e2e) en arrière-plan :
#   - API mock json-server sur :3000, servie depuis une COPIE de mock-api/db.json
#     (json-server réécrit le fichier qu'il sert : les commandes passées dans le
#     navigateur ne doivent pas finir dans le commit de l'agent) ;
#   - ng serve (configuration de dev, API sur http://localhost:3000) sur :4200.
# Attend que les deux répondent. Logs dans .agent-out/*.log.
#
# Prérequis : npm ci (racine) et npm ci --prefix mock-api.
set -euo pipefail

out=.agent-out
mkdir -p "$out/playwright"
cp mock-api/db.json "$out/db.runtime.json"

nohup mock-api/node_modules/.bin/json-server "$out/db.runtime.json" --port 3000 \
  > "$out/mock-api.log" 2>&1 &
nohup npx ng serve --port 4200 > "$out/ng-serve.log" 2>&1 &

if ! timeout "${START_TIMEOUT:-300}" bash -c \
  'until curl -sf http://localhost:3000/stores >/dev/null && curl -sf http://localhost:4200 >/dev/null; do sleep 3; done'; then
  echo "::error::l'app n'a pas démarré à temps"
  tail -n 50 "$out/mock-api.log" "$out/ng-serve.log"
  exit 1
fi
echo "App prête : http://localhost:4200 (API mock : http://localhost:3000)"

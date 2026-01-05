# Server bridge (MQTT -> WebSocket)

## Demarrage
- `npm install`
- `npm run dev`

## Variables d'environnement
- `MQTT_URL` (defaut: `mqtt://localhost:1883`)
- `WS_PORT` (defaut: `8080`)
- `WS_PATH` (defaut: `/ws`)
- `TOPIC_PREFIX` (defaut: `classroom`)

## Protocoles
- MQTT -> WS :
  - `telemetry` -> `{ type: "telemetry", deviceId, payload }`
  - `events` / `status` -> `{ type: "event", deviceId, payload }`
- WS -> MQTT :
  - `{ type: "cmd", deviceId, cmd, value }`

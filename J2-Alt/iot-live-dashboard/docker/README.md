# Broker MQTT local

## Demarrage
- `docker compose up -d`

## Test rapide (optionnel)
- `mosquitto_sub -h localhost -t 'classroom/+/telemetry'`
- `mosquitto_pub -h localhost -t 'classroom/test/telemetry' -m '{"deviceId":"test","ts":0,"seq":1}'`

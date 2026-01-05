# Topics et payloads

Prefix : `classroom/<deviceId>/`

| Topic | Sens | Emis par | Payload |
| --- | --- | --- | --- |
| `telemetry` | mesures periodiques | ESP32 | JSON telemetry |
| `events` | evenements (boot, ack, alert) | ESP32 | JSON event |
| `cmd` | commandes (LED, interval) | serveur | JSON cmd |
| `status` | presence (online/offline) | ESP32 (LWT) | JSON status |

## JSON telemetry
Champs attendus : `deviceId`, `ts`, `seq`, `tempC`, `humPct`, `batteryPct`.

## JSON event
Champs attendus : `deviceId`, `ts`, `type`.

## JSON cmd
Champs attendus : `cmd`, `value`.

## JSON status (optionnel)
Champs attendus : `deviceId`, `ts`, `status`.

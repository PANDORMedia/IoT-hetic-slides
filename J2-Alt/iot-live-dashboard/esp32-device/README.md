# ESP32 device (telemetrie simulee)

## Configuration
Modifier `src/config.h` :
- `WIFI_SSID`
- `WIFI_PASS`
- `MQTT_HOST`
- `DEVICE_ID`

## Execution
- Ouvrir dans PlatformIO
- Build + Upload
- Serial monitor a 115200

## Topics publies
- `classroom/<deviceId>/telemetry`
- `classroom/<deviceId>/events`
- `classroom/<deviceId>/status` (LWT)

## Commandes supportees
- `{"cmd":"LED","value":1}`
- `{"cmd":"INTERVAL_MS","value":500}`

## Notes
- `ts` est un timestamp en secondes (basé sur `millis()`).
- `batteryPct` remonte a 100 quand elle passe sous 10.

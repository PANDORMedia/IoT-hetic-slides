# J2-Alt - IoT Live Dashboard

Objectif : construire un mini-systeme IoT complet (ESP32 -> MQTT -> WebSocket -> front-end temps reel).

## Demarrage rapide
1. Broker MQTT
   - `cd docker`
   - `docker compose up -d`

2. Serveur bridge MQTT -> WebSocket
   - `cd server-bridge`
   - `npm install`
   - `npm run dev`

3. Web dashboard (client WebSocket)
   - `cd web-dashboard`
   - `npm run dev`
   - Ouvrir `http://localhost:5173`

4. ESP32
   - Ouvrir `esp32-device/` (PlatformIO ou Arduino)
   - Configurer `src/config.h`
   - Flasher la carte

## Architecture
- `contracts/` : contrat des topics et payloads
- `docker/` : broker MQTT local
- `esp32-device/` : device simule telemetrie + recoit commandes
- `server-bridge/` : bridge MQTT -> WebSocket + commandes retour
- `web-dashboard/` : UI temps reel

## Exercices
Chaque etape de la journee est declinee en exercice dans `exercises/`.

## Variables utiles
- `MQTT_URL` (server-bridge) : `mqtt://localhost:1883`
- `WS_PORT` (server-bridge) : `8080`
- `PORT` (web-dashboard) : `5173`

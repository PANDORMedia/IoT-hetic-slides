# J2 — ESP32 (télémétrie simulée) → MQTT → Serveur WebSocket → Front-end temps réel

## Fil conducteur (exercice unique de la journée)
Construire **un mini-système IoT complet** :
- **ESP32** simule des mesures (température/humidité/batterie) et publie en **MQTT**
- **Serveur** (Node.js) fait le **bridge MQTT → WebSocket** + relais des commandes
- **Front-end** affiche en temps réel via **WebSocket** + envoie des commandes (LED / intervalle)

---

## Objectifs (fin de journée)
- ESP32 publie `telemetry` + `events` et reçoit `cmd`
- Serveur diffuse en WebSocket aux navigateurs connectés
- Dashboard web : valeurs live + état connexion + bouton commande LED + réglage intervalle
- Démo robuste : reboot ESP32 / coupure broker → reconnexion + reprise

---

## Projets à créer (monorepo)
```
iot-live-dashboard/
  README.md
  docker/
    docker-compose.yml        # broker MQTT
  contracts/
    topics.md                 # topics + formats JSON
    examples.json             # exemples payloads
  esp32-device/
    platformio.ini (ou .ino)
    src/main.cpp
    README.md
  server-bridge/
    package.json
    src/index.ts (ou index.js)
    README.md
  web-dashboard/
    package.json
    src/main.ts (ou main.js)
    index.html
    README.md
```

---

## Contrat de messages (à figer dès le début)
### Topics
- `classroom/<deviceId>/telemetry`
- `classroom/<deviceId>/events`
- `classroom/<deviceId>/cmd`
- `classroom/<deviceId>/status` (optionnel)

### Payloads (JSON)
**telemetry**
```json
{
  "deviceId": "esp32-01",
  "ts": 1736080000,
  "seq": 42,
  "tempC": 22.4,
  "humPct": 48.1,
  "batteryPct": 87
}
```

**events**
```json
{ "deviceId": "esp32-01", "ts": 1736080000, "type": "boot" }
```

**cmd**
```json
{ "cmd": "LED", "value": 1 }
```

**ack (via events)**
```json
{ "deviceId": "esp32-01", "ts": 1736080000, "type": "ack", "cmd": "LED", "ok": true }
```

---

## Plan de la journée (étapes + livrables)

### 1) Cadrage & initialisation repo (30 min)
**Objectif**
- Avoir un repo prêt + contrat `topics.md` + IDs appareils

**À faire**
- Créer `iot-live-dashboard/`
- Écrire `contracts/topics.md` + `contracts/examples.json`
- Choisir `deviceId` (format: `esp32-XX`)

**Checkpoints**
- `contracts/` existe et est partagé à toute l’équipe

**Livrable**
- Commit: `chore: init monorepo + contracts`

---

### 2) Broker MQTT local (45 min)
**Objectif**
- Broker démarré + test pub/sub OK

**À faire**
- `docker/docker-compose.yml` (mosquitto)
- Lancer le broker
- Tester avec MQTT Explorer **ou** `mosquitto_pub/sub`

**Checkpoints**
- Vous publiez un message test et vous le voyez côté subscriber

**Livrable**
- `docker-compose.yml` + commande de lancement dans `docker/README.md`

---

### 3) ESP32 — Wi-Fi + MQTT + première télémétrie (1h)
**Objectif**
- ESP32 envoie `telemetry` toutes les 1s (valeurs simples)

**À faire**
- Projet `esp32-device/`
- Connexion Wi-Fi
- Connexion MQTT (reconnect si perdu)
- Publier `telemetry` avec `seq` incrémental

**Avancement (fil conducteur)**
- On a “la source de données” branchée au pipeline

**Checkpoints**
- Topic `classroom/esp32-XX/telemetry` reçoit des messages réguliers
- `seq` augmente sans doublons visibles

**Livrable**
- `esp32-device/README.md` : SSID/config + comment tester

---

### 4) ESP32 — simulation réaliste + events + LWT (1h)
**Objectif**
- Données simulées crédibles + événements + statut présence

**À faire**
- Simuler :
  - `tempC` : sinusoïde lente + bruit léger
  - `humPct` : variation douce
  - `batteryPct` : décroissance lente + reset au boot
- Publier event `boot`
- Configurer **Last Will** (LWT) sur `status` (optionnel) ou `events` (`type: offline`)

**Avancement (fil conducteur)**
- Qualité/fiabilité des messages + détection offline

**Checkpoints**
- En reboot, vous voyez `boot`
- En coupant l’alim, vous voyez `offline` (si LWT)

**Livrable**
- Commit: `feat(esp32): simulated telemetry + events + lwt`

---

### 5) Serveur — bridge MQTT → WebSocket (1h)
**Objectif**
- Un serveur reçoit MQTT et push en WebSocket aux clients

**À faire**
- Projet `server-bridge/` (Node.js)
- Se connecter au broker MQTT
- `subscribe` sur `classroom/+/telemetry` et `classroom/+/events`
- Démarrer WebSocket (ex: `ws://localhost:8080/ws`)
- Broadcast aux clients :
  - type `telemetry` et `events`
- Garder en mémoire `lastTelemetryByDeviceId`

**Avancement (fil conducteur)**
- Pipeline complet côté backend (MQTT → WS)

**Checkpoints**
- En lançant le serveur, il log des messages MQTT reçus
- En se connectant via un client WS, on reçoit le flux

**Livrable**
- `server-bridge/README.md` : run + variables env broker/port

---

### 6) Front-end — connexion WebSocket + affichage live (1h)
**Objectif**
- Dashboard minimal : device list + valeurs courantes + état connexion

**À faire**
- Projet `web-dashboard/` (Vite vanilla ou React)
- WebSocket client vers `ws://localhost:8080/ws`
- UI :
  - “Connected / Disconnected”
  - Liste des `deviceId` vus
  - Dernière `tempC/humPct/batteryPct` par device

**Avancement (fil conducteur)**
- Visualisation temps réel opérationnelle

**Checkpoints**
- Ouvrir 2 onglets : tous reçoivent la télémétrie
- Si serveur stop → UI passe en disconnected

**Livrable**
- `web-dashboard/README.md` : run + URL WS

---

### 7) Commandes — Front → WS → Serveur → MQTT → ESP32 (1h15)
**Objectif**
- Contrôle bidirectionnel : commander LED + réglage intervalle

**À faire**
- Front-end :
  - bouton LED ON/OFF
  - input `intervalMs` + bouton “Apply”
  - envoyer sur WS : `{ "type":"cmd", "deviceId":"esp32-01", "cmd":"LED", "value":1 }`
- Serveur :
  - recevoir messages WS
  - publier en MQTT sur `classroom/<deviceId>/cmd`
- ESP32 :
  - subscribe `.../cmd`
  - exécuter `LED` + `INTERVAL_MS`
  - publier `ack` via `events`

**Avancement (fil conducteur)**
- Système interactif complet (télémétrie + commande + ack)

**Checkpoints**
- LED change d’état sur commande web
- Intervalle de publication change réellement
- Le front affiche l’ACK (succès/échec)

**Livrable**
- Commit: `feat: websocket commands + mqtt cmd + ack`

---

### 8) Robustesse & démo finale (45 min)
**Objectif**
- Scénario de démo stable + gestion reconnexion

**À faire**
- ESP32 : backoff simple sur reconnect MQTT + keepalive
- Serveur : gérer reconnect MQTT + WS ping/pong
- Front : auto-reconnect WS + UI état
- Script de démo (3 minutes) :
  1) ouvrir dashboard
  2) montrer télémétrie live
  3) LED ON/OFF
  4) changer intervalle
  5) couper broker 10s puis relancer → reprise
  6) reboot ESP32 → `boot` + reprise

**Checkpoints**
- Reprise automatique après incident (sans relancer tout à la main)

**Livrable**
- `README.md` racine : “How to run all” + scénario de démo

---

## Extensions (si avance)
- Multi-devices : 3 ESP32 avec `deviceId` différents
- Mini-alerte : si `tempC > seuil` → event `alert` + badge rouge UI
- Persist config côté serveur (fichier JSON) : dernier `intervalMs` par device
- Historique 60 points côté front (mini-graph rolling)

---

## Définition de “terminé” (validation)
- `docker compose up` → broker OK
- `npm install && npm run dev` (server + web) → dashboard OK
- Flash ESP32 → télémétrie visible
- Commande LED + intervalle depuis le dashboard + ACK visible
- Reconnect fonctionne après coupure broker / reboot ESP32

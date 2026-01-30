# J3 - Projet Flipper IoT

Un flipper contrôlé par hardware ESP32 !

## Architecture

```
ESP32 (Boutons + Plunger)
         │
         │ Serial/USB (JSON)
         ▼
    Node.js Bridge
         │
         │ WebSocket
         ▼
   Frontend (Jeu Flipper)
```

## Quick Start

### 1. ESP32

1. Ouvrir `esp32-controller/flipper.ino` dans Arduino IDE
2. Adapter les pins selon votre câblage
3. Flasher sur l'ESP32
4. Noter le port série (ex: `/dev/tty.usbserial-0001`)

### 2. Bridge

```bash
cd bridge
npm install
# Adapter le port série dans index.js
node index.js
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Ouvrir http://localhost:3000
```

## Câblage

### Boutons Flippers
- Bouton gauche : GPIO 4 → GND
- Bouton droite : GPIO 16 → GND
- (Utiliser INPUT_PULLUP)

### Plunger (Bonus)
- Potentiomètre :
  - Pin 1 → 3.3V
  - Pin 2 → GPIO 34
  - Pin 3 → GND

## Protocole

### ESP32 → Bridge

```json
{"type":"flipper","side":"left","state":"down"}
{"type":"flipper","side":"left","state":"up"}
{"type":"flipper","side":"right","state":"down"}
{"type":"flipper","side":"right","state":"up"}
{"type":"plunger","value":0.75}
{"type":"launch","power":0.9}
```

### Bridge → ESP32 (optionnel)

```json
{"type":"rumble","duration":100}
{"type":"score","value":12500}
```

## Exercices

Voir le dossier `exercises/` pour les guides étape par étape :
1. `01-esp32-buttons.md` - Câblage et code boutons
2. `02-bridge-setup.md` - Configuration du bridge
3. `03-connect-frontend.md` - Test end-to-end
4. `04-bonus-plunger.md` - Ajout du plunger analogique

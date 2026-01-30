# Exercice 2 - Bridge Setup

## Objectif

Configurer le bridge Node.js qui relie l'ESP32 (Serial) au frontend (WebSocket).

## Prérequis

- Node.js installé (v18+)
- ESP32 flashé et connecté (Exercice 1)
- Port série identifié

## Trouver le port série

### macOS
```bash
ls /dev/tty.usb*
# Exemple: /dev/tty.usbserial-0001
```

### Linux
```bash
ls /dev/ttyUSB*
# ou
ls /dev/ttyACM*
# Exemple: /dev/ttyUSB0
```

### Windows
Ouvrir le Gestionnaire de périphériques → Ports (COM & LPT)
Exemple: `COM3`

## Installation

```bash
cd J3-Flipper/bridge
npm install
```

## Configuration

Éditer `index.js` et modifier la ligne `SERIAL_PORT` :

```javascript
const SERIAL_PORT = '/dev/tty.usbserial-XXXX';  // Adapter !
```

Ou utiliser une variable d'environnement :

```bash
SERIAL_PORT=/dev/ttyUSB0 node index.js
```

## Lancement

```bash
node index.js
```

Sortie attendue :
```
[Bridge] Attempting to connect to /dev/tty.usbserial-0001...
[Serial] Connected to /dev/tty.usbserial-0001 at 115200 baud
[WebSocket] Server listening on ws://localhost:8080
```

## Test avec le Serial Monitor

1. Garder le bridge lancé
2. Appuyer sur les boutons de l'ESP32
3. Vérifier que les messages apparaissent dans le terminal du bridge :

```
[ESP32 →] {"type":"flipper","side":"left","state":"down"}
[ESP32 →] {"type":"flipper","side":"left","state":"up"}
```

## Test WebSocket

Dans un autre terminal, tester avec `websocat` (ou un client WS) :

```bash
# Installation websocat (optionnel)
brew install websocat  # macOS
# ou
cargo install websocat  # avec Rust

# Test
websocat ws://localhost:8080
```

Appuyer sur les boutons devrait afficher les messages JSON.

## Checkpoints

1. [ ] Le bridge démarre sans erreur
2. [ ] "Serial Connected" s'affiche
3. [ ] Les messages ESP32 apparaissent dans le terminal
4. [ ] Un client WebSocket peut se connecter

## Problèmes courants

### "Failed to open port"

1. Vérifier que le port existe : `ls /dev/tty.usb*`
2. Fermer l'Arduino IDE (il bloque le port)
3. Vérifier les permissions : `sudo chmod 666 /dev/ttyUSB0`

### "EACCES" (Linux)

Ajouter l'utilisateur au groupe dialout :
```bash
sudo usermod -a -G dialout $USER
# Puis se reconnecter
```

## Étape suivante

Bridge fonctionnel ? Passez à l'exercice 3 pour connecter le frontend !

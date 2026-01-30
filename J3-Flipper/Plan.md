# Jour 3 — Le Hardware en profondeur

## Vue d'ensemble

**Durée** : 1 journée (~6h)
**Prérequis** : J1 (bases Arduino) + J2-Alt (architecture IoT)
**Matériel** : ESP32, LEDs, résistances, boutons, DHT22, potentiomètre (optionnel)

## Objectifs pédagogiques

1. Comprendre l'architecture interne d'un microcontrôleur
2. Maîtriser la différence digital vs analogique (ADC, DAC, PWM)
3. Savoir lire les datasheets et pinouts
4. Mettre en pratique avec des projets concrets

## Déroulé

### Partie 1 : Théorie Hardware (1h30)

| Durée | Sujet | Notes |
|-------|-------|-------|
| 10 min | Rappel J2-Alt + Objectifs | Transition vers le hardware |
| 15 min | Architecture MCU | CPU, RAM, Flash, Périphériques |
| 10 min | ESP32 Specs | Comparaison avec Arduino Uno |
| 15 min | Pinout & Zones dangereuses | Strapping pins, flash SPI, input-only |
| 20 min | Digital vs Analogique | HIGH/LOW vs valeurs continues |
| 20 min | ADC, DAC, PWM | Conversions, duty cycle |

### Partie 2 : TPs Pratiques (4h30)

#### TP1 : LED simple (30 min)
- Câblage LED + résistance
- Code non-bloquant avec `millis()`
- **Checkpoint** : LED clignote sans `delay()`

#### TP2 : Bouton + LED (45 min)
- Câblage bouton avec INPUT_PULLUP
- Implémentation debounce 30ms
- **Checkpoint** : Un appui = un toggle

#### TP3 : Station Météo (1h)
- Installation bibliothèque DHT
- Câblage DHT22 avec pull-up externe
- Lecture température + humidité
- Gestion des erreurs
- **Checkpoint** : Données toutes les 2 secondes

#### TP4 : Projet Flipper (2h15)
- Comprendre l'architecture ESP32 → Bridge → Frontend
- Implémenter le protocole JSON
- Flasher et tester les boutons
- **Checkpoint** : Flippers contrôlés par hardware
- **Bonus** : Plunger analogique

## Matériel requis

### Par étudiant
- 1 ESP32 DevKit
- 1 câble USB
- 1 breadboard
- 2 LEDs (rouge, verte)
- 2 résistances 220Ω
- 2 boutons poussoirs
- 1 DHT22 (ou DHT11)
- 1 résistance 10kΩ (pull-up DHT)
- 1 potentiomètre 10kΩ (optionnel, pour plunger)
- Fils de connexion

### Pour le formateur
- Projets J3-Flipper pré-installés (npm install fait)
- Multimètre pour debug
- Écran OLED I2C (démo optionnelle)

## Fichiers fournis

```
J3-Flipper/
├── README.md              # Guide rapide
├── Plan.md                # Ce fichier
├── esp32-controller/
│   └── flipper.ino        # Code ESP32 complet
├── bridge/
│   ├── package.json
│   └── index.js           # Bridge Serial ↔ WebSocket
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── main.js        # Jeu de flipper
│       └── style.css
└── exercises/
    ├── 01-esp32-buttons.md
    ├── 02-bridge-setup.md
    ├── 03-connect-frontend.md
    └── 04-bonus-plunger.md
```

## Livrables attendus

1. `J3_TP1_LED.ino` — LED non-bloquante
2. `J3_TP2_Button_LED.ino` — Bouton avec debounce
3. `J3_TP3_Meteo.ino` — Station météo fonctionnelle
4. `J3_TP4_Flipper.ino` — Contrôleur de flipper

## Bonus / Extensions

- Ajouter un écran OLED I2C pour afficher les données météo
- Combiner Station Météo + MQTT pour un dashboard live
- Ajouter des effets sonores au flipper (buzzer)
- Multi-joueur : plusieurs ESP32 contrôlant le même flipper

## Problèmes fréquents

### DHT22 ne répond pas
- Vérifier le pull-up 10kΩ
- Vérifier le pin (DATA sur pin 2 du DHT)
- Attendre 2 secondes entre les lectures

### Boutons double-toggle
- Augmenter DEBOUNCE_MS (30-50ms)
- Vérifier le câblage vers GND

### Bridge ne trouve pas le port série
- Fermer Arduino IDE
- `ls /dev/tty.usb*` pour trouver le port
- Adapter SERIAL_PORT dans le code

### Frontend ne se connecte pas
- Vérifier que le bridge tourne (port 8080)
- Ouvrir la console navigateur pour voir les erreurs

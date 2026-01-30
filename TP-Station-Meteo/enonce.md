# TP Station Météo Connectée - HETIC WEB3

**Travail en groupe** : 3-4 personnes
**Rendu** : Aujourd'hui 16h00
**Matériel** : ESP32, DHT22 (partagé), 1 bouton, 2 LEDs, résistances

---

## Objectif

Réaliser une station météo connectée qui :
- Lit température et humidité (DHT22)
- Affiche les données sur une interface web en temps réel
- Permet de basculer entre °C et °F via un bouton physique
- Indique le mode actuel avec 2 LEDs (une par unité)

---

## Contrainte matérielle importante

**7 capteurs DHT22 disponibles pour toute la promo.**

Vous devez :
1. Développer un **mode simulation** qui génère des données fictives
2. Valider votre code sur **TinkerCAD** avant d'emprunter un capteur
3. Emprunter le DHT22 uniquement pour les tests finaux

Le code final doit pouvoir basculer entre mode simulation et mode réel.

---

## Spécifications fonctionnelles

### Hardware (ESP32)

| Composant | Fonction |
|-----------|----------|
| DHT22 | Lecture température + humidité |
| Bouton | Bascule °C ↔ °F |
| LED 1 | Allumée = mode Celsius |
| LED 2 | Allumée = mode Fahrenheit |

- Le bouton doit être anti-rebond (debounce)
- Une seule LED allumée à la fois
- Datasheet DHT22 : https://cdn.sparkfun.com/assets/f/7/d/9/c/DHT22.pdf

### Communication

- Protocole : **MQTT**
- Format des messages : **JSON**
- La station publie ses données périodiquement
- L'interface web s'abonne et affiche en temps réel

---

## Deux parcours au choix

### Parcours A — Infrastructure fournie

Utiliser le broker MQTT mutualisé :

```
Host : captain.dev0.pandor.cloud
Port : 1884
Auth : aucune
```

**À réaliser :**
1. Code ESP32 (lecture capteur + publication MQTT)
2. Bridge WebSocket (relai MQTT → navigateur)
3. Interface web (affichage temps réel)

### Parcours B — Infrastructure autonome

Installer votre propre infrastructure sur Raspberry Pi :

**À réaliser :**
1. Tout le parcours A, plus :
2. Broker Mosquitto sur le Raspberry Pi
3. Serveur web sur le Raspberry Pi
4. Configuration du Pi en **Access Point** (point d'accès WiFi)

L'objectif : un kiosque météo autonome, sans dépendance internet.

---

## Bonus

Permettre de changer l'unité (°C/°F) depuis l'interface web.
La commande doit être envoyée à l'ESP32 qui met à jour ses LEDs.

---

## Étapes suggérées

### 1. Préparation (sans matériel)

- [ ] Définir le schéma de câblage
- [ ] Choisir les pins GPIO
- [ ] Définir le format JSON des messages
- [ ] Définir les topics MQTT

### 2. Code ESP32 — Mode simulation

- [ ] Implémenter la génération de données fictives
- [ ] Implémenter le bouton avec debounce
- [ ] Implémenter les LEDs indicatrices
- [ ] Tester sur TinkerCAD

### 3. Communication MQTT

- [ ] Connexion WiFi
- [ ] Connexion au broker MQTT
- [ ] Publication des données
- [ ] (Bonus) Réception des commandes

### 4. Interface web

- [ ] Bridge MQTT → WebSocket
- [ ] Page HTML avec affichage temps réel
- [ ] (Bonus) Bouton pour changer l'unité

### 5. Intégration DHT22

- [ ] Emprunter un capteur
- [ ] Adapter le code pour lecture réelle
- [ ] Valider le fonctionnement complet

### 6. Parcours B uniquement

- [ ] Installer Mosquitto sur le Pi
- [ ] Configurer le Pi en Access Point
- [ ] Déployer le serveur web
- [ ] Tester en mode autonome

---

## Livrables

**Rendu via repository Git** — l'historique des commits de chaque membre fait foi sur la contribution individuelle.

**Envoyer le lien du repo à : sean@pandor.media**

### Contenu attendu

1. **Code source** (ESP32 + Bridge + Frontend)
2. **Dossier `docs/`** contenant :
   - Photos du montage hardware
   - Screenshots TinkerCAD
   - Schéma de câblage
3. **Dossier `config/`** (Parcours B uniquement) :
   - Fichiers de configuration Raspberry Pi
   - Documentation pour reproduire la configuration (Access Point, Mosquitto, etc.)
4. **README.md** avec instructions de lancement
5. **Démonstration fonctionnelle** en fin de journée

### Structure du repository

```
station-meteo/
├── esp32/
│   └── station.ino
├── bridge/
│   └── ...
├── frontend/
│   └── ...
├── docs/
│   ├── photos/
│   │   └── montage.jpg
│   ├── tinkercad/
│   │   └── simulation.png
│   └── schema-cablage.png
├── config/                    # Parcours B
│   ├── mosquitto.conf
│   ├── hostapd.conf
│   └── SETUP.md              # Tuto reproduction
└── README.md
```

---

## Ressources

- Datasheet DHT22 : https://cdn.sparkfun.com/assets/f/7/d/9/c/DHT22.pdf
- TinkerCAD : https://www.tinkercad.com/
- Bibliothèque DHT : Adafruit DHT sensor library
- Bibliothèque MQTT : PubSubClient

---

## Critères d'évaluation

- Fonctionnement du mode simulation
- Fonctionnement avec capteur réel
- Qualité du code (lisibilité, structure)
- Interface web fonctionnelle
- Bonus réalisés

# Exercice 3 - ESP32 (Wi-Fi + MQTT + telemetrie)

## Objectif
Connecter l'ESP32 au Wi-Fi et publier une telemetrie simple.

## Walkthrough
1. Configurer `esp32-device/src/config.h`.
2. Demarrer la connexion Wi-Fi dans `setup()`.
3. Se connecter au broker MQTT et publier `telemetry` toutes les 1s.
4. Ajouter un compteur `seq` pour verifier l'ordre des messages.

## Checkpoints
- Les messages arrivent sur `classroom/<deviceId>/telemetry`.
- `seq` augmente sans reset intempestif.

## Aide
- Si MQTT ne se connecte pas, verifiez l'IP du broker et le reseau Wi-Fi.
- Affichez l'etat Wi-Fi et MQTT dans le Serial Monitor.
- Commencez par publier un JSON minimal puis ajoutez les champs.

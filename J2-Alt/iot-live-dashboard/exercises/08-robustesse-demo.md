# Exercice 8 - Robustesse et demo finale

## Objectif
Stabiliser le systeme et preparer la demo.

## Walkthrough
1. ESP32 : reconnect MQTT avec backoff simple.
2. Serveur : ping/pong WS et reconnect MQTT.
3. Front : auto-reconnect WS + etat UI.
4. Script de demo (3 minutes) :
   - ouvrir dashboard
   - telemetrie live
   - LED ON/OFF
   - changer intervalle
   - couper broker 10s puis relancer
   - reboot ESP32

## Checkpoints
- Reprise automatique apres coupure broker.
- UI stable sans refresh manuel.

## Aide
- Simulez une coupure broker pour valider la reconnexion.
- Ajoutez un retry simple (2s, 4s, 8s).
- Pour la demo, gardez un script clair et court.

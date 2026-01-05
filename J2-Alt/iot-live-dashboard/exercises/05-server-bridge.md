# Exercice 5 - Serveur bridge MQTT -> WebSocket

## Objectif
Recevoir MQTT et diffuser en WebSocket.

## Walkthrough
1. Installer les deps (`mqtt`, `ws`).
2. Se connecter au broker et s'abonner a `classroom/+/telemetry` et `classroom/+/events`.
3. Ouvrir un serveur WS sur `/ws`.
4. Broadcast des messages aux clients connectes.
5. Garder un cache `lastTelemetryByDeviceId`.

## Checkpoints
- Les logs serveur affichent les messages MQTT.
- Un client WS recoit le flux en temps reel.

## Aide
- Logguez `topic` + `payload` au debut pour verifier.
- Si le WS ne recoit rien, verifiez le path `/ws`.
- Testez avec un client WS simple avant d'integrer le front.

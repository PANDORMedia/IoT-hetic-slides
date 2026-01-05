# Exercice 7 - Commandes bout en bout

## Objectif
Commander la LED et l'intervalle depuis le dashboard.

## Walkthrough
1. Front-end : envoyer `{ type: "cmd", deviceId, cmd, value }`.
2. Serveur : publier sur `classroom/<deviceId>/cmd`.
3. ESP32 : executer `LED` et `INTERVAL_MS`.
4. ESP32 : publier un `ack` dans `events`.

## Checkpoints
- La LED change d'etat depuis le web.
- L'intervalle de publication change.
- Un `ack` apparait dans le front.

## Aide
- Format WS: `{ "type": "cmd", "deviceId": "...", "cmd": "LED", "value": 1 }`.
- Verifiez que l'ESP32 est abonne a `.../cmd`.
- L'ACK arrive dans `events` avec `type: "ack"`.

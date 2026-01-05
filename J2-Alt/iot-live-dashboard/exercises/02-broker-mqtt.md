# Exercice 2 - Broker MQTT local

## Objectif
Demarrer un broker MQTT local et valider un premier pub/sub.

## Installation Docker (si besoin)
### Windows (Docker Desktop)
1. Installer Docker Desktop : https://www.docker.com/products/docker-desktop/
2. Activer WSL2 si demande (redemarrage requis).
3. Lancer Docker Desktop et verifier que le daemon tourne.

### Linux (Docker Engine)
1. Installer Docker Engine + Docker Compose (plugin).
2. Ajouter l'utilisateur au groupe `docker` puis se reconnecter.
3. Verifier : `docker --version` et `docker compose version`.

## Walkthrough
1. Ouvrir `docker/docker-compose.yml` et verifier le port 1883.
2. Lancer `docker compose up -d`.
3. Tester avec `mosquitto_pub` et `mosquitto_sub` ou un outil GUI.

## Checkpoints
- Un message publie sur `classroom/test/telemetry` est recu par un subscriber.
- Le broker reste accessible apres redemarrage.

## Aide
- Verifiez l'etat avec `docker compose ps`.
- Sur Windows, Docker Desktop doit etre demarre.
- Si le port 1883 est occupe, arretez l'autre broker local.
- Test minimal: un `mosquitto_pub` + un `mosquitto_sub` sur le meme topic.

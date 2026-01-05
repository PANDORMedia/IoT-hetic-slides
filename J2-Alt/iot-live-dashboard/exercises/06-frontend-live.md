# Exercice 6 - Front-end live

## Objectif
Afficher les mesures en temps reel via WebSocket.

## Walkthrough
1. Creer une page `index.html` + `src/main.js`.
2. Se connecter au WS `ws://localhost:8080/ws`.
3. Afficher la liste des devices et leurs dernieres valeurs.
4. Gerer l'etat Connected/Disconnected.

## Checkpoints
- Deux onglets affichent la meme telemetrie.
- Si le serveur stoppe, l'UI passe en disconnected.

## Aide
- L'URL WS par defaut est `ws://localhost:8080/ws`.
- Gardez un objet `devices` pour stocker le dernier etat.
- Si rien ne s'affiche, ouvrez la console.

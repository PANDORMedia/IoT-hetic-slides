# Exercice 3 - Connect Frontend

## Objectif

Lancer le frontend et jouer au flipper avec les boutons hardware !

## Prérequis

- ESP32 fonctionnel (Exercice 1)
- Bridge lancé (Exercice 2)

## Installation du frontend

```bash
cd J3-Flipper/frontend
npm install
```

## Lancement

```bash
npm run dev
```

Sortie attendue :
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Test

1. Ouvrir `http://localhost:5173` dans le navigateur
2. Vérifier l'indicateur de connexion (en haut à droite)
   - Rouge = Déconnecté
   - Vert = Connecté
3. Appuyer sur les boutons physiques
4. Les flippers du jeu doivent bouger !

## Contrôles

### Hardware (ESP32)
- Bouton gauche → Flipper gauche
- Bouton droite → Flipper droite
- (Bonus) Plunger → Lance-bille

### Clavier (fallback)
- `A` ou `←` → Flipper gauche
- `L` ou `→` → Flipper droite
- `Espace` → Lancer la bille

## Checkpoints

1. [ ] Le frontend s'affiche
2. [ ] L'indicateur passe au vert
3. [ ] Les boutons physiques contrôlent les flippers
4. [ ] Le jeu est jouable end-to-end

## Debug

Ouvrir la console du navigateur (F12) pour voir :
- Les messages WebSocket reçus
- Les erreurs éventuelles

Le panel "Debug Log" en bas de page affiche aussi les événements.

## Architecture complète

```
┌─────────────────┐
│   Boutons       │
│   physiques     │
└────────┬────────┘
         │ GPIO
         ▼
┌─────────────────┐
│     ESP32       │
│   (flipper.ino) │
└────────┬────────┘
         │ Serial/USB (JSON)
         ▼
┌─────────────────┐
│     Bridge      │
│   (index.js)    │
└────────┬────────┘
         │ WebSocket
         ▼
┌─────────────────┐
│    Frontend     │
│   (main.js)     │
└─────────────────┘
```

## Problèmes courants

### Connexion WebSocket échoue

1. Vérifier que le bridge tourne sur le port 8080
2. Vérifier l'URL dans `main.js` : `ws://localhost:8080`

### Flippers ne bougent pas

1. Vérifier le Debug Log pour les messages entrants
2. Vérifier que le format JSON est correct
3. Tester avec les touches clavier (A/L)

### Latence élevée

Normal si vous utilisez WiFi + USB. Pour réduire :
- Diminuer `DEBOUNCE_MS` (ex: 5ms)
- Réduire le delay dans la loop ESP32

## Étape suivante

Le jeu fonctionne ? Passez à l'exercice 4 pour ajouter le plunger analogique !

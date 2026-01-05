# Exercice 4 - Simulation realiste + events + LWT

## Objectif
Rendre les donnees credibles et ajouter des evenements.

## Walkthrough
1. Simuler `tempC` et `humPct` avec une variation lente + bruit.
2. Simuler `batteryPct` qui descend puis remonte.
3. Publier un event `boot` au premier connect.
4. Configurer un LWT sur `status` ou `events` pour signaler `offline`.

## Checkpoints
- Un reboot publie `boot`.
- Une coupure d'alim declenche `offline` (si LWT).

## Aide
- Utilisez `sinf()` + `millis()` pour une variation douce.
- L'event `boot` doit etre emis une seule fois.
- Le LWT se configure au moment du `connect()` MQTT.

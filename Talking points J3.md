# Talking Points J3 — Le Hardware en profondeur

## Notes d'audit (continuité J1 → J2-Alt → J3)

### Ce que les étudiants savent de J1 :
- Installation Arduino IDE, sélection de carte
- Boucles non-bloquantes avec `millis()` (pas de `delay()`)
- Communication série à 115200 baud
- Parsing de commandes simples (`STATUS` → `LED=ON/OFF`)
- Sortie LED avec `digitalWrite()`

### Ce que les étudiants savent de J2-Alt :
- Stack IoT complète : ESP32 → MQTT → WebSocket → Dashboard
- Docker pour les services (broker Mosquitto)
- Contrats de messages JSON (télémétrie, événements, commandes)
- Node.js comme bridge/relais
- Communication bidirectionnelle (commandes web → device)
- **Capteurs SIMULÉS** (données synthétiques temp/humidité/batterie)
- Patterns de reconnexion avec backoff

### Lacune à combler en J3 :
- **Entrées physiques pas encore vues** — J2-Alt utilisait la simulation, les étudiants n'ont PAS encore câblé de vrais boutons
- **Résistances pull-up/pull-down** — concept non introduit
- **Debounce (anti-rebond)** — complètement nouveau, il faut expliquer POURQUOI les rebonds existent
- **Lecture analogique** — J2-Alt simulait les valeurs ADC, maintenant on lit de vrais capteurs

---

## Points clés section par section

---

### Rappel J2-Alt (10 min)

**Points clés :**
- Récap rapide : "Vous avez construit un pipeline IoT complet la dernière fois"
- ESP32 → MQTT → WebSocket → Dashboard
- Les données capteurs étaient **simulées** (fausses valeurs)
- Aujourd'hui : on passe au **réel** — vrai hardware, vrais signaux

**Phrase de transition :**
> "J2-Alt vous a montré la stack logicielle. Aujourd'hui on ouvre le capot et on comprend ce qui se passe dans la puce."

---

### Partie 1 : Architecture Hardware (1h30 au total)

#### Architecture MCU (15 min)

**Définitions clés :**
- **MCU (Microcontroller Unit)** — ordinateur complet sur une seule puce
- **CPU** — exécute les instructions (240 MHz dual-core sur ESP32)
- **RAM** — stockage volatil pour les variables (520 Ko SRAM)
- **Flash** — stockage persistant pour votre code (4 Mo)
- **Périphériques** — interfaces vers le monde réel (GPIO, ADC, UART, SPI, I2C)

**Points à aborder :**
- Contrairement à un PC, tout est intégré — pas de composants séparés
- ESP32 est ~30x plus rapide qu'Arduino Uno (240 MHz vs 16 MHz)
- La RAM est minuscule comparée à un PC (520 Ko vs 16 Go)
- La Flash contient votre sketch + mises à jour OTA

**Question à poser aux étudiants :**
> "Que se passe-t-il quand on manque de RAM ?" (Réponse : crash, comportement indéfini, stack overflow)

---

#### Pinout & Zones dangereuses (15 min)

**Définitions clés :**
- **GPIO (General Purpose Input/Output)** — pins digitaux configurables
- **Strapping pins** — affectent le mode de boot (GPIO 0, 2, 15)
- **Pins input-only** — ne peuvent pas être en sortie (GPIO 34-39)

**Points à aborder :**
- Les 34 pins GPIO ne sont pas tous utilisables
- GPIO 6-11 = **NE JAMAIS TOUCHER** (flash interne)
- GPIO 34-39 = entrée seulement, pas de pull-up interne
- Pins sûrs : 4, 5, 12-14, 16-33

**Avertissement à souligner :**
> "Si vous câblez quelque chose sur GPIO 6-11, votre ESP32 ne démarrera pas. Il utilise ces pins pour lire sa propre mémoire flash."

**Conseil pratique :**
> "Ayez toujours le schéma pinout ouvert quand vous câblez. Mettez en favori randomnerdtutorials.com/esp32-pinout-reference-gpios/"

---

#### Digital vs Analogique (20 min)

**Définitions clés :**
- **Signal digital** — seulement 2 états : HIGH (3.3V) ou LOW (0V)
- **Signal analogique** — plage continue (0V à 3.3V)
- **ADC (Analog-to-Digital Converter)** — lit l'analogique, sort un nombre (0-4095)
- **DAC (Digital-to-Analog Converter)** — sort une vraie tension analogique
- **PWM (Pulse Width Modulation)** — faux analogique via commutation rapide

**Points à aborder :**
- Digital = oui/non, on/off (boutons, LEDs, relais)
- Analogique = mesures du monde réel (température, lumière, son)
- L'ADC convertit le monde physique en nombres exploitables par le code
- ADC 12 bits = 4096 niveaux = résolution ~0.8mV

**Analogie à utiliser :**
> "Le digital c'est comme un interrupteur — allumé ou éteint. L'analogique c'est comme un variateur — n'importe quelle valeur entre les deux."

**Code à mettre en avant :**
```cpp
int raw = analogRead(34);           // 0-4095
float voltage = raw * 3.3 / 4095;   // Conversion en volts
```

---

#### ADC, DAC, PWM (20 min)

**Définitions clés :**
- **Duty cycle (rapport cyclique)** — pourcentage du temps où le signal est HIGH (PWM)
- **Résolution** — nombre de bits (ADC 12 bits = 4096 niveaux)

**Points à aborder :**
- ADC disponible sur GPIO 32-39 (plus quelques autres)
- DAC uniquement sur GPIO 25 et 26 — très limité !
- Le PWM est la solution de contournement — tous les GPIO peuvent faire du PWM
- PWM 50% duty = LED à ~50% de luminosité (perçue)

**Suggestion de démo :**
> Montrer l'effet LED qui "respire" avec PWM qui monte/descend progressivement

**Particularité ESP32 :**
> "L'ESP32 utilise LEDC (LED Control) pour le PWM, pas la syntaxe `analogWrite()` d'Arduino"

---

### Partie 2 : TPs Pratiques (4h30 au total)

---

#### TP1 : LED simple (30 min) — ÉCHAUFFEMENT

**Note :** Les étudiants ont déjà fait ça en J1. Présenter comme échauffement rapide / vérification hardware.

**Objectif :** Vérifier que le hardware fonctionne, rafraîchir le pattern `millis()`

**Points à aborder :**
- "C'est une révision de J1 — ça devrait prendre 10 minutes si tout marche"
- Focus sur le câblage LED externe (pas la LED intégrée)
- Résistance en série : 220-330Ω (évite de griller la LED)

**Question checkpoint :**
> "Qui a sa LED qui clignote ? Si non, quelle erreur voyez-vous ?"

**Problèmes courants :**
- LED à l'envers (grande patte = anode = positif)
- Mauvais numéro GPIO dans le code
- Problème d'alimentation USB (essayer autre port/câble)

---

#### TP2 : Bouton + LED (45 min) — NOUVEAU CONCEPT

**IMPORTANT :** C'est la première fois que les étudiants câblent un bouton physique. J2-Alt était que de la simulation.

**Définitions clés à introduire :**
- **Résistance pull-up** — maintient le pin à HIGH quand le bouton n'est pas pressé
- **INPUT_PULLUP** — utilise la résistance pull-up interne
- **Entrée flottante** — état indéfini, capte du bruit (MAUVAIS)
- **Debounce (anti-rebond)** — filtrer le bruit électrique de l'appui bouton
- **Détection de front** — détecter le moment du changement (front montant/descendant)

**Pourquoi le debounce est important :**
> "Quand vous appuyez sur un bouton, les contacts métalliques rebondissent littéralement. Pendant 10-30ms, le signal oscille rapidement entre HIGH et LOW. Sans debounce, un appui = 5-10 toggles."

**Points à aborder :**
- Le bouton connecte GPIO à GND quand pressé
- Avec INPUT_PULLUP : non pressé = HIGH, pressé = LOW
- Fenêtre de debounce : 30ms est standard, 10ms pour le gaming
- Vérifier : raw a changé ? Démarrer timer. Timer expiré + toujours changé ? On accepte.

**Pattern de code à souligner :**
```cpp
if (rawPressed != lastRaw) {
    lastRaw = rawPressed;
    lastChange = millis();  // Reset du timer debounce
}
if ((millis() - lastChange) >= DEBOUNCE_MS) {
    // Maintenant c'est stable — on agit
}
```

**Erreur fréquente :**
> "Les étudiants oublient que INPUT_PULLUP inverse la logique : pressé = LOW, pas HIGH"

---

#### TP3 : Station Météo (1h)

**Définitions clés :**
- **DHT22** — capteur digital temp/humidité (protocole one-wire)
- **Résistance pull-up** — externe 10kΩ requise pour le DHT
- **NaN** — Not a Number, indique un échec de lecture capteur

**Points à aborder :**
- DHT22 est plus précis que DHT11 (±0.5°C vs ±2°C)
- Minimum 2 secondes entre les lectures
- Il faut installer la bibliothèque Adafruit DHT
- Le pull-up externe 10kΩ sur la ligne data n'est PAS optionnel

**Lien avec J2-Alt :**
> "Vous vous souvenez de la télémétrie simulée ? Maintenant vous lisez des données RÉELLES. Le format JSON est identique — vous pourriez envoyer ça sur votre dashboard MQTT !"

**Souligner le bonus :**
> "Le format JSON en sortie correspond au contrat télémétrie de J2-Alt. Devoir maison : connectez ça au MQTT et voyez la vraie température sur votre dashboard."

**Gestion d'erreurs :**
```cpp
if (isnan(h) || isnan(t)) {
    Serial.println("ERROR: Lecture DHT echouee!");
    // Faire clignoter la LED pour indiquer l'erreur
}
```

---

#### TP4 : Projet Flipper (2h15)

**Architecture parallèle à J2-Alt :**
```
J2-Alt:  ESP32 → MQTT    → Node.js → WebSocket → Dashboard
J3:      ESP32 → Serial  → Node.js → WebSocket → Jeu
```

**Point clé à dire :**
> "Même pattern d'architecture, transport différent. Serial au lieu de MQTT. Vous savez déjà comment ça marche !"

**Points à aborder :**
- ESP32 envoie du JSON sur Serial (pas MQTT)
- Le bridge Node.js convertit Serial ↔ WebSocket
- Le frontend est fourni — les étudiants construisent le hardware + bridge
- Debounce 10ms (plus rapide que normal — le gaming demande de la vitesse)

**Spécifique au Flipper :**
- Bouton gauche : GPIO 4
- Bouton droit : GPIO 16
- Plunger (bonus) : GPIO 34 (ADC)

**Messages du protocole :**
```json
{"type":"flipper","side":"left","state":"down"}
{"type":"flipper","side":"left","state":"up"}
{"type":"plunger","value":0.75}
{"type":"launch","power":0.9}
```

**Déroulé de la démo :**
1. Flasher l'ESP32
2. Trouver le port série : `ls /dev/tty.usb*`
3. Mettre à jour la config du bridge
4. Lancer le bridge : `node index.js`
5. Ouvrir le frontend dans le navigateur
6. Appuyer sur les boutons → voir les flippers bouger !

**Bonus plunger :**
- Le potentiomètre fournit 0-3.3V
- L'ADC lit 0-4095
- Détecter tirer + relâcher vite = lancement

---

## Résumé des définitions clés (Aide-mémoire)

| Terme | Définition |
|-------|------------|
| **MCU** | Microcontrôleur — ordinateur complet sur une puce |
| **GPIO** | Pin d'entrée/sortie à usage général |
| **ADC** | Convertisseur Analogique-Numérique (lire des tensions) |
| **DAC** | Convertisseur Numérique-Analogique (sortir des tensions) |
| **PWM** | Modulation de largeur d'impulsion (faux analogique via duty cycle) |
| **Pull-up** | Résistance qui maintient le pin à HIGH par défaut |
| **Flottant** | État de pin indéfini — capte du bruit |
| **Debounce** | Filtrage du bruit des boutons (fenêtre 30ms) |
| **INPUT_PULLUP** | Mode Arduino avec pull-up interne activé |
| **Duty cycle** | % du temps où le signal PWM est HIGH |
| **Résolution** | Nombre de niveaux discrets (12 bits = 4096) |

---

## Ajustements recommandés pour les slides J3

### Modifications mineures pour améliorer la transition J2-Alt → J3 :

1. **TP1 pourrait être raccourci** — les étudiants ont déjà fait le blink `millis()` en J1. Le présenter comme "échauffement/vérification hardware" plutôt que TP complet.

2. **Avant TP2, ajouter un slide expliquant :**
   - Ce qu'est une entrée flottante (pourquoi on a besoin de pull-up)
   - Pourquoi les boutons rebondissent (bruit de contact physique)
   - Ça comble le vide puisque J2-Alt était que de la simulation

3. **Bonus JSON du TP3** — insister sur le fait que ça se connecte directement au dashboard J2-Alt. Pourrait même fournir le code MQTT publish en "super bonus".

4. **Slide architecture TP4** — montrer explicitement le parallèle avec l'architecture J2-Alt (même pattern, Serial au lieu de MQTT).

---

## Allocation du temps

| Section | Durée | Notes |
|---------|-------|-------|
| Rappel J2-Alt | 10 min | Récap rapide, poser le contexte |
| Architecture MCU | 15 min | Théorie |
| Specs ESP32 | 10 min | Comparaison |
| Pinout | 15 min | Zones de sécurité |
| Digital vs Analogique | 20 min | Concept central |
| ADC/DAC/PWM | 20 min | Exemples de code |
| **Pause** | 15 min | |
| TP1 : LED | 30 min | Échauffement (révision) |
| TP2 : Bouton | 45 min | NOUVEAU : debounce |
| **Pause** | 15 min | |
| TP3 : Météo | 60 min | Vrais capteurs |
| TP4 : Flipper | 135 min | Projet principal |
| **Total** | ~6h | |

---

## Questions à poser aux étudiants

**Début de journée :**
> "Qu'est-ce qui vous a le plus surpris en J2-Alt ? Qu'aimeriez-vous mieux comprendre ?"

**Avant TP2 :**
> "Pourquoi on ne peut pas juste lire le bouton directement sans debounce ?"

**Avant TP3 :**
> "En quoi lire un vrai DHT22 est différent des données simulées de J2-Alt ?"

**Avant TP4 :**
> "En quoi Serial → WebSocket ressemble à MQTT → WebSocket de J2-Alt ?"

**Fin de journée :**
> "Pourriez-vous combiner la station météo d'aujourd'hui avec le dashboard MQTT de J2-Alt ? Qu'est-ce qu'il faudrait changer ?"

---

## Référence rapide dépannage

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| LED ne clignote pas | Mauvais GPIO / LED à l'envers | Vérifier numéro pin, retourner LED |
| Bouton double-toggle | Pas de debounce / trop court | Augmenter DEBOUNCE_MS à 50ms |
| DHT retourne NaN | Pull-up manquant / mauvais pin | Ajouter pull-up 10kΩ, vérifier câblage |
| Bridge trouve pas le port | Arduino IDE ouvert / mauvais path | Fermer IDE, lancer `ls /dev/tty.usb*` |
| WebSocket ne connecte pas | Bridge pas lancé | Vérifier les erreurs dans le terminal |
| ESP32 ne boot pas | Câblé sur GPIO 6-11 | Retirer les fils, utiliser pins sûrs |

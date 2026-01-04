<!-- .slide: class="title-slide" -->
<p class="kicker">IoT · Arduino IDE · ESP32</p>
# Jour 1 — Retour vers le passé, premier code
<p class="subtitle">Sion GENDERS — Formateur depuis 2011</p>
<p class="subtitle">LinkedIn : https://www.linkedin.com/in/sion-gdrs/</p>

Note:
- Présenter le cadre : culture + atelier.
- Promesse : avant la fin de la séance, flash de l’ESP32.

---

## Plan du jour
1. Histoire et définition de l’IoT
2. IoT avant Internet : bus, série, terrain
3. RS-232 et Telnet : mode terminal
4. Setup Arduino IDE (ESP32)
5. Premier code (Blink + Serial)

Note:
- Donner les timings et l’esprit : moitié culture, moitié atelier.

---

## C’est quoi l’IoT (sans buzzword)
- Des **objets** (capteurs / actionneurs)
- Un **lien de communication** (filaire, radio, bus)
- Des **messages** (petits, fréquents, robustes)
- Un **usage** (mesurer, agir, superviser, automatiser)

<div class="pill-row">
  <div class="pill">Contraintes énergie</div>
  <div class="pill">Latence</div>
  <div class="pill">Fiabilité</div>
</div>

Note:
- IoT ≠ forcément cloud.

---

## Avant “Internet”, on connectait déjà des machines
- Série (UART/RS-232), bus terrain (ex : Modbus), bus embarqués (CAN)
- Objectif : supervision, commande, diagnostic
- Monde industriel : **automates**, **capteurs**, **actionneurs**, **SCADA**

<figure class="media">
  <img src="https://commons.wikimedia.org/wiki/Special:FilePath/DEC_VT100_terminal.jpg" alt="Terminal DEC VT100" />
  <figcaption>Source : <a href="https://commons.wikimedia.org/wiki/File:DEC_VT100_terminal.jpg">Wikimedia Commons — DEC VT100 terminal</a></figcaption>
</figure>

Note:
- Mettre en scène : “Vous pensez Wi-Fi, moi je pense trames”.

---

## Parallèle industrie / informatique (mini-story)

| Informatique | Industrie |
| --- | --- |
| Mainframes → terminaux | Automates → bus terrain |
| Réseaux → standardisation | Supervision → pilotage |
| Protocoles de communication | Protocoles industriels |

Note:
- “Ce cours fait le pont : hardware simple + logiciel simple + messages”.

---

## Timeline “proto-IoT” (1)
- **1950s** : mainframes / UNIVAC (logique centralisée)
- **1960s** : RS-232 (terminaux ↔ machines)
- **1970s** : bus industriels (ex : Modbus)

---

## Timeline “proto-IoT” (2)
- **1982** : distributeur Coca-Cola connecté (CMU)
- **1980s** : CAN bus (embarqué robuste)
- **1983** : Telnet (remote terminal)

Note:
- “On fera du Telnet-like plus tard : commandes texte à distance”.

---

## Timeline “proto-IoT” (3)
- **1991** : coffee pot monitor + XCoffee
- **1999** : “Internet of Things” (le nom arrive après les pratiques)

Note:
- Punchline : “Le mot est récent, l’idée est vieille”.

---

## Pourquoi l’IoT moderne explose ?
- Miniaturisation (MCU puissants et peu chers)
- Sans fil (Wi-Fi / BLE / LPWAN)
- Batteries et low-power
- Outils dev + écosystèmes (libs, cloud, MQTT)

Note:
- Transition : “Ok, assez d’histoire : maintenant on code”.

---

## Notre stack du cours

<div class="diagram">
  <div class="node"><strong>Device</strong> : capteurs, actionneurs, microcontrôleurs</div>
  <div class="node"><strong>Edge</strong> : logique locale, buffering, décisions rapides</div>
  <div class="node"><strong>Réseau</strong> : Wi-Fi, BLE, cellular, LoRa</div>
  <div class="node"><strong>Cloud</strong> : stockage, analytics, orchestration</div>
  <div class="node"><strong>App</strong> : dashboards, alertes, intégrations</div>
</div>

---

## Check matériel (si dispo)
- ESP32 + câble USB
- LED + résistance 220–330Ω
- Bouton poussoir + jumpers + breadboard

<div class="callout check">
  <strong>Check</strong>
  Windows : drivers USB (CH340/CP210x) · Mac : autorisations périphérique · Linux : groupe dialout
</div>

<figure class="media">
  <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Arduino_Uno_-_R3.jpg" alt="Carte Arduino Uno R3" />
  <figcaption>Source : <a href="https://commons.wikimedia.org/wiki/File:Arduino_Uno_-_R3.jpg">Wikimedia Commons — Arduino Uno R3</a></figcaption>
</figure>

Note:
- Si matériel pas dispo : simulateur pour la logique, puis rattrapage.

---

## Setup Arduino IDE (étapes)
1. Installer Arduino IDE (v2.x)
2. Ajouter le support **ESP32** via Boards Manager
3. Choisir la carte (ESP32 Dev Module ou modèle exact)
4. Choisir le port série
5. Upload d’un exemple

<div class="callout demo">
  <strong>Demo</strong>
  Boards Manager → “ESP32 by Espressif Systems” + upload d’un exemple.
</div>

Note:
- Anticiper : port absent, permissions, câble data.

---

## “Retour vers le passé” : Serial = notre RS-232
- Série = un **tuyau texte**
- On envoie des lignes, on lit des réponses
- Même philosophie que les vieux terminaux

<div class="terminal">
  <div><span class="prompt">esp32&gt;</span> STATUS</div>
  <div>LED=ON</div>
</div>

<div class="callout demo">
  <strong>Demo</strong>
  Ouvrir Serial Monitor, changer baudrate, envoyer une commande texte.
</div>

---

## Bonus “Telnet” (culture + teaser)
- Telnet = terminal à distance (TCP)
- Même UX que la série : lignes de commandes
- On refera ça en moderne (TCP sur ESP32)

Note:
- Ne pas configurer un serveur Telnet complet aujourd’hui.

---

## Premier code : Blink (non-bloquant)
- Objectif : LED clignote **sans delay()**
- Notions : `millis()`, période, état

```cpp
const int LED_PIN = 2;        // adapter selon carte
const unsigned long PERIOD=500;
unsigned long t0=0;
bool state=false;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  unsigned long now = millis();
  if (now - t0 >= PERIOD) {
    t0 = now;
    state = !state;
    digitalWrite(LED_PIN, state);
  }
}
```

<div class="callout tp">
  <strong>TP</strong>
  Créer “J1_Blink” + LED sur GPIO choisi, fréquence modifiable.
</div>

Note:
- Expliquer pourquoi éviter `delay()` (bloque le CPU).

---

## Ajouter du Serial (Hello + status)
- Objectif : “j’écris dans le terminal”
- `Serial.begin(115200);`
- `Serial.println("...");`

```cpp
Serial.begin(115200);
Serial.println("Boot OK");
```

<div class="callout tp">
  <strong>TP</strong>
  Afficher un heartbeat + `LED=ON/OFF` à chaque changement.
</div>

Note:
- Vérifier baudrate côté Serial Monitor.

---

## Mini protocole texte (prépare J2)
- On tape : `STATUS`
- L’ESP32 répond : `LED=ON` ou `LED=OFF`

<div class="callout tp">
  <strong>TP</strong>
  Lire une ligne, comparer, répondre.
</div>

Note:
- Pas besoin de parser complexe : commande / réponse.

---

## Récap + devoir light
- IoT avant Internet : bus et série
- Aujourd’hui : flash + Serial OK + loop non-bloquante
- J2 : bouton et réalité (rebonds)

<div class="callout tp">
  <strong>Bonus</strong>
  Ajouter `TOGGLE` et `PERIOD 200` si à l’aise.
</div>

---

## Livrable J1
- Sketch `J1_Blink_Serial.ino`
- Checklist : compile OK · upload OK · Serial Monitor OK

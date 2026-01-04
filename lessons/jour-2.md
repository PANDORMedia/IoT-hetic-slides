<!-- .slide: class="title-slide" -->
<p class="kicker">IoT · Arduino IDE · ESP32</p>
# Jour 2 — GPIO et boutons dans la vraie vie
<p class="subtitle">Sion GENDERS — Formateur depuis 2011</p>
<p class="subtitle">LinkedIn : https://www.linkedin.com/in/sion-gdrs/</p>

---

## Rappel J1 (2 minutes)
- `millis()` > `delay()`
- Serial Monitor = terminal
- On sait flasher / débugger

<div class="callout demo">
  <strong>Demo</strong>
  Reflasher J1 en 20 secondes pour la confiance.
</div>

---

## GPIO : entrée vs sortie
- Sortie : on impose 0/1 (LED)
- Entrée : on lit 0/1 (bouton, capteur digital)
- Piège : entrée **flottante** sans pull-up/down

<div class="diagram">
  <div class="node"><strong>Sortie</strong> → on commande le monde physique</div>
  <div class="node"><strong>Entrée</strong> → on observe le monde physique</div>
</div>

Note:
- “Flottant” = antenne, lectures aléatoires.

---

## Pull-up / Pull-down (essentiel)
- Pull-up interne : `INPUT_PULLUP`
- Bouton vers GND → logique inversée (appuyé = LOW)
- Pourquoi : état stable quand rien n’est appuyé

<div class="callout tp">
  <strong>Astuce</strong>
  Toujours dessiner le schéma logique avant de câbler.
</div>

---

## Schéma de câblage (vue rapide)
- LED + résistance en série
- Bouton entre GPIO et GND
- GPIO bouton en `INPUT_PULLUP`

<figure class="media">
  <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Breadboard.jpg" alt="Breadboard" />
  <figcaption>Source : <a href="https://commons.wikimedia.org/wiki/File:Breadboard.jpg">Wikimedia Commons — Breadboard</a></figcaption>
</figure>

---

## Problème réel : rebonds (bouncing)
- Un bouton ne fait pas “clic” → il fait “clicclicclic”
- Sans filtrage : plusieurs appuis détectés
- Solution : anti-rebond (temps + état stable)

<svg class="wave" viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Signal de bouton avec rebonds">
  <rect x="0" y="0" width="640" height="200" fill="none" />
  <line x1="20" y1="150" x2="620" y2="150" stroke="#c9d4cf" stroke-width="2" />
  <polyline
    points="20,150 120,150 150,70 170,130 190,90 210,120 230,80 260,110 300,70 340,70 400,70 440,70 520,70 620,70"
    fill="none"
    stroke="#0b5f55"
    stroke-width="4"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <text x="24" y="175" fill="#4b5a56" font-size="18">repos</text>
  <text x="360" y="55" fill="#4b5a56" font-size="18">appui stable</text>
</svg>

---

## Méthode anti-rebond “temps de stabilité”
- On lit l’état brut
- Si changement → on démarre un timer
- Si stable pendant X ms → on valide

<div class="pill-row">
  <div class="pill">DEBOUNCE_MS = 30</div>
  <div class="pill">Ajustable</div>
</div>

---

## Architecture loop non-bloquante (pattern)

<div class="diagram">
  <div class="node"><strong>readButton()</strong> — lecture + anti-rebond</div>
  <div class="node"><strong>handleSerial()</strong> — commandes texte</div>
  <div class="node"><strong>updateLed()</strong> — état LED</div>
  <div class="node"><strong>telemetry()</strong> — events (option)</div>
</div>

Note:
- Structure propre sans “cours d’archi”.

---

## TP1 : LED contrôlée par bouton (toggle)
Objectif : à chaque appui validé → inversion LED

1. Câbler bouton + LED
2. Lire bouton avec `INPUT_PULLUP`
3. Ajouter anti-rebond
4. `onPress()` → `ledState = !ledState`

```cpp
bool pressed = (digitalRead(BTN_PIN) == LOW);
```

---

## TP2 : commandes série (retour terminal)

| Commande | Action |
| --- | --- |
| `ON` | LED ON |
| `OFF` | LED OFF |
| `STATUS` | LED + bouton |

<div class="callout tp">
  <strong>TP</strong>
  Parser une ligne simple, répondre par une ligne lisible.
</div>

---

## TP3 : un “event log”
- Quand bouton press → `EVENT:BTN_PRESS`
- Quand LED change → `EVENT:LED=ON/OFF`

Objectif : préparer mentalement la télémétrie (MQTT plus tard)

---

## Débrief bugs fréquents
- Mauvais GPIO (LED intégrée pas sur le pin attendu)
- Oubli résistance LED
- Bouton câblé sur 3.3V au lieu de GND avec pull-up
- Baudrate pas aligné
- Rebonds non gérés → double toggle

---

## Mini-challenges (si avance)
1. Double clic = LED clignote 3 fois
2. Appui long (>800 ms) = LED OFF
3. `HELP` affiche la liste des commandes

---

## Récap & teaser J3
- Vous savez gérer un input “sale” (rebonds)
- Vous avez un mini protocole texte
- J3 : capteurs analogiques (ADC), bruit, filtrage

---

## Livrable J2
- Sketch `J2_Button_Debounce_Serial.ino`
- Fonctions attendues :
  - Bouton toggle robuste
  - Commandes `ON/OFF/STATUS`
  - Logs d’events

---

## Annexe — Squelette de code J2

```cpp
const int LED_PIN = 2;
const int BTN_PIN = 0; // adapter

bool ledState = false;

// Debounce
const unsigned long DEBOUNCE_MS = 30;
bool lastRaw = false;
bool stableState = false;
unsigned long lastChange = 0;

String line;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BTN_PIN, INPUT_PULLUP);
  Serial.begin(115200);
  Serial.println("Boot OK. Type HELP");
}
```

----

```cpp
void setLed(bool on) {
  ledState = on;
  digitalWrite(LED_PIN, ledState ? HIGH : LOW);
  Serial.print("EVENT:LED=");
  Serial.println(ledState ? "ON" : "OFF");
}

void toggleLed() {
  setLed(!ledState);
}

void readButtonDebounced() {
  bool rawPressed = (digitalRead(BTN_PIN) == LOW);

  if (rawPressed != lastRaw) {
    lastRaw = rawPressed;
    lastChange = millis();
  }

  if ((millis() - lastChange) >= DEBOUNCE_MS) {
    if (stableState != rawPressed) {
      stableState = rawPressed;
      if (stableState) {
        Serial.println("EVENT:BTN_PRESS");
        toggleLed();
      }
    }
  }
}
```

----

```cpp
void handleSerial() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      line.trim();
      if (line.length() > 0) {
        if (line == "ON") setLed(true);
        else if (line == "OFF") setLed(false);
        else if (line == "STATUS") {
          Serial.print("LED=");
          Serial.print(ledState ? "ON" : "OFF");
          Serial.print(" BTN=");
          Serial.println(stableState ? "PRESSED" : "RELEASED");
        } else if (line == "HELP") {
          Serial.println("CMDS: ON, OFF, STATUS, HELP");
        } else {
          Serial.print("ERR:UNKNOWN_CMD ");
          Serial.println(line);
        }
      }
      line = "";
    } else {
      line += c;
    }
  }
}

void loop() {
  handleSerial();
  readButtonDebounced();
}
```

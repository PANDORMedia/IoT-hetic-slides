<!-- .slide: class="title-slide" -->
<p class="kicker">IoT · Hardware · ESP32</p>
# Jour 3 — Le Hardware en profondeur
<p class="subtitle">Sion GENDERS — Formateur depuis 2011</p>
<p class="subtitle">LinkedIn : https://www.linkedin.com/in/sion-gdrs/</p>

---

## Rappel J2-Alt
- Architecture IoT complète : ESP32 → MQTT → WebSocket → Dashboard
- Communication bidirectionnelle
- Simulation de capteurs

<div class="callout demo">
  <strong>Aujourd'hui</strong>
  On revient aux fondamentaux hardware : comprendre ce qui se passe VRAIMENT dans la puce.
</div>

---

## Objectifs du jour
1. Comprendre l'architecture interne d'un microcontrôleur
2. Maîtriser la différence digital vs analogique
3. Savoir lire les datasheets (pinout)
4. Construire un projet météo complet
5. Créer un Flipper interactif !

---

# Partie 1 : Architecture Hardware

---

## Qu'est-ce qu'un microcontrôleur ?

Un **ordinateur miniature** sur une seule puce :
- CPU (processeur)
- RAM (mémoire vive)
- Flash (stockage programme)
- Périphériques intégrés (GPIO, ADC, UART, SPI, I2C...)

<div class="diagram">
  <div class="node"><strong>CPU</strong> — Exécute les instructions</div>
  <div class="node"><strong>RAM</strong> — Variables, stack</div>
  <div class="node"><strong>Flash</strong> — Code + constantes</div>
  <div class="node"><strong>Périphériques</strong> — Interface monde réel</div>
</div>

---

## ESP32 : specs rapides

| Caractéristique | Valeur |
| --- | --- |
| CPU | Dual-core Xtensa LX6, 240 MHz |
| RAM | 520 KB SRAM |
| Flash | 4 MB (externe) |
| GPIO | 34 pins (pas tous utilisables) |
| ADC | 2 x 12-bit (18 canaux) |
| DAC | 2 x 8-bit |
| WiFi | 802.11 b/g/n |
| Bluetooth | BLE 4.2 |

Note:
- Bien plus puissant qu'un Arduino Uno (8-bit, 16 MHz, 2KB RAM)

---

## Le pinout : votre bible

<div class="callout tp">
  <strong>Règle d'or</strong>
  TOUJOURS consulter le pinout de VOTRE carte avant de câbler !
</div>

Chaque pin a des capacités spécifiques :
- Certains sont input-only (GPIO 34-39)
- Certains sont réservés (flash interne)
- Certains ont des fonctions spéciales (boot, UART0...)

---

## Zones dangereuses sur ESP32

| Pins | Attention |
| --- | --- |
| GPIO 0, 2, 15 | Strapping pins (boot mode) |
| GPIO 6-11 | Flash SPI (ne pas toucher !) |
| GPIO 34-39 | Input only, pas de pull-up interne |
| GPIO 1, 3 | UART0 (Serial Monitor) |

<div class="callout check">
  <strong>Safe pins</strong>
  GPIO 4, 5, 12-14, 16-33 (selon carte)
</div>

---

# Partie 2 : Digital vs Analogique

---

## Signal Digital

<div class="diagram">
  <div class="node"><strong>2 états possibles</strong></div>
  <div class="node">HIGH (3.3V) ou LOW (0V)</div>
  <div class="node">Parfait pour : LED, boutons, relais</div>
</div>

```cpp
// Écriture digitale
digitalWrite(LED_PIN, HIGH);  // 3.3V
digitalWrite(LED_PIN, LOW);   // 0V

// Lecture digitale
int state = digitalRead(BTN_PIN);  // 0 ou 1
```

---

## Signal Analogique

<div class="diagram">
  <div class="node"><strong>Valeurs continues</strong></div>
  <div class="node">0V → 3.3V avec toutes les valeurs entre</div>
  <div class="node">Parfait pour : capteurs (temp, lumière, son...)</div>
</div>

Le monde réel est analogique !
- Température : 22.5°C
- Luminosité : 347 lux
- Tension batterie : 3.72V

---

## ADC : Analog to Digital Converter

Convertit une tension en nombre :

```
0V      →  0
1.65V   →  2048
3.3V    →  4095
```

<div class="pill-row">
  <div class="pill">12 bits</div>
  <div class="pill">4096 niveaux</div>
  <div class="pill">Résolution : 0.8 mV</div>
</div>

```cpp
int raw = analogRead(SENSOR_PIN);  // 0-4095
float voltage = raw * 3.3 / 4095;  // Conversion en volts
```

---

## DAC : Digital to Analog Converter

L'inverse ! Génère une tension variable :

```cpp
dacWrite(DAC_PIN, 0);    // 0V
dacWrite(DAC_PIN, 127);  // ~1.65V
dacWrite(DAC_PIN, 255);  // ~3.3V
```

<div class="callout tp">
  <strong>Pins DAC sur ESP32</strong>
  Seulement GPIO 25 et GPIO 26
</div>

---

## PWM : Pseudo-analogique digital

Pas assez de DAC ? PWM à la rescousse !

- Signal digital qui alterne très vite
- Le **duty cycle** = temps HIGH / période totale
- Moyenne perçue comme analogique (LED, moteurs)

```cpp
// ESP32 LEDC (LED Control)
ledcSetup(0, 5000, 8);     // Canal 0, 5kHz, 8 bits
ledcAttachPin(LED_PIN, 0);
ledcWrite(0, 128);         // 50% duty cycle
```

---

## PWM : Visualisation

```
Duty 25%:  ▄___▄___▄___  → LED faible
Duty 50%:  ▄▄__▄▄__▄▄__  → LED moyenne
Duty 75%:  ▄▄▄_▄▄▄_▄▄▄_  → LED forte
Duty 100%: ▄▄▄▄▄▄▄▄▄▄▄▄  → LED max
```

<div class="callout demo">
  <strong>Demo</strong>
  LED qui "respire" avec PWM
</div>

---

## Tableau récapitulatif

| Type | Fonction | Valeurs | Pins ESP32 |
| --- | --- | --- | --- |
| Digital OUT | `digitalWrite()` | 0/1 | Presque tous |
| Digital IN | `digitalRead()` | 0/1 | Presque tous |
| Analog IN | `analogRead()` | 0-4095 | GPIO 32-39, + autres |
| Analog OUT | `dacWrite()` | 0-255 | GPIO 25, 26 seulement |
| PWM | `ledcWrite()` | 0-255 (8-bit) | Presque tous |

---

# Partie 3 : Lecture de capteurs

---

## Capteur de température analogique (LM35)

Sortie : 10 mV / °C

```cpp
const int LM35_PIN = 34;

void loop() {
  int raw = analogRead(LM35_PIN);
  float voltage = raw * 3.3 / 4095;
  float tempC = voltage * 100;  // 10mV/°C

  Serial.print("Temp: ");
  Serial.print(tempC);
  Serial.println(" C");

  delay(1000);
}
```

---

## Capteur numérique DHT11/DHT22

Un seul fil de données, protocole propriétaire :
- Température + Humidité
- Protocole "one-wire" (pas le Dallas 1-Wire)
- Bibliothèque nécessaire

```cpp
#include <DHT.h>

DHT dht(DHT_PIN, DHT22);

void setup() {
  dht.begin();
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
}
```

---

## I2C : le bus intelligent

2 fils pour plein de capteurs :
- SDA (données)
- SCL (horloge)
- Chaque capteur a une adresse unique

```cpp
#include <Wire.h>

void setup() {
  Wire.begin(21, 22);  // SDA=21, SCL=22 sur ESP32
}
```

<div class="callout tp">
  <strong>Capteurs I2C populaires</strong>
  BMP280 (pression), BME280 (temp+hum+pression), MPU6050 (accéléromètre)
</div>

---

## Scanner I2C

Trouver les adresses des capteurs connectés :

```cpp
void scanI2C() {
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print("Device found at 0x");
      Serial.println(addr, HEX);
    }
  }
}
```

---

# Partie 4 : Les TPs !

---

## TP1 : LED simple (warmup)

**Objectif** : Faire clignoter une LED externe

1. Câbler LED + résistance (220Ω-330Ω)
2. Connecter à un GPIO safe (ex: GPIO 5)
3. Code non-bloquant avec `millis()`

<div class="callout tp">
  <strong>Checkpoint</strong>
  LED clignote à 500ms sans `delay()`
</div>

---

## TP1 : Schéma de câblage

```
ESP32          LED
GPIO 5  ────►  Anode (+, longue patte)
                │
              [LED]
                │
              Cathode (-, courte patte)
                │
              [220Ω]
                │
GND     ────────┘
```

<div class="callout check">
  <strong>Rappel</strong>
  La résistance peut être avant OU après la LED, l'important c'est qu'elle soit en série.
</div>

---

## TP1 : Code complet

```cpp
const int LED_PIN = 5;
const unsigned long BLINK_PERIOD = 500;

unsigned long lastToggle = 0;
bool ledState = false;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("TP1: LED Simple - Boot OK");
}

void loop() {
  unsigned long now = millis();

  if (now - lastToggle >= BLINK_PERIOD) {
    lastToggle = now;
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
    Serial.println(ledState ? "LED ON" : "LED OFF");
  }
}
```

---

## TP2 : Bouton + LED

**Objectif** : Contrôler la LED avec un bouton

1. Ajouter un bouton entre GPIO et GND
2. Utiliser `INPUT_PULLUP`
3. Implémenter l'anti-rebond
4. Chaque appui = toggle LED

<div class="callout tp">
  <strong>Checkpoint</strong>
  Un seul appui = un seul toggle (pas de double toggle dû aux rebonds)
</div>

---

## TP2 : Schéma de câblage

```
ESP32          Bouton
GPIO 4  ────────┤ ├───── GND
 (INPUT_PULLUP)

ESP32          LED
GPIO 5  ────►  [LED] ── [220Ω] ── GND
```

Note:
- Le pull-up interne maintient GPIO 4 à HIGH
- Appuyer connecte GPIO 4 à GND → LOW

---

## TP2 : Code avec debounce

```cpp
const int LED_PIN = 5;
const int BTN_PIN = 4;
const unsigned long DEBOUNCE_MS = 30;

bool ledState = false;
bool lastRaw = false;
bool stableState = false;
unsigned long lastChange = 0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BTN_PIN, INPUT_PULLUP);
  Serial.begin(115200);
  Serial.println("TP2: Bouton + LED - Boot OK");
}
```

----

```cpp
void loop() {
  // Lecture avec debounce
  bool rawPressed = (digitalRead(BTN_PIN) == LOW);

  if (rawPressed != lastRaw) {
    lastRaw = rawPressed;
    lastChange = millis();
  }

  if ((millis() - lastChange) >= DEBOUNCE_MS) {
    if (stableState != rawPressed) {
      stableState = rawPressed;
      if (stableState) {
        // Front montant (appui validé)
        ledState = !ledState;
        digitalWrite(LED_PIN, ledState);
        Serial.println(ledState ? "LED ON" : "LED OFF");
      }
    }
  }
}
```

---

## TP3 : Station Météo

**Objectif** : Lire température et humidité, afficher via Serial

Composants :
- DHT11 ou DHT22
- LED status
- (Optionnel) Écran OLED I2C

<div class="callout tp">
  <strong>Checkpoint</strong>
  Données affichées toutes les 2 secondes, LED clignote si erreur
</div>

---

## TP3 : Câblage DHT22

```
DHT22 (4 pins, gauche à droite face aux trous)
Pin 1 (VCC)  ────  3.3V
Pin 2 (DATA) ────  GPIO 15 + pull-up 10kΩ vers 3.3V
Pin 3 (NC)   ────  non connecté
Pin 4 (GND)  ────  GND
```

<div class="callout check">
  <strong>Pull-up externe</strong>
  Le DHT a besoin d'un pull-up externe de 10kΩ sur la ligne data
</div>

---

## TP3 : Installation bibliothèque

Dans Arduino IDE :
1. Sketch → Include Library → Manage Libraries
2. Chercher "DHT sensor library" (Adafruit)
3. Installer + installer les dépendances

Ou dans PlatformIO :
```ini
lib_deps =
  adafruit/DHT sensor library@^1.4.6
  adafruit/Adafruit Unified Sensor@^1.1.14
```

---

## TP3 : Code Station Météo

```cpp
#include <DHT.h>

const int DHT_PIN = 15;
const int LED_PIN = 5;
const unsigned long READ_INTERVAL = 2000;

DHT dht(DHT_PIN, DHT22);
unsigned long lastRead = 0;
bool errorState = false;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  dht.begin();
  Serial.println("TP3: Station Meteo - Boot OK");
}
```

----

```cpp
void loop() {
  unsigned long now = millis();

  if (now - lastRead >= READ_INTERVAL) {
    lastRead = now;

    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (isnan(h) || isnan(t)) {
      Serial.println("ERROR: Lecture DHT echouee!");
      errorState = true;
    } else {
      errorState = false;
      Serial.print("Temp: ");
      Serial.print(t, 1);
      Serial.print(" C | Hum: ");
      Serial.print(h, 1);
      Serial.println(" %");
    }

    // LED status
    digitalWrite(LED_PIN, errorState ? HIGH : LOW);
  }
}
```

---

## TP3 : Bonus - JSON output

```cpp
void printJSON(float temp, float hum) {
  Serial.print("{\"deviceId\":\"meteo-01\",");
  Serial.print("\"ts\":");
  Serial.print(millis() / 1000);
  Serial.print(",\"tempC\":");
  Serial.print(temp, 1);
  Serial.print(",\"humPct\":");
  Serial.print(hum, 1);
  Serial.println("}");
}
```

Prêt pour MQTT !

---

## TP3 : Bonus - Écran OLED

```cpp
#include <Wire.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Wire.begin(21, 22);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(WHITE);
}

void showData(float t, float h) {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("T: "); display.print(t, 1); display.println(" C");
  display.print("H: "); display.print(h, 1); display.println(" %");
  display.display();
}
```

---

# TP4 : Projet Flipper !

---

## TP4 : Concept

Créer un **flipper virtuel** contrôlé par hardware :
- 2 boutons = flippers gauche/droite
- Communication avec un frontend web
- Bonus : Plunger analogique (potentiomètre)

<div class="callout demo">
  <strong>Frontend fourni !</strong>
  Vous codez l'ESP32 + le bridge, on fournit le jeu.
</div>

---

## TP4 : Architecture

```
┌─────────────┐     Serial/USB      ┌─────────────┐
│   ESP32     │ ◄────────────────► │   Bridge    │
│  Hardware   │     JSON msgs       │   Node.js   │
└─────────────┘                     └──────┬──────┘
      │                                    │
  [Buttons]                           WebSocket
  [Plunger]                                │
                                    ┌──────▼──────┐
                                    │  Frontend   │
                                    │  (fourni)   │
                                    └─────────────┘
```

---

## TP4 : Protocole ESP32 → Bridge

Messages JSON sur Serial :

```json
// Flipper gauche appuyé
{"type":"flipper","side":"left","state":"down"}

// Flipper gauche relâché
{"type":"flipper","side":"left","state":"up"}

// Plunger (bonus)
{"type":"plunger","value":0.75}
```

---

## TP4 : Protocole Bridge → ESP32

Messages JSON sur Serial :

```json
// Feedback haptique (optionnel)
{"type":"rumble","duration":100}

// Score update (pour affichage OLED optionnel)
{"type":"score","value":12500}
```

---

## TP4 : Code ESP32

```cpp
const int BTN_LEFT = 4;
const int BTN_RIGHT = 16;
const int PLUNGER_PIN = 34;  // ADC

const unsigned long DEBOUNCE_MS = 10;  // Rapide pour le jeu!

bool leftState = false;
bool rightState = false;
int lastPlunger = 0;

void setup() {
  Serial.begin(115200);
  pinMode(BTN_LEFT, INPUT_PULLUP);
  pinMode(BTN_RIGHT, INPUT_PULLUP);
  Serial.println("{\"type\":\"boot\",\"device\":\"flipper-01\"}");
}
```

----

```cpp
void sendFlipper(const char* side, bool pressed) {
  Serial.print("{\"type\":\"flipper\",\"side\":\"");
  Serial.print(side);
  Serial.print("\",\"state\":\"");
  Serial.print(pressed ? "down" : "up");
  Serial.println("\"}");
}

void readFlippers() {
  bool left = (digitalRead(BTN_LEFT) == LOW);
  bool right = (digitalRead(BTN_RIGHT) == LOW);

  if (left != leftState) {
    leftState = left;
    sendFlipper("left", left);
  }
  if (right != rightState) {
    rightState = right;
    sendFlipper("right", right);
  }
}
```

----

```cpp
void readPlunger() {
  int raw = analogRead(PLUNGER_PIN);

  // Seuil de changement pour éviter le bruit
  if (abs(raw - lastPlunger) > 50) {
    lastPlunger = raw;
    float value = raw / 4095.0;

    Serial.print("{\"type\":\"plunger\",\"value\":");
    Serial.print(value, 2);
    Serial.println("}");
  }
}

void loop() {
  readFlippers();
  readPlunger();
  delay(5);  // Polling rapide
}
```

---

## TP4 : Le Bridge (Node.js)

Pont entre Serial et WebSocket :

```javascript
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { WebSocketServer } = require('ws');

// Serial vers ESP32
const port = new SerialPort({
  path: '/dev/tty.usbserial-XXX',  // Adapter !
  baudRate: 115200
});
const parser = port.pipe(new ReadlineParser());

// WebSocket server
const wss = new WebSocketServer({ port: 8080 });
```

----

```javascript
// ESP32 → Frontend
parser.on('data', (line) => {
  console.log('ESP32:', line);
  try {
    const msg = JSON.parse(line);

    // Broadcast à tous les clients
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(line);
      }
    });
  } catch (e) {
    // Ignore lignes non-JSON (debug)
  }
});

// Frontend → ESP32
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    console.log('Frontend:', data.toString());
    port.write(data.toString() + '\n');
  });
});

console.log('Bridge running on ws://localhost:8080');
```

---

## TP4 : Lancer le projet

1. **Flasher** l'ESP32 avec le code flipper
2. **Trouver** le port série : `ls /dev/tty.usb*`
3. **Adapter** le path dans `bridge.js`
4. **Lancer** le bridge : `node bridge.js`
5. **Ouvrir** le frontend : `http://localhost:3000`
6. **Jouer** !

<div class="callout tp">
  <strong>Checkpoint</strong>
  Les flippers répondent aux boutons physiques
</div>

---

## TP4 Bonus : Plunger physique

Utiliser un **potentiomètre** comme lance-bille :
- Connecter à un pin ADC (GPIO 34)
- 0% = repos, 100% = tiré au max
- Relâcher = lancer la bille !

```
Potentiomètre
┌───────────┐
│    (1)    │──── 3.3V
│    (2)    │──── GPIO 34 (ADC)
│    (3)    │──── GND
└───────────┘
```

---

## TP4 Bonus : Détection du lancement

```cpp
const float LAUNCH_THRESHOLD = 0.8;
const unsigned long RELEASE_TIME = 50;

float prevValue = 0;
unsigned long pullTime = 0;
bool pulled = false;

void checkLaunch(float value) {
  if (value > LAUNCH_THRESHOLD && !pulled) {
    pulled = true;
    pullTime = millis();
  }

  if (pulled && value < 0.2) {
    // Relâché rapidement = lancement !
    float power = prevValue;  // Force du tir
    Serial.print("{\"type\":\"launch\",\"power\":");
    Serial.print(power, 2);
    Serial.println("}");
    pulled = false;
  }

  prevValue = value;
}
```

---

## Récap du jour

- **Architecture** : CPU, RAM, Flash, Périphériques
- **Digital** : 0/1, parfait pour boutons/LEDs
- **Analogique** : ADC (lecture), DAC/PWM (écriture)
- **Capteurs** : Analogiques, numériques, I2C
- **Projet** : Station météo + Flipper interactif !

---

## Ressources

- ESP32 Pinout Reference : https://randomnerdtutorials.com/esp32-pinout-reference-gpios/
- DHT Library : https://github.com/adafruit/DHT-sensor-library
- Arduino Reference : https://www.arduino.cc/reference/en/

---

## Livrables J3

1. `J3_TP1_LED.ino` - LED non-bloquante
2. `J3_TP2_Button_LED.ino` - Bouton avec debounce
3. `J3_TP3_Meteo.ino` - Station météo
4. `J3_TP4_Flipper.ino` - Contrôleur flipper

<div class="callout bonus">
  <strong>Bonus</strong>
  Combiner Station Météo + MQTT (J2-Alt) pour un dashboard météo live !
</div>

---

## Annexe : Pinout ESP32 DevKit

```
                    ESP32 DevKit v1
                    ┌─────────────┐
              EN   ─┤ 1        38 ├─ GPIO 23
         GPIO 36   ─┤ 2        37 ├─ GPIO 22
         GPIO 39   ─┤ 3        36 ├─ GPIO 1 (TX)
         GPIO 34   ─┤ 4        35 ├─ GPIO 3 (RX)
         GPIO 35   ─┤ 5        34 ├─ GPIO 21
         GPIO 32   ─┤ 6        33 ├─ GND
         GPIO 33   ─┤ 7        32 ├─ GPIO 19
         GPIO 25   ─┤ 8        31 ├─ GPIO 18
         GPIO 26   ─┤ 9        30 ├─ GPIO 5
         GPIO 27   ─┤10        29 ├─ GPIO 17
         GPIO 14   ─┤11        28 ├─ GPIO 16
         GPIO 12   ─┤12        27 ├─ GPIO 4
              GND  ─┤13        26 ├─ GPIO 0
             VIN   ─┤14        25 ├─ GPIO 2
             3.3V  ─┤15        24 ├─ GPIO 15
         GPIO 13   ─┤16        23 ├─ GND
                    └─────────────┘
```

---

## Annexe : Codes couleur résistances

```
220Ω  = Rouge-Rouge-Marron   (LEDs standard)
330Ω  = Orange-Orange-Marron (LEDs)
1kΩ   = Marron-Noir-Rouge    (pull-up/down)
10kΩ  = Marron-Noir-Orange   (pull-up DHT)
```

<div class="callout tp">
  <strong>Astuce</strong>
  En cas de doute, mesurer avec un multimètre !
</div>

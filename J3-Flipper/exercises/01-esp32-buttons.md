# Exercice 1 - ESP32 Buttons Setup

## Objectif

Configurer l'ESP32 pour lire deux boutons (flippers gauche et droite) et envoyer des messages JSON via Serial.

## Matériel requis

- ESP32 DevKit
- 2 boutons poussoirs
- Breadboard
- Fils de connexion

## Câblage

```
Bouton Gauche:
  GPIO 4 ────┤ ├──── GND

Bouton Droite:
  GPIO 16 ───┤ ├──── GND
```

**Note:** On utilise `INPUT_PULLUP`, donc pas besoin de résistance externe.

## Code de base

Créer un nouveau sketch avec ce code minimal :

```cpp
const int BTN_LEFT = 4;
const int BTN_RIGHT = 16;

bool leftState = false;
bool rightState = false;

void setup() {
  Serial.begin(115200);
  pinMode(BTN_LEFT, INPUT_PULLUP);
  pinMode(BTN_RIGHT, INPUT_PULLUP);
  Serial.println("{\"type\":\"boot\",\"device\":\"flipper-01\"}");
}

void sendFlipper(const char* side, bool pressed) {
  Serial.print("{\"type\":\"flipper\",\"side\":\"");
  Serial.print(side);
  Serial.print("\",\"state\":\"");
  Serial.print(pressed ? "down" : "up");
  Serial.println("\"}");
}

void loop() {
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

  delay(10);
}
```

## Checkpoints

1. [ ] Le Serial Monitor affiche `{"type":"boot",...}` au démarrage
2. [ ] Appuyer sur le bouton gauche affiche `{"type":"flipper","side":"left","state":"down"}`
3. [ ] Relâcher affiche `{"type":"flipper","side":"left","state":"up"}`
4. [ ] Même comportement pour le bouton droite

## Problèmes courants

### Double messages

Si vous voyez plusieurs messages pour un seul appui, c'est le **bouncing**. Ajoutez un debounce :

```cpp
const unsigned long DEBOUNCE_MS = 10;
bool leftRaw = false;
unsigned long leftChangeTime = 0;

// Dans loop():
bool leftPressed = (digitalRead(BTN_LEFT) == LOW);
if (leftPressed != leftRaw) {
  leftRaw = leftPressed;
  leftChangeTime = millis();
}
if ((millis() - leftChangeTime) >= DEBOUNCE_MS) {
  if (leftState != leftRaw) {
    leftState = leftRaw;
    sendFlipper("left", leftState);
  }
}
```

### Pas de messages

1. Vérifier le baudrate (115200)
2. Vérifier les GPIO utilisés
3. Vérifier que le bouton est bien connecté à GND

## Étape suivante

Une fois les boutons fonctionnels, passez à l'exercice 2 pour configurer le bridge.

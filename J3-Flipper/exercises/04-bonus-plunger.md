# Exercice 4 (Bonus) - Plunger Analogique

## Objectif

Ajouter un lance-bille physique avec un potentiomètre !

## Matériel requis

- Potentiomètre linéaire (10kΩ recommandé)
- Breadboard
- Fils de connexion

## Câblage

```
Potentiomètre (vue de face, 3 pins)

     ┌───────────────┐
     │      (1)      │──── 3.3V
     │      (2)      │──── GPIO 34 (ADC)
     │      (3)      │──── GND
     └───────────────┘

Note: GPIO 34 est un pin "input only" avec ADC
```

## Principe

1. Potentiomètre au repos → valeur basse (~0)
2. Tirer le potentiomètre → valeur monte (0 → 1)
3. Relâcher rapidement → **LAUNCH!**

Le code détecte :
- Le "pull" (valeur > 0.3)
- Le "release" rapide (retour à < 0.15 depuis > 0.5)

## Code ESP32 (à ajouter)

```cpp
const int PLUNGER_PIN = 34;
const unsigned long PLUNGER_INTERVAL = 20;

int lastPlungerRaw = 0;
float lastPlungerValue = 0;
unsigned long lastPlungerSend = 0;
bool plungerPulled = false;
float maxPullValue = 0;

void sendPlunger(float value) {
  Serial.print("{\"type\":\"plunger\",\"value\":");
  Serial.print(value, 2);
  Serial.println("}");
}

void sendLaunch(float power) {
  Serial.print("{\"type\":\"launch\",\"power\":");
  Serial.print(power, 2);
  Serial.println("}");
}

void readPlunger() {
  unsigned long now = millis();
  if (now - lastPlungerSend < PLUNGER_INTERVAL) return;

  int raw = analogRead(PLUNGER_PIN);

  // Filtre anti-bruit
  if (abs(raw - lastPlungerRaw) < 30) return;
  lastPlungerRaw = raw;

  float value = raw / 4095.0;

  // Détection pull
  if (value > 0.3 && !plungerPulled) {
    plungerPulled = true;
    maxPullValue = value;
  }

  if (plungerPulled) {
    if (value > maxPullValue) maxPullValue = value;

    // Détection release
    if (value < 0.15 && maxPullValue > 0.5) {
      sendLaunch(maxPullValue);
      plungerPulled = false;
      maxPullValue = 0;
    }
  }

  // Envoyer position si changement significatif
  if (abs(value - lastPlungerValue) > 0.02) {
    lastPlungerValue = value;
    sendPlunger(value);
    lastPlungerSend = now;
  }
}
```

Ajouter `readPlunger();` dans la `loop()`.

## Test

1. Flasher le code mis à jour
2. Relancer le bridge
3. Ouvrir le frontend
4. Tourner le potentiomètre → la barre plunger bouge
5. Tirer puis relâcher rapidement → la bille se lance !

## Checkpoints

1. [ ] GPIO 34 connecté au potentiomètre
2. [ ] Messages `{"type":"plunger",...}` dans le bridge
3. [ ] La barre plunger visuelle suit le potentiomètre
4. [ ] `{"type":"launch",...}` envoyé au release
5. [ ] La bille se lance avec la bonne puissance

## Amélioration : Plunger physique

Pour un vrai feeling de flipper, utiliser :
- Un potentiomètre **slide** (linéaire)
- Monté sur un ressort
- Avec une poignée

```
┌──────────────────────────┐
│  ┌────┐                  │
│  │████│ ← Poignée        │
│  │████│                  │
│  └──┬─┘                  │
│     │                    │
│  ┌──┴──┐                 │
│  │Pot  │ ← Potentiomètre │
│  │slide│    linéaire     │
│  └─────┘                 │
│    ~~~~ ← Ressort        │
└──────────────────────────┘
```

## Calibration

Si les valeurs ne correspondent pas (0 pas à 0, max pas à 1) :

```cpp
// Calibration
const int PLUNGER_MIN = 100;   // Valeur au repos
const int PLUNGER_MAX = 3900;  // Valeur tirée à fond

float value = constrain(raw, PLUNGER_MIN, PLUNGER_MAX);
value = (value - PLUNGER_MIN) / (float)(PLUNGER_MAX - PLUNGER_MIN);
```

## Félicitations !

Vous avez créé un flipper IoT complet avec :
- Contrôle hardware des flippers
- Lance-bille analogique
- Communication temps réel ESP32 → Web

Prochaines idées :
- Ajouter un écran OLED pour le score
- Ajouter un vibreur pour le feedback haptique
- Ajouter des effets sonores
- Multi-joueur via plusieurs ESP32

/**
 * Flipper IoT - ESP32 Controller
 *
 * Reads hardware inputs (buttons, plunger) and sends
 * JSON messages to the bridge via Serial.
 *
 * Protocol:
 *   ESP32 → Bridge:
 *     {"type":"flipper","side":"left|right","state":"down|up"}
 *     {"type":"plunger","value":0.0-1.0}
 *     {"type":"launch","power":0.0-1.0}
 *     {"type":"boot","device":"flipper-01"}
 *
 *   Bridge → ESP32:
 *     {"type":"rumble","duration":100}
 *     {"type":"score","value":12500}
 */

// === Pin Configuration ===
// Adapt these to your wiring!
const int BTN_LEFT = 4;      // Left flipper button → GND
const int BTN_RIGHT = 16;    // Right flipper button → GND
const int PLUNGER_PIN = 34;  // Potentiometer middle pin (ADC)
const int LED_PIN = 2;       // Built-in LED for feedback
const int RUMBLE_PIN = 5;    // Optional: vibration motor

// === Timing ===
const unsigned long DEBOUNCE_MS = 10;   // Fast for gaming
const unsigned long PLUNGER_INTERVAL = 20;  // 50 Hz plunger updates
const unsigned long LAUNCH_TIMEOUT = 100;   // ms to detect release

// === State ===
// Left button
bool leftRaw = false;
bool leftStable = false;
unsigned long leftChangeTime = 0;

// Right button
bool rightRaw = false;
bool rightStable = false;
unsigned long rightChangeTime = 0;

// Plunger
int lastPlungerRaw = 0;
float lastPlungerValue = 0;
unsigned long lastPlungerSend = 0;
bool plungerPulled = false;
unsigned long pullStartTime = 0;
float maxPullValue = 0;

// Rumble
bool rumbleActive = false;
unsigned long rumbleEndTime = 0;

// Serial input buffer
String inputBuffer = "";

// === Setup ===
void setup() {
  Serial.begin(115200);

  pinMode(BTN_LEFT, INPUT_PULLUP);
  pinMode(BTN_RIGHT, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  pinMode(RUMBLE_PIN, OUTPUT);

  // Boot message
  delay(100);
  Serial.println("{\"type\":\"boot\",\"device\":\"flipper-01\"}");

  digitalWrite(LED_PIN, HIGH);
  delay(200);
  digitalWrite(LED_PIN, LOW);
}

// === Send JSON Messages ===
void sendFlipper(const char* side, bool pressed) {
  Serial.print("{\"type\":\"flipper\",\"side\":\"");
  Serial.print(side);
  Serial.print("\",\"state\":\"");
  Serial.print(pressed ? "down" : "up");
  Serial.println("\"}");
}

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

// === Read Buttons with Debounce ===
void readButtons() {
  unsigned long now = millis();

  // Left button
  bool leftPressed = (digitalRead(BTN_LEFT) == LOW);
  if (leftPressed != leftRaw) {
    leftRaw = leftPressed;
    leftChangeTime = now;
  }
  if ((now - leftChangeTime) >= DEBOUNCE_MS) {
    if (leftStable != leftRaw) {
      leftStable = leftRaw;
      sendFlipper("left", leftStable);
    }
  }

  // Right button
  bool rightPressed = (digitalRead(BTN_RIGHT) == LOW);
  if (rightPressed != rightRaw) {
    rightRaw = rightPressed;
    rightChangeTime = now;
  }
  if ((now - rightChangeTime) >= DEBOUNCE_MS) {
    if (rightStable != rightRaw) {
      rightStable = rightRaw;
      sendFlipper("right", rightStable);
    }
  }
}

// === Read Plunger (Potentiometer) ===
void readPlunger() {
  unsigned long now = millis();

  // Rate limit plunger updates
  if (now - lastPlungerSend < PLUNGER_INTERVAL) return;

  int raw = analogRead(PLUNGER_PIN);

  // Noise filter: only send if significant change
  if (abs(raw - lastPlungerRaw) < 30) return;

  lastPlungerRaw = raw;
  float value = raw / 4095.0;

  // Detect pull and release for launch
  if (value > 0.3 && !plungerPulled) {
    // Started pulling
    plungerPulled = true;
    pullStartTime = now;
    maxPullValue = value;
  }

  if (plungerPulled) {
    // Track maximum pull
    if (value > maxPullValue) {
      maxPullValue = value;
    }

    // Detect release (quick drop from high value)
    if (value < 0.15 && maxPullValue > 0.5) {
      sendLaunch(maxPullValue);
      plungerPulled = false;
      maxPullValue = 0;
    }

    // Timeout: reset if held too long without release
    if (now - pullStartTime > 5000) {
      plungerPulled = false;
      maxPullValue = 0;
    }
  }

  // Send plunger position
  if (abs(value - lastPlungerValue) > 0.02) {
    lastPlungerValue = value;
    sendPlunger(value);
    lastPlungerSend = now;
  }
}

// === Handle Incoming Commands ===
void handleSerial() {
  while (Serial.available()) {
    char c = (char)Serial.read();

    if (c == '\n' || c == '\r') {
      if (inputBuffer.length() > 0) {
        processCommand(inputBuffer);
        inputBuffer = "";
      }
    } else {
      inputBuffer += c;
    }
  }
}

void processCommand(String& cmd) {
  // Simple JSON parsing for known commands
  if (cmd.indexOf("\"type\":\"rumble\"") > 0) {
    int durationStart = cmd.indexOf("\"duration\":") + 11;
    int durationEnd = cmd.indexOf("}", durationStart);
    if (durationStart > 10 && durationEnd > durationStart) {
      String durationStr = cmd.substring(durationStart, durationEnd);
      int duration = durationStr.toInt();
      triggerRumble(duration);
    }
  } else if (cmd.indexOf("\"type\":\"score\"") > 0) {
    int valueStart = cmd.indexOf("\"value\":") + 8;
    int valueEnd = cmd.indexOf("}", valueStart);
    if (valueStart > 7 && valueEnd > valueStart) {
      String valueStr = cmd.substring(valueStart, valueEnd);
      int score = valueStr.toInt();
      // Could display on OLED, blink LED, etc.
      blinkScore(score);
    }
  }
}

// === Feedback ===
void triggerRumble(int durationMs) {
  rumbleActive = true;
  rumbleEndTime = millis() + durationMs;
  digitalWrite(RUMBLE_PIN, HIGH);
  digitalWrite(LED_PIN, HIGH);  // Visual feedback too
}

void updateRumble() {
  if (rumbleActive && millis() >= rumbleEndTime) {
    rumbleActive = false;
    digitalWrite(RUMBLE_PIN, LOW);
    digitalWrite(LED_PIN, LOW);
  }
}

void blinkScore(int score) {
  // Quick blink for score feedback
  int blinks = (score / 1000) % 5;  // Max 5 blinks
  for (int i = 0; i < blinks && i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(50);
    digitalWrite(LED_PIN, LOW);
    delay(50);
  }
}

// === Main Loop ===
void loop() {
  readButtons();
  readPlunger();
  handleSerial();
  updateRumble();

  // Small delay to prevent overwhelming serial
  delay(2);
}

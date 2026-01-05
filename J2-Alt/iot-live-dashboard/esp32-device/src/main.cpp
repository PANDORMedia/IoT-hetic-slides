#include <WiFi.h>
#include <PubSubClient.h>
#include <math.h>

#include "config.h"

static const int LED_PIN = 2;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

String baseTopic = String("classroom/") + DEVICE_ID;
String telemetryTopic = baseTopic + "/telemetry";
String eventsTopic = baseTopic + "/events";
String cmdTopic = baseTopic + "/cmd";
String statusTopic = baseTopic + "/status";

unsigned long lastPublishMs = 0;
unsigned long publishIntervalMs = 1000;
unsigned long seq = 0;
unsigned long lastMqttAttempt = 0;

float batteryPct = 100.0f;
bool bootEventSent = false;

void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("WiFi...");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi OK: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi timeout");
  }
}

void publishStatus(const char *status) {
  unsigned long ts = millis() / 1000;
  char payload[160];
  snprintf(payload, sizeof(payload),
           "{\"deviceId\":\"%s\",\"ts\":%lu,\"status\":\"%s\"}",
           DEVICE_ID, ts, status);
  mqttClient.publish(statusTopic.c_str(), payload, true);
}

void publishEvent(const char *type) {
  unsigned long ts = millis() / 1000;
  char payload[160];
  snprintf(payload, sizeof(payload),
           "{\"deviceId\":\"%s\",\"ts\":%lu,\"type\":\"%s\"}",
           DEVICE_ID, ts, type);
  mqttClient.publish(eventsTopic.c_str(), payload);
}

void publishAck(const char *cmd, bool ok) {
  unsigned long ts = millis() / 1000;
  char payload[200];
  snprintf(payload, sizeof(payload),
           "{\"deviceId\":\"%s\",\"ts\":%lu,\"type\":\"ack\",\"cmd\":\"%s\",\"ok\":%s}",
           DEVICE_ID, ts, cmd, ok ? "true" : "false");
  mqttClient.publish(eventsTopic.c_str(), payload);
}

int extractIntField(const String &payload, const char *field, int fallback) {
  String key = String("\"") + field + "\"";
  int idx = payload.indexOf(key);
  if (idx == -1) {
    return fallback;
  }
  int colon = payload.indexOf(':', idx);
  if (colon == -1) {
    return fallback;
  }
  int end = payload.indexOf(',', colon);
  if (end == -1) {
    end = payload.indexOf('}', colon);
  }
  if (end == -1) {
    return fallback;
  }
  String number = payload.substring(colon + 1, end);
  number.trim();
  return number.toInt();
}

void onMqttMessage(char *topic, byte *payload, unsigned int length) {
  String text;
  text.reserve(length + 1);
  for (unsigned int i = 0; i < length; i++) {
    text += static_cast<char>(payload[i]);
  }
  text.trim();

  if (text.indexOf("\"cmd\"") == -1) {
    return;
  }

  if (text.indexOf("\"LED\"") != -1) {
    int value = extractIntField(text, "value", -1);
    if (value >= 0) {
      digitalWrite(LED_PIN, value ? HIGH : LOW);
      publishAck("LED", true);
    } else {
      publishAck("LED", false);
    }
    return;
  }

  if (text.indexOf("\"INTERVAL_MS\"") != -1) {
    int value = extractIntField(text, "value", -1);
    if (value > 0) {
      publishIntervalMs = constrain(value, 200, 10000);
      publishAck("INTERVAL_MS", true);
    } else {
      publishAck("INTERVAL_MS", false);
    }
  }
}

bool connectMqtt() {
  String clientId = String("esp32-") + DEVICE_ID + "-" + String(random(0xffff), HEX);
  unsigned long ts = millis() / 1000;
  String willPayload = String("{\"deviceId\":\"") + DEVICE_ID +
                       "\",\"ts\":" + String(ts) +
                       ",\"status\":\"offline\"}";

  bool ok = mqttClient.connect(
      clientId.c_str(),
      nullptr,
      nullptr,
      statusTopic.c_str(),
      1,
      true,
      willPayload.c_str());

  if (ok) {
    mqttClient.subscribe(cmdTopic.c_str());
    publishStatus("online");
    if (!bootEventSent) {
      publishEvent("boot");
      bootEventSent = true;
    }
    Serial.println("MQTT connected");
  }

  return ok;
}

void publishTelemetry() {
  float t = millis() / 1000.0f;
  float tempC = 22.0f + 2.5f * sinf(t / 12.0f) + (random(-10, 10) / 10.0f);
  float humPct = 45.0f + 6.0f * sinf(t / 20.0f) + (random(-8, 8) / 10.0f);

  batteryPct -= 0.03f;
  if (batteryPct < 10.0f) {
    batteryPct = 100.0f;
  }

  unsigned long ts = millis() / 1000;
  char payload[220];
  snprintf(payload, sizeof(payload),
           "{\"deviceId\":\"%s\",\"ts\":%lu,\"seq\":%lu,\"tempC\":%.2f,\"humPct\":%.2f,\"batteryPct\":%.0f}",
           DEVICE_ID, ts, seq++, tempC, humPct, batteryPct);
  mqttClient.publish(telemetryTopic.c_str(), payload);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  randomSeed(micros());

  connectWifi();

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
  }

  if (!mqttClient.connected()) {
    unsigned long now = millis();
    if (now - lastMqttAttempt > 2000) {
      lastMqttAttempt = now;
      connectMqtt();
    }
  }

  mqttClient.loop();

  unsigned long now = millis();
  if (mqttClient.connected() && now - lastPublishMs >= publishIntervalMs) {
    lastPublishMs = now;
    publishTelemetry();
  }
}

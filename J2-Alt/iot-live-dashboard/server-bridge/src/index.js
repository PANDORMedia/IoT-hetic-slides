const http = require('http');
const mqtt = require('mqtt');
const { WebSocketServer } = require('ws');

const config = {
  mqttUrl: process.env.MQTT_URL || 'mqtt://localhost:1883',
  wsPort: parseInt(process.env.WS_PORT || '8080', 10),
  wsPath: process.env.WS_PATH || '/ws',
  topicPrefix: process.env.TOPIC_PREFIX || 'classroom'
};

const lastTelemetryByDeviceId = new Map();

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ server, path: config.wsPath });

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
}

function sendSnapshot(ws) {
  for (const [deviceId, payload] of lastTelemetryByDeviceId.entries()) {
    ws.send(JSON.stringify({ type: 'telemetry', deviceId, payload, source: 'snapshot' }));
  }
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    const msg = safeJsonParse(data.toString());
    if (!msg || msg.type !== 'cmd') {
      return;
    }

    if (!msg.deviceId || !msg.cmd) {
      return;
    }

    const value = msg.value !== undefined ? msg.value : msg.intervalMs;
    const topic = `${config.topicPrefix}/${msg.deviceId}/cmd`;
    const payload = {
      cmd: msg.cmd,
      value: value
    };

    mqttClient.publish(topic, JSON.stringify(payload));
  });

  ws.on('close', () => {
    ws.isAlive = false;
  });

  sendSnapshot(ws);
});

setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

const mqttClient = mqtt.connect(config.mqttUrl, {
  clientId: `bridge-${Math.random().toString(16).slice(2, 10)}`,
  reconnectPeriod: 2000
});

mqttClient.on('connect', () => {
  const telemetryTopic = `${config.topicPrefix}/+/telemetry`;
  const eventsTopic = `${config.topicPrefix}/+/events`;
  const statusTopic = `${config.topicPrefix}/+/status`;

  mqttClient.subscribe([telemetryTopic, eventsTopic, statusTopic]);
  console.log('MQTT connected:', config.mqttUrl);
});

mqttClient.on('reconnect', () => {
  console.log('MQTT reconnecting...');
});

mqttClient.on('error', (err) => {
  console.log('MQTT error:', err.message);
});

mqttClient.on('message', (topic, message) => {
  const payloadText = message.toString();
  const payload = safeJsonParse(payloadText) || { raw: payloadText };

  const parts = topic.split('/');
  const deviceId = payload.deviceId || (parts.length >= 3 ? parts[1] : 'unknown');
  const kind = parts.length >= 3 ? parts[2] : 'unknown';

  const type = kind === 'telemetry' ? 'telemetry' : 'event';
  const outgoing = { type, deviceId, payload };

  if (type === 'telemetry') {
    lastTelemetryByDeviceId.set(deviceId, payload);
  }

  broadcast(outgoing);
});

server.listen(config.wsPort, () => {
  console.log(`WS server on ws://localhost:${config.wsPort}${config.wsPath}`);
});

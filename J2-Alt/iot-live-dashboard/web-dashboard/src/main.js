const wsStatusEl = document.getElementById('wsStatus');
const wsUrlEl = document.getElementById('wsUrl');
const deviceCountEl = document.getElementById('deviceCount');
const lastEventEl = document.getElementById('lastEvent');
const deviceSelectEl = document.getElementById('deviceSelect');
const devicesContainer = document.getElementById('devices');
const template = document.getElementById('deviceCardTemplate');

const ledOnBtn = document.getElementById('ledOnBtn');
const ledOffBtn = document.getElementById('ledOffBtn');
const intervalBtn = document.getElementById('intervalBtn');
const intervalInput = document.getElementById('intervalInput');

const devices = new Map();
let socket = null;
let reconnectDelay = 1000;
let reconnectTimer = null;

const wsParam = new URLSearchParams(window.location.search).get('ws');
const defaultWsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8080/ws`;
const wsUrl = wsParam || defaultWsUrl;
wsUrlEl.textContent = wsUrl;

function setWsStatus(connected) {
  wsStatusEl.textContent = connected ? 'Connected' : 'Disconnected';
  wsStatusEl.classList.toggle('online', connected);
  wsStatusEl.classList.toggle('offline', !connected);
}

function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return Number(value).toFixed(digits);
}

function ensureDevice(deviceId) {
  if (!devices.has(deviceId)) {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('[data-field="deviceId"]').textContent = deviceId;
    devicesContainer.appendChild(node);

    devices.set(deviceId, {
      id: deviceId,
      el: node,
      status: 'unknown',
      telemetry: {},
      lastSeen: null
    });

    updateDeviceSelect();
  }
  return devices.get(deviceId);
}

function updateDeviceSelect() {
  const ids = Array.from(devices.keys()).sort();
  deviceSelectEl.innerHTML = '';

  ids.forEach((deviceId) => {
    const option = document.createElement('option');
    option.value = deviceId;
    option.textContent = deviceId;
    deviceSelectEl.appendChild(option);
  });

  deviceCountEl.textContent = ids.length.toString();
}

function updateDeviceCard(device) {
  const { el, telemetry, status, lastSeen } = device;
  const statusEl = el.querySelector('[data-field="status"]');

  statusEl.textContent = status;
  statusEl.dataset.status = status;

  el.querySelector('[data-field="tempC"]').textContent = formatNumber(telemetry.tempC);
  el.querySelector('[data-field="humPct"]').textContent = formatNumber(telemetry.humPct);
  el.querySelector('[data-field="batteryPct"]').textContent = formatNumber(telemetry.batteryPct, 0);
  el.querySelector('[data-field="seq"]').textContent = telemetry.seq ?? '-';

  const lastSeenText = lastSeen ? new Date(lastSeen).toLocaleTimeString() : '-';
  el.querySelector('[data-field="lastSeen"]').textContent = `Last update: ${lastSeenText}`;
}

function handleTelemetry(deviceId, payload) {
  const device = ensureDevice(deviceId);
  device.telemetry = payload;
  device.status = device.status === 'offline' ? 'online' : device.status;
  device.lastSeen = Date.now();
  updateDeviceCard(device);
}

function handleEvent(deviceId, payload) {
  const device = ensureDevice(deviceId);

  if (payload.status) {
    device.status = payload.status;
  }

  if (payload.type === 'offline') {
    device.status = 'offline';
  }

  if (payload.type === 'boot') {
    device.status = 'online';
  }

  if (payload.type === 'ack') {
    lastEventEl.textContent = `${deviceId}: ack ${payload.cmd || ''}`.trim();
  } else if (payload.type) {
    lastEventEl.textContent = `${deviceId}: ${payload.type}`;
  }

  updateDeviceCard(device);
}

function connect() {
  setWsStatus(false);
  socket = new WebSocket(wsUrl);

  socket.addEventListener('open', () => {
    setWsStatus(true);
    reconnectDelay = 1000;
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'telemetry') {
      handleTelemetry(message.deviceId, message.payload);
    } else if (message.type === 'event') {
      handleEvent(message.deviceId, message.payload);
    }
  });

  socket.addEventListener('close', () => {
    setWsStatus(false);
    scheduleReconnect();
  });

  socket.addEventListener('error', () => {
    setWsStatus(false);
    socket.close();
  });
}

function scheduleReconnect() {
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 1.5, 8000);
    connect();
  }, reconnectDelay);
}

function sendCommand(cmd, value) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  const deviceId = deviceSelectEl.value;
  if (!deviceId) {
    return;
  }

  socket.send(JSON.stringify({ type: 'cmd', deviceId, cmd, value }));
}

ledOnBtn.addEventListener('click', () => sendCommand('LED', 1));
ledOffBtn.addEventListener('click', () => sendCommand('LED', 0));
intervalBtn.addEventListener('click', () => {
  const value = parseInt(intervalInput.value || '1000', 10);
  if (!Number.isNaN(value)) {
    sendCommand('INTERVAL_MS', value);
  }
});

connect();

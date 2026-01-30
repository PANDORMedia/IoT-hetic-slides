/**
 * Flipper IoT - Serial to WebSocket Bridge
 *
 * Connects ESP32 hardware controller to web frontend
 * via Serial ↔ WebSocket relay
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { WebSocketServer, WebSocket } = require('ws');

// === Configuration ===
// IMPORTANT: Change this to match your ESP32 serial port!
// macOS: /dev/tty.usbserial-XXXX or /dev/cu.usbserial-XXXX
// Linux: /dev/ttyUSB0 or /dev/ttyACM0
// Windows: COM3, COM4, etc.
const SERIAL_PORT = process.env.SERIAL_PORT || '/dev/tty.usbserial-0001';
const SERIAL_BAUD = 115200;
const WS_PORT = 8080;

// === State ===
let serialConnected = false;
let wsClients = new Set();

// === Serial Connection ===
console.log(`[Bridge] Attempting to connect to ${SERIAL_PORT}...`);

const port = new SerialPort({
  path: SERIAL_PORT,
  baudRate: SERIAL_BAUD,
  autoOpen: false,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

port.open((err) => {
  if (err) {
    console.error(`[Serial] Failed to open port: ${err.message}`);
    console.log('[Serial] Available ports:');
    SerialPort.list().then((ports) => {
      ports.forEach((p) => {
        console.log(`  - ${p.path} (${p.manufacturer || 'Unknown'})`);
      });
    });
    return;
  }

  serialConnected = true;
  console.log(`[Serial] Connected to ${SERIAL_PORT} at ${SERIAL_BAUD} baud`);
});

port.on('error', (err) => {
  console.error(`[Serial] Error: ${err.message}`);
  serialConnected = false;
});

port.on('close', () => {
  console.log('[Serial] Port closed');
  serialConnected = false;
});

// === Handle incoming data from ESP32 ===
parser.on('data', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  console.log(`[ESP32 →] ${trimmed}`);

  // Try to parse as JSON
  try {
    const msg = JSON.parse(trimmed);

    // Broadcast to all WebSocket clients
    broadcastToClients(trimmed);
  } catch (e) {
    // Non-JSON line (debug output)
    console.log(`[ESP32 Debug] ${trimmed}`);
  }
});

// === WebSocket Server ===
const wss = new WebSocketServer({ port: WS_PORT });

console.log(`[WebSocket] Server listening on ws://localhost:${WS_PORT}`);

wss.on('connection', (ws, req) => {
  const clientId = `client-${Date.now()}`;
  wsClients.add(ws);

  console.log(`[WebSocket] ${clientId} connected (${wsClients.size} total)`);

  // Send connection status
  ws.send(
    JSON.stringify({
      type: 'bridge_status',
      serial: serialConnected,
      clients: wsClients.size,
    })
  );

  // Handle messages from frontend
  ws.on('message', (data) => {
    const message = data.toString().trim();
    console.log(`[Frontend →] ${message}`);

    // Forward to ESP32
    if (serialConnected) {
      port.write(message + '\n', (err) => {
        if (err) {
          console.error(`[Serial] Write error: ${err.message}`);
        }
      });
    } else {
      console.warn('[Serial] Not connected, cannot send to device');
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`[WebSocket] ${clientId} disconnected (${wsClients.size} remaining)`);
  });

  ws.on('error', (err) => {
    console.error(`[WebSocket] Client error: ${err.message}`);
    wsClients.delete(ws);
  });
});

// === Broadcast to all WebSocket clients ===
function broadcastToClients(message) {
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// === Graceful shutdown ===
process.on('SIGINT', () => {
  console.log('\n[Bridge] Shutting down...');

  wss.close(() => {
    console.log('[WebSocket] Server closed');
  });

  if (port.isOpen) {
    port.close(() => {
      console.log('[Serial] Port closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// === Usage instructions ===
console.log(`
╔════════════════════════════════════════════════════════════╗
║                   FLIPPER IoT BRIDGE                       ║
╠════════════════════════════════════════════════════════════╣
║  Serial Port: ${SERIAL_PORT.padEnd(42)}║
║  WebSocket:   ws://localhost:${WS_PORT}                          ║
╠════════════════════════════════════════════════════════════╣
║  To change serial port:                                    ║
║    SERIAL_PORT=/dev/ttyUSB0 node index.js                  ║
╠════════════════════════════════════════════════════════════╣
║  Press Ctrl+C to stop                                      ║
╚════════════════════════════════════════════════════════════╝
`);

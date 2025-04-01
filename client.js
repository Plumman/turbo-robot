const WebSocket = require('ws');

const userId = 'user123'; // Replace with the desired user ID
const ws = new WebSocket(`ws://localhost:8080?userId=${userId}`);

ws.on('open', () => {
  console.log('Connected to server');
  ws.send('Hello from client');
});

ws.on('message', message => {
  console.log(`Received: ${message}`);
});

ws.on('close', () => {
  console.log('Disconnected from server');
});

ws.on('error', error => {
  console.error('WebSocket error:', error);
});
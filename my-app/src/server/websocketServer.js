// src/server/websocketServer.js
const WebSocket = require('ws');

// Create WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
    console.log('A new client connected!');

    // Listen for messages from clients
    ws.on('message', message => {
        const data = JSON.parse(message);
        console.log('Received message from client:', data);

        // Example: Broadcast message to all clients when a request is accepted
        if (data.type === 'accept') {
            // Broadcasting to all connected clients
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(
                        JSON.stringify({
                            type: 'accept',
                            requestId: data.requestId,
                            status: data.status,
                        })
                    );
                }
            });
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('A client has disconnected');
    });
});

console.log('WebSocket server is running on ws://127.0.0.1:8080');
// Import the required modules
const WebSocket = require('ws'); // WebSocket library
const http = require('http'); // HTTP server library
const url = require('url'); // URL parsing library

// Store user information
const users = {}; // Object to store connected users (userId: WebSocket)

// Create a new WebSocket server instance
const wss = new WebSocket.Server({ noServer: true }); // Create a WebSocket server without binding to an HTTP server

// Create an HTTP server
const server = http.createServer((req, res) => {
  // Handle POST requests to the /api/message endpoint
  if (req.url === '/api/message' && req.method === 'POST') {
    let body = '';
    // Read the request body
    req.on('data', chunk => { // Listen for 'data' events to read the request body in chunks
      body += chunk.toString(); // Accumulate the chunks into the 'body' variable
    });
    req.on('end', () => { // Listen for the 'end' event, which indicates the end of the request body
      try {
        // Parse the request body as JSON and extract the message and userId
        const { message, userId } = JSON.parse(body); // Parse the JSON string into an object and extract the 'message' and 'userId' properties
        console.log(`Received API message from user ${userId}: ${message}`); // Log the received message and user ID

        // Broadcast the message to all connected clients with user information
        wss.clients.forEach(client => { // Iterate over all connected clients
          if (client.readyState === WebSocket.OPEN) { // Check if the client is in the 'OPEN' state (connection is established)
            client.send(JSON.stringify({ userId, message: message.toString() })); // Send the message to the client as a JSON string, converting the message to a string
          }
        });

        // Send a 200 OK response to the client
        res.writeHead(200, { 'Content-Type': 'text/plain' }); // Set the response status code to 200 OK and the content type to 'text/plain'
        res.end('Message received'); // Send the response body 'Message received'
      } catch (error) {
        // Handle errors during JSON parsing
        console.error('Error parsing JSON:', error); // Log the error
        res.writeHead(400, { 'Content-Type': 'text/plain' }); // Set the response status code to 400 Bad Request and the content type to 'text/plain'
        res.end('Invalid JSON'); // Send the response body 'Invalid JSON'
      }
    });
  } else {
    // Handle requests to any other URL
    res.writeHead(404, { 'Content-Type': 'text/plain' }); // Set the response status code to 404 Not Found and the content type to 'text/plain'
    res.end('Not found'); // Send the response body 'Not found'
  }
});

// Handle WebSocket connections
wss.on('connection', (ws, req) => { // Listen for 'connection' events, which are emitted when a new client connects
  // Extract the userId from the connection URL
  const userId = ws.userId; // Get the userId from the WebSocket instance

  if (!userId) { // Check if the userId is missing
    console.log('Client connected without userId'); // Log a message
    ws.close(); // Close the connection
    return; // Exit the function
  }

  users[userId] = ws; // Store the WebSocket connection in the 'users' object, using the userId as the key
  console.log(`Client connected with userId: ${userId}`); // Log a message

  // Handle messages from clients
  ws.on('message', message => { // Listen for 'message' events, which are emitted when the server receives a message from a client
    console.log(`Received message from user ${userId}: ${message}`); // Log the received message and user ID

    // Broadcast the message to all connected clients with user information
    wss.clients.forEach(client => { // Iterate over all connected clients
      if (client !== ws && client.readyState === WebSocket.OPEN) { // Check if the client is not the sender and is in the 'OPEN' state (connection is established)
        client.send(JSON.stringify({ userId, message: message.toString() })); // Send the message to the client as a JSON string, converting the message to a string
      }
    });
  });

  // Handle client disconnections
  ws.on('close', () => { // Listen for 'close' events, which are emitted when a client disconnects
    console.log(`Client disconnected with userId: ${userId}`); // Log a message
    delete users[userId]; // Remove the WebSocket connection from the 'users' object
  });
});

// Handle WebSocket upgrade requests
server.on('upgrade', (request, socket, head) => { // Listen for 'upgrade' events, which are emitted when the HTTP server receives an upgrade request
  const parsedUrl = url.parse(request.url, true); // Parse the URL of the upgrade request
  const userId = parsedUrl.query.userId; // Extract the userId from the query parameters

  wss.handleUpgrade(request, socket, head, ws => { // Handle the WebSocket upgrade process
    ws.userId = userId; // Store the userId in the WebSocket instance
    wss.emit('connection', ws, request); // Emit a 'connection' event, passing the WebSocket instance and the HTTP request
  });
});

// Start the HTTP server
server.listen(8080, () => { // Start the HTTP server and listen for incoming connections on port 8080
  console.log('WebSocket server started on port 8080'); // Log a message
});
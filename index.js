require('dotenv').config();
const fs = require('fs');
const cors = require("cors");
const express = require("express");
const http = require('http');
const MQTT = require('mqtt');
const { spawn } = require('child_process');
const APP = express();
const server = http.createServer(APP);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const CLIENTID = "frontend";

const client = MQTT.connect(process.env.CONNECT_URL, {
  clientId: CLIENTID,
  clean: true,
  connectTimeout: 3000,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  reconnectPeriod: 10000,
  debug: true,
  rejectUnauthorized: false // Add this line for testing, should be removed in production
});

// Used for debugging 

client.on("error", function (error) {
  console.error("Connection error: ", error);
});

client.on("close", function () {
  console.log("Connection closed");
});

client.on("offline", function () {
  console.log("Client went offline");
});

client.on("reconnect", function () {
  console.log("Attempting to reconnect...");
});

// MQTT Connection

client.on('connect', async () => {
  console.log("Connected");

  client.subscribe("ultrasonic", (err) => {
    if (err) {
      console.error("Subscription error for 'ultrasonic': ", err);
    } else {
      console.log("Subscribed to 'ultrasonic'");
    }
  });

  client.subscribe("temp", (err) => {
    if (err) {
      console.error("Subscription error for 'temp': ", err);
    } else {
      console.log("Subscribed to 'temp'");
    }
  });

  client.subscribe("humidity", (err) => {
    if (err) {
      console.error("Subscription error for 'temp': ", err);
    } else {
      console.log("Subscribed to 'humidity'");
    }
  });

  client.subscribe("light", (err) => {
    if (err) {
      console.error("Subscription error for 'light': ", err);
    } else {
      console.log("Subscribed to 'light'");
    }
  });
});


const corsOptions = {
  origin: '*'
};

APP.use(cors(corsOptions));
APP.use(express.json());

// Readings from sensors 
let latestTemp = null;
let latestUltrasonic = null;
let latestHumidity = null;
let latestLight = null;

io.on("connection", (socket) => {
  console.log("Frontend connected to socket");


// io.on("connection", (socket) => {
//   socket.on('text', (message) =>{
//     console.log('backend recieved message', message);

//     client.publish("text", message.toString());
//   });
// });
  // Send the latest sensor data to the newly connected client
  if (latestTemp) {
    socket.emit('temp', latestTemp);
  }
  if (latestUltrasonic) socket.emit('ultrasonic', latestUltrasonic);
  if (latestLight) {
    socket.emit('light', latestLight);
  }

  // Listen for messages from the frontend
  socket.on('send_message', (message) => {
    console.log('Received message from frontend:', message);
    client.publish("display", message.toString());
    // Send confirmation back to frontend
    socket.emit('server_response', { message: `Message sent!` });
  });

  // Handle take picture request
  socket.on('take_picture', () => {
    console.log('📸 Taking picture and getting AI description...');
    
    // Determine Python command based on OS
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    // Execute the Python script
    const pythonProcess = spawn(pythonCmd, ['../AI/receive.py', 'get_description'], {
      cwd: __dirname
    });

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
      console.log(`Python output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.error(`Python error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python script finished with code ${code}`);
      console.log('Full stdout:', stdoutData);
      console.log('Full stderr:', stderrData);
      
      if (code === 0) {
        // Read the description file
        const fs = require('fs');
        const descriptionPath = '../AI/description.txt';
        
        try {
          if (fs.existsSync(descriptionPath)) {
            const description = fs.readFileSync(descriptionPath, 'utf8');
            console.log('Description read:', description.substring(0, 100) + '...');
            socket.emit('picture_taken', { 
              success: true, 
              message: 'Picture analyzed successfully!',
              description: description
            });
          } else {
            console.log('Description file not found at:', descriptionPath);
            socket.emit('picture_taken', { 
              success: false, 
              message: 'Picture taken but no description file generated'
            });
          }
        } catch (error) {
          console.error('Error reading description file:', error);
          socket.emit('picture_taken', { 
            success: false, 
            message: 'Picture taken but error reading description: ' + error.message
          });
        }
      } else {
        console.error('Python script failed with code:', code);
        socket.emit('picture_taken', { 
          success: false, 
          message: 'Failed to analyze picture. Check server logs for details.' 
        });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      socket.emit('picture_taken', { 
        success: false, 
        message: 'Failed to start camera process: ' + error.message 
      });
    });
  });

  socket.on("disconnect", () => {
    console.log("Frontend disconnected from socket");
  });

});

setInterval(() => {
  io.emit('temp', latestTemp);
  io.emit('ultrasonic', latestUltrasonic);
  io.emit('humidity', latestHumidity);
  io.emit('light', latestLight)
}, 1000);

server.listen(8000, () => {
  console.log('Server is running on port 8000');
});

client.on('message', (TOPIC, payload) => {
  console.log("Received from broker:", TOPIC, payload.toString());
  if( TOPIC === 'temp' ) {
    latestTemp = payload.toString();
  }
  else if ( TOPIC === 'ultrasonic' ) {
    latestUltrasonic = payload.toString();
  }
  else if ( TOPIC === 'humidity') {
    latestHumidity = payload.toString();
  }
  else if ( TOPIC === 'light') {
    latestLight = payload.toString();
  }
});


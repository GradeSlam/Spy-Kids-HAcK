import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:8000');

function App() {
  const [text, setText] = useState("");           // Added state for input
  const [response, setResponse] = useState("");   // Added state for server response
  const [pictureStatus, setPictureStatus] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  
  // Sensor data states
  const [temperature, setTemperature] = useState("--");
  const [humidity, setHumidity] = useState("--");
  const [light, setLight] = useState("--");
  const [ultrasonic, setUltrasonic] = useState("--");

  useEffect(() => {
    socket.on('connect', () => console.log('Connected:', socket.id));

    // Sensor data listeners
    socket.on('temp', (data) => setTemperature(data));
    socket.on('humidity', (data) => setHumidity(data));
    socket.on('light', (data) => setLight(data));
    socket.on('ultrasonic', (data) => setUltrasonic(data));

    socket.on('picture_taken', data => {
      setPictureStatus(data.message);
      if (data.description) {
        setAiDescription(data.description);
      }
      setTimeout(() => setPictureStatus(""), 5000);
    });

    socket.on('server_response', (data) => {
      setResponse(data.message);
    });

    return () => {
      socket.off('temp');
      socket.off('humidity');
      socket.off('light');
      socket.off('ultrasonic');
      socket.off('picture_taken');
      socket.off('server_response');
    };
  }, []);

  const handleChange = (e) => {
    setText(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    socket.emit('send_message', text);
    setText(""); // Clear input
  };

  const handleTakePicture = () => {
    socket.emit('take_picture');
    setPictureStatus("Taking picture...");
  };

  return (
    <div className="app">
      <h1>HAcK Project Dashboard</h1>
      
      {/* Sensor Data Display */}
      <div className="sensor-grid">
        <div className="sensor-card">
          <h3>Temperature</h3>
          <p className="sensor-value">{temperature}°C</p>
        </div>
        <div className="sensor-card">
          <h3>Humidity</h3>
          <p className="sensor-value">{humidity}%</p>
        </div>
        <div className="sensor-card">
          <h3>Light Level</h3>
          <p className="sensor-value">{light}%</p>
        </div>
        <div className="sensor-card">
          <h3>Distance</h3>
          <p className="sensor-value">{ultrasonic} cm</p>
        </div>
      </div>

      {/* Camera Section */}
      <div className="camera-section">
        <h2>Camera Control</h2>
        <button 
          className="camera-button" 
          onClick={handleTakePicture}
          disabled={pictureStatus === "Taking picture..."}
        >
          {pictureStatus === "Taking picture..." ? "Processing..." : "Take Picture"}
        </button>
        {pictureStatus && <p className="status-message">{pictureStatus}</p>}
        
        {/* AI Description Display */}
        {aiDescription && (
          <div className="ai-description">
            <h3>AI Analysis</h3>
            <p>{aiDescription}</p>
          </div>
        )}
      </div>

      {/* Message Section */}
      <div className="message-section">
        <form className="message-form" onSubmit={handleSubmit}>
          <h2>Send Message to OLED</h2>
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter message to display on OLED"
              value={text}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="message-button">
            Send to OLED
          </button>
        </form>
        {response && <h3>Response: {response}</h3>}
      </div>
    </div>
  );
}

export default App;
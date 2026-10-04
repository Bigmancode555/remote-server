const express = require('express');
const cors = require('cors');
const Pusher = require('pusher');

const app = express();

// Increase JSON body limit to 5MB to handle Base64 screenshot payloads
app.use(express.json({ limit: '5mb' }));
app.use(cors());

// Initialize Pusher using environment variables set in Render
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

// Memory cache for latest worker screenshots
const latestScreenshots = {};

// 1. Worker Active Ping Endpoint
app.post('/worker-active', (req, res) => {
  const data = req.body;
  
  // Attach cached screenshot if available
  if (latestScreenshots[data.workerId]) {
    data.screenshot = latestScreenshots[data.workerId];
  }

  pusher.trigger('master-notifications', 'worker-active', data);
  res.status(200).send({ status: 'OK' });
});

// 2. Screenshot Upload Endpoint
app.post('/upload-screenshot', (req, res) => {
  const { workerId, image } = req.body;
  if (workerId && image) {
    latestScreenshots[workerId] = image;
    // Broadcast updated image to Master Dashboard
    pusher.trigger('master-notifications', 'screenshot-updated', { workerId, image });
  }
  res.status(200).send({ status: 'OK' });
});

// 3. Command Relay Endpoint
app.post('/send-command', (req, res) => {
  const { targetChannel, event, data } = req.body;
  pusher.trigger(targetChannel, event, data);
  res.status(200).send({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

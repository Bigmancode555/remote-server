require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Pusher = require('pusher');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Pusher using credentials from .env file
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

// Endpoint: Worker reports active status -> Server broadcasts to Master
app.post('/worker-active', async (req, res) => {
  const { workerId, pageTitle, url, timestamp } = req.body;
  
  await pusher.trigger('master-notifications', 'worker-active', {
    workerId,
    pageTitle,
    url,
    timestamp
  });

  res.status(200).send({ status: 'ok' });
});

// Endpoint: Master issues a command -> Server broadcasts to specific Worker
app.post('/send-command', async (req, res) => {
  const { targetChannel, event, data } = req.body;

  await pusher.trigger(targetChannel, event, data);

  res.status(200).send({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Relay server running on port ${PORT}`));
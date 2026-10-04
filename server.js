const express = require('express');
const cors = require('cors');
const Pusher = require('pusher');

const app = express();

app.use(express.json());
app.use(cors());

// Initialize Pusher using environment variables set in Render
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

// 1. Worker Active Ping Endpoint
app.post('/worker-active', (req, res) => {
  pusher.trigger('master-notifications', 'worker-active', req.body);
  res.status(200).send({ status: 'OK' });
});

// 2. Command Relay Endpoint
app.post('/send-command', (req, res) => {
  const { targetChannel, event, data } = req.body;
  pusher.trigger(targetChannel, event, data);
  res.status(200).send({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

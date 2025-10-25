const express = require('express');
const app = express();
const port = 5000;

app.get('/health', (req, res) => res.send('Backend is healthy!'));

app.get('/', (req, res) => res.send('Hello from Backend!'));

app.listen(port, () => console.log(`Backend running on port ${port}`));

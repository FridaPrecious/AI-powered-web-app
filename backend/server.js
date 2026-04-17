const express = require('express');
const cors = require('cors');
require('dotenv').config();

const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', taskRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Vunoh Diaspora Assistant API Running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
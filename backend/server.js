const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors({
    origin: ['https://kerm-shop.vercel.app', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        message: 'K-SHOP Backend with Supabase is running!',
        timestamp: new Date().toISOString()
    });
});

// Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Serveur Supabase démarré sur le port ${PORT}`);
});

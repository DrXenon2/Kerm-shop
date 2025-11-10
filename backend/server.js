const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors({
    origin: ['https://kerm-shop.vercel.app', 'http://localhost:3000', 'http://localhost:5000'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques du backend
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 CORRECTION IMPORTANTE : Servir aussi le frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        message: 'K-SHOP Backend with Supabase is running!',
        timestamp: new Date().toISOString(),
        status: 'healthy'
    });
});

// 🔥 CORRECTION : Routes pour les pages sans .html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/signin.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/signup.html'));
});

app.get('/accueil', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/accueil.html'));
});

app.get('/comptes', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/comptes.html'));
});

app.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/user.html'));
});

app.get('/historique', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/historique.html'));
});

app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/support.html'));
});

app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/faq.html'));
});

app.get('/resetpassword', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/resetpassword.html'));
});

app.get('/account-verification', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/account-verification.html'));
});

// Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 🔥 CORRECTION : Route de fallback pour les URLs non trouvées
app.get('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.path
    });
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
    console.error('🚨 Erreur serveur:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong!'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Serveur K-SHOP démarré sur le port ${PORT}`);
    console.log(`📁 Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
});

// js/main.js - CORRECTION
const API_BASE_URL = 'https://kerm-shop.onrender.com/api';

// TEST: Fonction pour vérifier toutes les routes
async function testAllRoutes() {
    const routes = [
        '/health',
        '/auth/login',
        '/orders',
        '/accounts',
        '/maintenance/status'
    ];

    for (const route of routes) {
        try {
            const response = await fetch(API_BASE_URL + route);
            console.log(`${route}: ${response.status}`);
        } catch (error) {
            console.error(`${route}: ERROR -`, error.message);
        }
    }
}

// Appeler au chargement pour debug
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔗 Testing API routes...');
    testAllRoutes();
});

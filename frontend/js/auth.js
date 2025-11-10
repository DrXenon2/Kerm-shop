// Inscription
async function register(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de l\'inscription');
        }

        notificationSystem.show(data.message, 'success');
        return true;

    } catch (error) {
        notificationSystem.show(error.message, 'error');
        return false;
    }
}

// Connexion
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de la connexion');
        }

        localStorage.setItem('kshop_token', data.token);
        currentUser = data.user;
        updateNavigation();
        
        notificationSystem.show('Connexion réussie!', 'success');
        setTimeout(() => window.location.href = '/accueil.html', 1000);
        return true;

    } catch (error) {
        notificationSystem.show(error.message, 'error');
        return false;
    }
}

// Vérifier email
async function verifyEmail(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de la vérification');
        }

        notificationSystem.show(data.message, 'success');
        return true;

    } catch (error) {
        notificationSystem.show(error.message, 'error');
        return false;
    }
}

// Mot de passe oublié
async function forgotPassword(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de l\'envoi');
        }

        notificationSystem.show(data.message, 'success');
        return true;

    } catch (error) {
        notificationSystem.show(error.message, 'error');
        return false;
    }
}

// Réinitialiser mot de passe
async function resetPassword(token, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de la réinitialisation');
        }

        notificationSystem.show(data.message, 'success');
        return true;

    } catch (error) {
        notificationSystem.show(error.message, 'error');
        return false;
    }
}

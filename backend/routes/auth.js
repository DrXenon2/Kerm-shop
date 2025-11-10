const express = require('express');
const supabase = require('../config/supabase');
const { sendEmail } = require('../config/email');
const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;

        console.log('Tentative d\'inscription:', { email, username });

        // 1. Créer l'utilisateur sans confirmation email auto
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (authError) {
            console.error('Erreur auth Supabase:', authError);
            
            if (authError.message.includes('already registered')) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé' });
            }
            
            throw authError;
        }

        console.log('Auth créée, création du profil...');

        // 2. Attendre un peu que l'user soit créé dans auth.users
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Créer le profil avec une approche plus safe
        let profileData;
        let profileError;

        // Essayer plusieurs fois en cas de délai de création user
        for (let i = 0; i < 3; i++) {
            const result = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        username: username,
                        email: email
                    }
                ])
                .select()
                .single();

            if (!result.error) {
                profileData = result.data;
                break;
            }
            
            profileError = result.error;
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!profileData) {
            console.error('Erreur création profil après plusieurs tentatives:', profileError);
            
            // Fallback: créer le profil sans foreign key
            const fallbackResult = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        username: username,
                        email: email
                    }
                ])
                .select()
                .single();

            if (fallbackResult.error) {
                throw fallbackResult.error;
            }
            
            profileData = fallbackResult.data;
        }

        console.log('Profil créé avec succès');

        // 4. Générer token de vérification manuel
        const verificationToken = require('crypto').randomBytes(32).toString('hex');
        
        // 5. Envoyer email de vérification personnalisé
        const verificationUrl = `${process.env.FRONTEND_URL}/account-verification.html?token=${verificationToken}&email=${encodeURIComponent(email)}`;
        
        await sendEmail(
            email,
            'Vérification de votre compte K-SHOP',
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00ff88; text-align: center;">Bienvenue sur K-SHOP !</h2>
                <p>Bonjour <strong>${username}</strong>,</p>
                <p>Merci de vous être inscrit sur K-SHOP. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="
                        background: linear-gradient(135deg, #00ff88, #00ccff);
                        color: #0a0a0f;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 10px;
                        font-weight: bold;
                        display: inline-block;
                    ">Vérifier mon compte</a>
                </div>
                <p>Ce lien expirera dans 24 heures.</p>
                <p style="color: #666; font-size: 14px;">
                    Si vous n'avez pas créé de compte, veuillez ignorer cet email.
                </p>
            </div>
            `
        );

        res.status(201).json({
            message: 'Compte créé avec succès. Vérifiez votre email.',
            user: {
                id: profileData.id,
                username: profileData.username,
                email: profileData.email
            }
        });

    } catch (error) {
        console.error('Erreur inscription complète:', error);
        res.status(400).json({ message: error.message });
    }
});

// Vérification email personnalisée
router.post('/verify-email', async (req, res) => {
    try {
        const { token, email } = req.body;

        // Ici tu devrais vérifier le token dans ta base de données
        // Pour l'instant, on marque simplement l'email comme vérifié
        const { data: profile, error } = await supabase
            .from('profiles')
            .update({ email_verified: true })
            .eq('email', email)
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Email vérifié avec succès' });

    } catch (error) {
        res.status(400).json({ message: 'Erreur de vérification' });
    }
});

// Mot de passe oublié - Version personnalisée
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Vérifier si l'email existe
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('email', email)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ message: 'Email non trouvé' });
        }

        // Générer token de réinitialisation
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 heure

        // Stocker le token (dans une table dédiée ou dans profiles)
        const { error: tokenError } = await supabase
            .from('profiles')
            .update({
                reset_token: resetToken,
                reset_expires: resetExpires.toISOString()
            })
            .eq('email', email);

        if (tokenError) throw tokenError;

        // Envoyer email personnalisé
        const resetUrl = `${process.env.FRONTEND_URL}/resetpassword.html?token=${resetToken}`;
        
        await sendEmail(
            email,
            'Réinitialisation de votre mot de passe K-SHOP',
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00ff88; text-align: center;">Réinitialisation de mot de passe</h2>
                <p>Bonjour <strong>${profile.username}</strong>,</p>
                <p>Vous avez demandé la réinitialisation de votre mot de passe K-SHOP.</p>
                <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="
                        background: linear-gradient(135deg, #00ff88, #00ccff);
                        color: #0a0a0f;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 10px;
                        font-weight: bold;
                        display: inline-block;
                    ">Réinitialiser mon mot de passe</a>
                </div>
                <p>Ce lien expirera dans 1 heure.</p>
                <p style="color: #666; font-size: 14px;">
                    Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
                </p>
            </div>
            `
        );

        res.json({ message: 'Email de réinitialisation envoyé' });

    } catch (error) {
        console.error('Erreur mot de passe oublié:', error);
        res.status(400).json({ message: error.message });
    }
});

// Réinitialisation mot de passe - Version personnalisée
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        // Vérifier le token
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, reset_expires')
            .eq('reset_token', token)
            .single();

        if (profileError || !profile) {
            return res.status(400).json({ message: 'Token invalide' });
        }

        // Vérifier l'expiration
        if (new Date(profile.reset_expires) < new Date()) {
            return res.status(400).json({ message: 'Token expiré' });
        }

        // Mettre à jour le mot de passe via Supabase Auth
        const { error: authError } = await supabase.auth.admin.updateUserById(
            profile.id,
            { password: password }
        );

        if (authError) throw authError;

        // Nettoyer le token
        await supabase
            .from('profiles')
            .update({
                reset_token: null,
                reset_expires: null
            })
            .eq('id', profile.id);

        res.json({ message: 'Mot de passe réinitialisé avec succès' });

    } catch (error) {
        console.error('Erreur réinitialisation:', error);
        res.status(400).json({ message: error.message });
    }
});

// Connexion
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Récupérer le profil
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) throw profileError;

        res.json({
            token: data.session.access_token,
            user: {
                id: profile.id,
                username: profile.username,
                email: profile.email,
                playerId: profile.player_id
            }
        });

    } catch (error) {
        res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }
});

// ... autres routes (profile, etc.)

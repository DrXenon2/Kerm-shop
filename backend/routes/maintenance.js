const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Statut maintenance
router.get('/status', async (req, res) => {
    try {
        const { data: maintenance, error } = await supabase
            .from('maintenance')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // Si pas de maintenance, retourner défaut
        const status = maintenance || {
            is_active: false,
            message: 'Le site est en maintenance. Veuillez réessayer plus tard.'
        };

        res.json(status);

    } catch (error) {
        res.status(500).json({ message: 'Erreur statut maintenance' });
    }
});

module.exports = router;

const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Récupérer tous les comptes disponibles
router.get('/', async (req, res) => {
    try {
        const { data: accounts, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('is_available', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(accounts);

    } catch (error) {
        res.status(500).json({ message: 'Erreur chargement comptes' });
    }
});

module.exports = router;

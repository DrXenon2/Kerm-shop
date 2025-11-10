const express = require('express');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const router = express.Router();

// Créer une commande
router.post('/', auth, async (req, res) => {
    try {
        const { product, playerId, paymentMethod, customerInfo } = req.body;

        // Validation
        if (!product || !playerId) {
            return res.status(400).json({ message: 'Données manquantes' });
        }

        if (!/^\d{19}$/.test(playerId)) {
            return res.status(400).json({ message: 'Player ID invalide' });
        }

        // Créer la commande
        const { data: order, error } = await supabase
            .from('orders')
            .insert([
                {
                    user_id: req.user.id,
                    cp_amount: product.cpAmount,
                    price: product.price,
                    discount: product.discount || 0,
                    player_id: playerId,
                    payment_method: paymentMethod,
                    customer_email: customerInfo?.email,
                    customer_phone: customerInfo?.phone,
                    fapshi_link: product.fapshiLink
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            message: 'Commande créée',
            order: order
        });

    } catch (error) {
        console.error('Erreur création commande:', error);
        res.status(500).json({ message: 'Erreur création commande' });
    }
});

// Historique des commandes
router.get('/my-orders', auth, async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(orders);

    } catch (error) {
        res.status(500).json({ message: 'Erreur chargement commandes' });
    }
});

module.exports = router;

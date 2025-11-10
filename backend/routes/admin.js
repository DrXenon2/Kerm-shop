const express = require('express');
const supabase = require('../config/supabase');
const admin = require('../middleware/admin');
const router = express.Router();

// === ORDRES ===

// Récupérer toutes les commandes
router.get('/orders', admin, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (
          username,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(orders);

  } catch (error) {
    console.error('Erreur commandes admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour le statut d'une commande
router.put('/orders/:id', admin, async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    
    const { data: order, error } = await supabase
      .from('orders')
      .update({ 
        status, 
        admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select(`
        *,
        profiles:user_id (
          username,
          email
        )
      `)
      .single();

    if (error) throw error;

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    res.json({ message: 'Statut mis à jour', order });

  } catch (error) {
    console.error('Erreur mise à jour commande:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// === COMPTES ===

// Créer un nouveau compte à vendre
router.post('/accounts', admin, async (req, res) => {
  try {
    const accountData = {
      uid: req.body.uid,
      level: req.body.level,
      mythic_characters: req.body.mythicCharacters || 0,
      legendary_characters: req.body.legendaryCharacters || 0,
      mythic_weapons: req.body.mythicWeapons || 0,
      legendary_weapons: req.body.legendaryWeapons || 0,
      vehicles: req.body.legendaryVehicles || {},
      negative_cp: req.body.negativeCP?.hasNegativeCP || false,
      negative_cp_amount: req.body.negativeCP?.amount || '',
      negotiable: req.body.negotiable || false,
      image_url: req.body.image,
      seller_contact: req.body.sellerContact,
      price: req.body.price,
      is_available: req.body.isAvailable !== false
    };

    const { data: account, error } = await supabase
      .from('accounts')
      .insert([accountData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ 
      message: 'Compte ajouté avec succès',
      account 
    });

  } catch (error) {
    console.error('Erreur création compte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer tous les comptes (même non disponibles)
router.get('/accounts', admin, async (req, res) => {
  try {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(accounts);

  } catch (error) {
    console.error('Erreur comptes admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un compte
router.put('/accounts/:id', admin, async (req, res) => {
  try {
    const accountData = {
      uid: req.body.uid,
      level: req.body.level,
      mythic_characters: req.body.mythicCharacters,
      legendary_characters: req.body.legendaryCharacters,
      mythic_weapons: req.body.mythicWeapons,
      legendary_weapons: req.body.legendaryWeapons,
      vehicles: req.body.legendaryVehicles,
      negative_cp: req.body.negativeCP?.hasNegativeCP,
      negative_cp_amount: req.body.negativeCP?.amount,
      negotiable: req.body.negotiable,
      image_url: req.body.image,
      seller_contact: req.body.sellerContact,
      price: req.body.price,
      is_available: req.body.isAvailable
    };

    // Supprimer les champs undefined
    Object.keys(accountData).forEach(key => {
      if (accountData[key] === undefined) {
        delete accountData[key];
      }
    });

    const { data: account, error } = await supabase
      .from('accounts')
      .update(accountData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (!account) {
      return res.status(404).json({ message: 'Compte non trouvé' });
    }

    res.json({ message: 'Compte mis à jour', account });

  } catch (error) {
    console.error('Erreur mise à jour compte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un compte
router.delete('/accounts/:id', admin, async (req, res) => {
  try {
    const { data: account, error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (!account) {
      return res.status(404).json({ message: 'Compte non trouvé' });
    }

    res.json({ message: 'Compte supprimé' });

  } catch (error) {
    console.error('Erreur suppression compte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// === STATISTIQUES ===

router.get('/stats', admin, async (req, res) => {
  try {
    // Compter les commandes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('status');

    if (ordersError) throw ordersError;

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending_payment').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;

    // Compter les comptes
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('is_available');

    if (accountsError) throw accountsError;

    const totalAccounts = accounts.length;
    const availableAccounts = accounts.filter(account => account.is_available).length;

    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalAccounts,
      availableAccounts
    });

  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

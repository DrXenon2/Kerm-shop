const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Webhook Fapshi pour les confirmations de paiement
router.post('/webhook', async (req, res) => {
    try {
        const { event, data } = req.body;
        console.log('📨 Webhook Fapshi reçu:', event, data);

        if (event === 'payment.confirmed') {
            const { amount, currency, transactionId, customData } = data;
            
            // Trouver la commande correspondante (via customData ou transactionId)
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .or(`fapshi_transaction_id.eq.${transactionId},id.eq.${customData?.orderId}`)
                .eq('status', 'pending_payment')
                .single();

            if (orderError) {
                console.error('❌ Commande non trouvée:', orderError);
                return res.status(404).json({ error: 'Commande non trouvée' });
            }

            if (order) {
                // Mettre à jour la commande dans Supabase
                const { data: updatedOrder, error: updateError } = await supabase
                    .from('orders')
                    .update({
                        status: 'completed',
                        payment_status: 'paid',
                        fapshi_transaction_id: transactionId,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', order.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('❌ Erreur mise à jour commande:', updateError);
                    return res.status(500).json({ error: 'Erreur mise à jour commande' });
                }

                // Déclencher la livraison automatique des CP
                await deliverCP(order.player_id, order.cp_amount);

                console.log(`✅ Paiement confirmé pour la commande ${order.id}`);
                
                // Envoyer un email de confirmation (optionnel)
                await sendConfirmationEmail(order);
            }
        }

        // Toujours répondre 200 à Fapshi
        res.status(200).json({ received: true, message: 'Webhook traité avec succès' });
        
    } catch (error) {
        console.error('❌ Erreur webhook Fapshi:', error);
        // IMPORTANT: Toujours répondre 200 même en cas d'erreur
        res.status(200).json({ received: true, error: 'Erreur interne mais webhook accepté' });
    }
});

// Fonction de livraison des CP
async function deliverCP(playerId, cpAmount) {
    try {
        console.log(`🚚 Livraison de ${cpAmount} CP au joueur ${playerId}`);
        
        // ICI TU METS TA LOGIQUE DE LIVRAISON RÉELLE
        // Exemples :
        
        // 1. Appel à ton API de livraison
        // const deliveryResult = await fetch('https://ton-api-livraison.com/deliver', {
        //     method: 'POST',
        //     body: JSON.stringify({ playerId, cpAmount })
        // });
        
        // 2. Intégration avec un service tiers
        // await yourCPDeliveryService.deliver(playerId, cpAmount);
        
        // 3. Notification à ton équipe
        await notifyTeam(playerId, cpAmount);
        
        // 4. Log dans la base de données
        await logDelivery(playerId, cpAmount);
        
        console.log(`✅ CP livrés avec succès à ${playerId}`);
        
    } catch (error) {
        console.error('❌ Erreur livraison CP:', error);
        // Marquer la commande comme en erreur
        await markOrderAsFailed(playerId, cpAmount, error.message);
    }
}

// Notifier l'équipe (WhatsApp, Telegram, etc.)
async function notifyTeam(playerId, cpAmount) {
    try {
        // Exemple: Envoi WhatsApp à ton équipe
        const message = `🎮 NOUVELLE COMMANDE!\nPlayer: ${playerId}\nCP: ${cpAmount}\nÀ livrer ASAP!`;
        
        // Intégration WhatsApp
        // await fetch(`https://api.whatsapp.com/send?phone=237656520674&text=${encodeURIComponent(message)}`);
        
        console.log(`📲 Notification équipe: ${message}`);
    } catch (error) {
        console.error('Erreur notification équipe:', error);
    }
}

// Logger la livraison dans la base de données
async function logDelivery(playerId, cpAmount) {
    try {
        const { data, error } = await supabase
            .from('delivery_logs') // Crée cette table si besoin
            .insert([
                {
                    player_id: playerId,
                    cp_amount: cpAmount,
                    delivered_at: new Date().toISOString(),
                    status: 'delivered'
                }
            ]);

        if (error) console.error('Erreur log livraison:', error);
        
    } catch (error) {
        console.error('Erreur log livraison:', error);
    }
}

// Marquer une commande comme échouée
async function markOrderAsFailed(playerId, cpAmount, errorMessage) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .update({
                status: 'failed',
                payment_status: 'failed',
                admin_notes: `Échec livraison: ${errorMessage}`,
                updated_at: new Date().toISOString()
            })
            .eq('player_id', playerId)
            .eq('cp_amount', cpAmount)
            .eq('status', 'pending_payment');

        if (error) console.error('Erreur marquage échec:', error);
        
    } catch (error) {
        console.error('Erreur marquage échec:', error);
    }
}

// Envoyer un email de confirmation
async function sendConfirmationEmail(order) {
    try {
        // Utilise Nodemailer ou un service d'email
        console.log(`📧 Email confirmation envoyé pour la commande ${order.id}`);
        
        // Exemple avec Nodemailer :
        // await transporter.sendMail({
        //     to: order.customer_email,
        //     subject: 'Vos CP COD:M ont été livrés!',
        //     html: `<h2>Merci pour votre achat!</h2><p>${order.cp_amount} CP livrés à ${order.player_id}</p>`
        // });
        
    } catch (error) {
        console.error('Erreur email confirmation:', error);
    }
}

// Route de test pour le webhook
router.get('/test-webhook', (req, res) => {
    res.json({ 
        message: 'Webhook Fapshi opérationnel',
        instructions: 'Configurez https://votre-backend.com/api/fapshi/webhook dans le dashboard Fapshi'
    });
});

module.exports = router;

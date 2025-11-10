const supabase = require('../config/supabase');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Token manquant' });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ message: 'Token invalide' });
        }

        req.user = user;
        next();

    } catch (error) {
        res.status(401).json({ message: 'Erreur authentification' });
    }
};

module.exports = auth;

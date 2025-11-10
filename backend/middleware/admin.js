// Middleware pour vérifier l'accès admin
// Pour l'instant, pas d'authentification admin requise comme spécifié
const admin = (req, res, next) => {
  // Ici tu peux ajouter une vérification si nécessaire plus tard
  next();
};

module.exports = admin;

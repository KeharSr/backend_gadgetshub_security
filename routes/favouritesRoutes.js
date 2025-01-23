const router = require('express').Router();
const favoritesController = require('../controllers/favouritesControllers');
const { authGuard } = require('../middleware/authGuard');
const { logRequest } = require('../middleware/activityLogs');


router.post('/add_favourite', authGuard,logRequest, favoritesController.addFavorite);
router.delete('/remove_favourite/:id',logRequest, authGuard, favoritesController.removeFavorite);
router.get('/get_favourite', authGuard, favoritesController.getFavorites);

module.exports = router;

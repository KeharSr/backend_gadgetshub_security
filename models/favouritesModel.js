const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true
    }
}); 

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;

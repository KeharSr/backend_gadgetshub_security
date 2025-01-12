const mongoose = require('mongoose')


const Database = () => {
    mongoose.connect(process.env.MONGODB_LOCAL).then(() => {
        console.log('Database Connected!');
    });
}


module.exports = Database;
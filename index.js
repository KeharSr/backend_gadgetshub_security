const express = require('express');
const mongoose = require('mongoose');
const Database = require('./database/database');
const dotenv = require('dotenv');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const axios = require('axios'); // Added Axios import
const fs = require('fs');
const https = require('https');
const path = require('path');

dotenv.config();
const app = express();

// CORS Configuration
const corsOptions = {
    origin: 'https://localhost:5000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(fileUpload());
app.use(express.static('./public'));

// Database Connection
Database();

// Routes
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/product', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/order', require('./routes/orderRoutes'));
app.use('/api/review', require('./routes/review&ratingRoutes'));
app.use('/api/favourite', require('./routes/favouritesRoutes'));
app.use('/api/khalti', require('./routes/paymentRoutes'));

// Test SSL Endpoint
app.get('/gadgetshub', (req, res) => {
    res.send('Hello gadgetshub from SSL server');
});

// Khalti Payment Route
app.post('/khalti-api', async (req, res) => {
    try {
        const payload = req.body;
        const khaltiResponse = await axios.post(
            'https://a.khalti.com/api/v2/epayment/initiate/',
            payload,
            {
                headers: {
                    Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
                },
            }
        );
        res.send({
            success: true,
            data: khaltiResponse.data,
        });
    } catch (error) {
        console.error('Error initiating Khalti payment:', error.message);
        res.status(500).send({
            success: false,
            message: 'Error in initiating',
            error: error.message,
        });
    }
});

// Load SSL Certificates
const key = fs.readFileSync('./localhost.key');
const cert = fs.readFileSync('./localhost.crt');

// Create HTTPS Server
const server = https.createServer({ key, cert }, app);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '127.0.0.1', () => {
    console.log(`Server is running on https://localhost:${PORT}`);
});

module.exports = app;

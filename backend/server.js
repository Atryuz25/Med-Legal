const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const medicalRoutes = require('./routes/medical');

const app = express();

// Logging
console.log('Starting server...');
console.log('Environment variables:', {
    MONGODB_URI: process.env.MONGODB_URI || 'Not set',
    PORT: process.env.PORT || 'Not set'
});

// Middleware
app.use(cors({
    origin: '*',  // Allow all origins for testing
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medical', medicalRoutes);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve overview.html as default BEFORE express.static
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../html', 'overview.html'));
});

// Serve static files (general and medical-specific)
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/medical', express.static(path.join(__dirname, '../html/medical')));
app.use('/css/medical', express.static(path.join(__dirname, '../css/medical')));
app.use('/js/medical', express.static(path.join(__dirname, '../js/medical')));
app.use(express.static(path.join(__dirname, '../html'))); // Keep this last

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    retryWrites: true,
    w: 'majority',
    autoIndex: true
})
.then(() => {
    console.log('Successfully connected to MongoDB');
    mongoose.connection.on('error', err => console.error('MongoDB connection error:', err));
    mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));

    // Let Render assign the port
    const PORT = process.env.PORT || 10000;
    
    // Export the app for testing purposes
    module.exports = app;
    
    // Only start the server if this file is run directly
    if (require.main === module) {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
        }).on('error', (err) => {
            console.error('Server failed to start:', err);
            process.exit(1);
        });
    }
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
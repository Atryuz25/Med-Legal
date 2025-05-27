const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to verify admin
const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, async () => {
        try {
            const user = await User.findById(req.user.userId);
            if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
                return res.status(403).json({ message: 'Admin access required' });
            }
            next();
        } catch (error) {
            return res.status(500).json({ message: 'Server error' });
        }
    });
};

// Middleware to verify superadmin
const verifySuperAdmin = (req, res, next) => {
    verifyToken(req, res, async () => {
        try {
            const user = await User.findById(req.user.userId);
            if (!user || !user.isSuperAdmin) {
                return res.status(403).json({ message: 'Superadmin access required' });
            }
            next();
        } catch (error) {
            return res.status(500).json({ message: 'Server error' });
        }
    });
};

// Middleware to verify medical staff
const verifyMedical = (req, res, next) => {
    verifyToken(req, res, async () => {
        try {
            const user = await User.findById(req.user.userId);
            if (!user || user.userType !== 'medical') {
                return res.status(403).json({ message: 'Medical staff access required' });
            }
            next();
        } catch (error) {
            return res.status(500).json({ message: 'Server error' });
        }
    });
};

// Middleware to verify legal professional
const verifyLegal = (req, res, next) => {
    verifyToken(req, res, async () => {
        try {
            const user = await User.findById(req.user.userId);
            if (!user || user.userType !== 'legal') {
                return res.status(403).json({ message: 'Legal professional access required' });
            }
            next();
        } catch (error) {
            return res.status(500).json({ message: 'Server error' });
        }
    });
};

module.exports = {
    verifyToken,
    verifyAdmin,
    verifySuperAdmin,
    verifyMedical,
    verifyLegal
};
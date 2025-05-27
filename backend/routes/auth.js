const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyToken, verifyAdmin, verifySuperAdmin } = require('../middleware/auth');

// Profile route
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            userType: user.userType,
            isApproved: user.approved,
            approvalStatus: user.approvalStatus,
            isSuperAdmin: user.isSuperAdmin,
            specialization: user.specialization,
            hospitalName: user.hospitalName,
            department: user.department,
            experience: user.experience,
            qualifications: user.qualifications,
            stats: {
                recordsUploaded: 12, // placeholder
                consentsApproved: 5, // placeholder
            },
            lastLogin: new Date()
        };

        res.json(userData);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile route
router.put('/update-profile', verifyToken, async (req, res) => {
    try {
        const { name, email, phone, hospitalName, password } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (hospitalName) user.hospitalName = hospitalName;

        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            userType: user.userType,
            hospitalName: user.hospitalName
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        
        // Support both formats: {username, password} and {userType, id, password}
        let username = req.body.username;
        let userType = req.body.userType;
        const password = req.body.password;
        
        // If using the old format with id instead of username
        if (!username && req.body.id) {
            username = req.body.id;
        }
        
        if (!username || !password) {
            return res.status(400).json({ 
                message: 'Please provide username and password'
            });
        }
        
        // Build query based on available parameters
        let query = {};
        if (userType) {
            query = { 
                userType,
                $or: [{ id: username }, { email: username }]
            };
        } else {
            query = {
                $or: [{ id: username }, { email: username }]
            };
        }
        
        console.log('User query:', query);
        const user = await User.findOne(query);
        
        if (!user) {
            console.log('User not found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        console.log('User found:', user.id, user.userType);
        
        // Special case for superadmin
        if (user.id === 'superadmin' && password === 'superadmin123') {
            console.log('Superadmin login granted');
            
            const token = jwt.sign(
                { userId: user._id, userType: user.userType, isSuperAdmin: true },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            return res.json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    userType: user.userType,
                    isSuperAdmin: true
                },
                message: 'Login successful'
            });
        }
        
        // For regular users, compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch');
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Skip approval check for testing
        /*
        if (user.approvalStatus !== 'approved') {
            return res.status(403).json({ 
                message: 'Account not approved',
                approvalStatus: user.approvalStatus
            });
        }
        */
        
        console.log('Login successful');
        const token = jwt.sign(
            { userId: user._id, userType: user.userType, isSuperAdmin: user.isSuperAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                isSuperAdmin: user.isSuperAdmin
            },
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Register route
router.post('/register', async (req, res) => {
    try {
        const { userType, id, password, name, email, phone } = req.body;
        
        if (!userType || !id || !password || !name || !email || !phone) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        const existingUser = await User.findOne({
            $or: [
                { userType, id },
                { email }
            ]
        });
        
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already in use' });
            } else {
                return res.status(400).json({ message: 'ID already in use for this user type' });
            }
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            userType,
            id,
            password: hashedPassword,
            name,
            email,
            phone,
            approved: true,  // Auto-approve for testing
            approvalStatus: 'approved'  // Auto-approve for testing
        });
        
        await newUser.save();
        
        res.status(201).json({
            message: 'Registration successful.',
            user: {
                id: newUser._id,
                userType: newUser.userType,
                name: newUser.name,
                email: newUser.email,
                approvalStatus: newUser.approvalStatus
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fix superadmin status route
router.post('/fix-superadmin', async (req, res) => {
    try {
        const superAdmin = await User.findOne({ id: 'superadmin' });

        if (!superAdmin) {
            return res.status(404).json({ message: 'Superadmin user not found' });
        }

        superAdmin.isSuperAdmin = true;
        superAdmin.approved = true;
        superAdmin.approvalStatus = 'approved';
        await superAdmin.save();

        res.json({
            message: 'Superadmin status fixed successfully',
            user: {
                id: superAdmin.id,
                name: superAdmin.name,
                isSuperAdmin: superAdmin.isSuperAdmin
            }
        });
    } catch (error) {
        console.error('Error fixing superadmin:', error);
        res.status(500).json({ message: 'Error fixing superadmin status' });
    }
});

// Admin routes
router.get('/admin/users', verifySuperAdmin, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

router.post('/admin/approve/:userId', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.approved = true;
        user.approvalStatus = 'approved';
        user.approvedBy = req.user.userId;
        user.approvalDate = new Date();
        await user.save();

        res.json({ message: 'User approved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error approving user' });
    }
});

router.post('/admin/reject/:userId', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.approved = false;
        user.approvalStatus = 'rejected';
        user.approvedBy = req.user.userId;
        user.approvalDate = new Date();
        await user.save();

        res.json({ message: 'User rejected successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting user' });
    }
});

router.get('/admin/dashboard', verifySuperAdmin, async (req, res) => {
    try {
        const pendingUsers = await User.find({ approvalStatus: 'pending' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json({ pendingUsers });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending users' });
    }
});

module.exports = router;
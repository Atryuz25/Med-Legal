const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const SUPERADMIN_EMAIL = 'superadmin@medlegal.com';
const SUPERADMIN_PASSWORD = 'superadmin123';

async function seedSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/medico_legal', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Check if superadmin already exists and update it
        const existingSuperAdmin = await User.findOne({ isSuperAdmin: true });
        if (existingSuperAdmin) {
            console.log('Superadmin already exists. Updating password and ensuring superadmin flag is set...');
            
            // Update the password directly in the database to bypass any hooks
            const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
            
            await mongoose.connection.collection('users').updateOne(
                { _id: existingSuperAdmin._id },
                { 
                    $set: { 
                        password: hashedPassword,
                        isSuperAdmin: true,
                        approved: true,
                        approvalStatus: 'approved'
                    } 
                }
            );
            
            console.log('Superadmin password updated successfully!');
            console.log('Login credentials:');
            console.log('User Type: admin');
            console.log('ID: superadmin');
            console.log('Password:', SUPERADMIN_PASSWORD);
            return;
        }

        // Create superadmin
        const superAdmin = new User({
            userType: 'admin',
            id: 'superadmin',
            password: await bcrypt.hash(SUPERADMIN_PASSWORD, 10),
            name: 'Super Administrator',
            email: SUPERADMIN_EMAIL,
            phone: '1234567890',
            isSuperAdmin: true,
            approved: true,
            approvalStatus: 'approved'
        });

        await superAdmin.save();
        console.log('Superadmin created successfully!');
        console.log('Login credentials:');
        console.log('Email:', SUPERADMIN_EMAIL);
        console.log('Password:', SUPERADMIN_PASSWORD);
    } catch (error) {
        console.error('Error creating superadmin:', error);
    } finally {
        mongoose.connection.close();
    }
}

seedSuperAdmin();

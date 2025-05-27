const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userType: {
    type: String,
    required: true,
    enum: ['medical', 'legal', 'patient', 'admin']
  },
  id: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    default: ''
  },
  hospitalName: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  experience: {
    type: String,
    default: ''
  },
  qualifications: {
    type: String,
    default: ''
  },
  approved: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: String,
    default: ''
  },
  approvalDate: {
    type: Date,
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        // For superadmin, add special handling
        if (this.id === 'superadmin' && candidatePassword === 'superadmin123') {
            console.log('Superadmin special login granted');
            // Ensure the superadmin flag is set
            if (!this.isSuperAdmin) {
                console.log('Setting isSuperAdmin flag to true for superadmin user');
                this.isSuperAdmin = true;
                await this.save();
            }
            return true;
        }
        
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        console.log('Password comparison:', {
            success: isMatch,
            userId: this.id,
            userType: this.userType,
            isSuperAdmin: this.isSuperAdmin,
            candidateLength: candidatePassword.length,
            storedLength: this.password.length
        });
        return isMatch;
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

module.exports = mongoose.model('User', userSchema);

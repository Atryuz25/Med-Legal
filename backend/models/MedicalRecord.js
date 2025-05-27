const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    patientId: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female', 'other']
    },
    contactNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    diagnosis: {
        type: String,
        required: true
    },
    treatmentProvided: {
        type: String,
        required: true
    },
    admissionDate: {
        type: Date,
        default: null
    },
    dischargeDate: {
        type: Date,
        default: null
    },
    caseNumber: {
        type: String,
        required: true
    },
    caseType: {
        type: String,
        required: true,
        enum: ['assault', 'accident', 'other']
    },
    caseDescription: {
        type: String,
        required: true
    },
    incidentDate: {
        type: Date,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    sharedWith: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        },
        accessLevel: {
            type: String,
            enum: ['view', 'edit'],
            default: 'view'
        }
    }],
    status: {
        type: String,
        enum: ['draft', 'submitted', 'approved', 'rejected'],
        default: 'submitted'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
medicalRecordSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
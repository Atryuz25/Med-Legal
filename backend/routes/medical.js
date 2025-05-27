const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const { verifyToken, verifyMedical } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/medical');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with original extension
        const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});

// File filter to only allow PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload medical record with PDF
router.post('/upload', verifyMedical, upload.single('file'), async (req, res) => {
    try {
        // User is already verified as medical staff by middleware

        // Validate required fields
        const requiredFields = [
            'patientName', 'patientId', 'dateOfBirth', 'gender', 
            'contactNumber', 'diagnosis', 'treatmentProvided', 
            'caseNumber', 'caseType', 'caseDescription', 'incidentDate'
        ];
        
        for (const field of requiredFields) {
            if (!req.body[field]) {
                // Delete uploaded file if exists
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ 
                    message: `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`,
                    field: field
                });
            }
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'PDF file is required', field: 'file' });
        }

        // Create new medical record
        const newRecord = new MedicalRecord({
            uploadedBy: req.user.userId,
            patientName: req.body.patientName,
            patientId: req.body.patientId,
            dateOfBirth: new Date(req.body.dateOfBirth),
            gender: req.body.gender,
            contactNumber: req.body.contactNumber,
            email: req.body.email || '',
            address: req.body.address || '',
            diagnosis: req.body.diagnosis,
            treatmentProvided: req.body.treatmentProvided,
            admissionDate: req.body.admissionDate ? new Date(req.body.admissionDate) : null,
            dischargeDate: req.body.dischargeDate ? new Date(req.body.dischargeDate) : null,
            caseNumber: req.body.caseNumber,
            caseType: req.body.caseType,
            caseDescription: req.body.caseDescription,
            incidentDate: new Date(req.body.incidentDate),
            filePath: req.file.path,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype
        });

        await newRecord.save();

        res.status(201).json({
            message: 'Medical record uploaded successfully',
            recordId: newRecord._id
        });
    } catch (error) {
        console.error('Error uploading medical record:', error);
        
        // Delete uploaded file if exists
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            message: 'Failed to upload medical record',
            error: error.message
        });
    }
});

// Get all medical records for the logged-in medical staff
router.get('/records', verifyMedical, async (req, res) => {
    try {
        // User is already verified as medical staff by middleware

        // Get records uploaded by this user
        const records = await MedicalRecord.find({ uploadedBy: req.user.userId })
            .sort({ createdAt: -1 });

        res.json(records);
    } catch (error) {
        console.error('Error fetching medical records:', error);
        res.status(500).json({ message: 'Failed to fetch medical records' });
    }
});

// Get a specific medical record by ID
router.get('/records/:id', verifyMedical, async (req, res) => {
    try {
        // User is already verified as medical staff by middleware

        // Get the record
        const record = await MedicalRecord.findById(req.params.id);
        
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Check if user is authorized to view this record
        if (record.uploadedBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You are not authorized to view this record' });
        }

        res.json(record);
    } catch (error) {
        console.error('Error fetching medical record:', error);
        res.status(500).json({ message: 'Failed to fetch medical record' });
    }
});

// Download a medical record PDF
router.get('/records/:id/download', verifyMedical, async (req, res) => {
    try {
        // User is already verified as medical staff by middleware

        // Get the record
        const record = await MedicalRecord.findById(req.params.id);
        
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Check if user is authorized to download this record
        if (record.uploadedBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You are not authorized to download this record' });
        }

        // Check if file exists
        if (!fs.existsSync(record.filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Set headers for file download
        res.setHeader('Content-Type', record.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${record.fileName}"`);

        // Stream the file
        const fileStream = fs.createReadStream(record.filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading medical record:', error);
        res.status(500).json({ message: 'Failed to download medical record' });
    }
});

// Update a medical record
router.put('/records/:id', verifyMedical, async (req, res) => {
    try {
        // User is already verified as medical staff by middleware

        // Get the record
        const record = await MedicalRecord.findById(req.params.id);
        
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Check if user is authorized to update this record
        if (record.uploadedBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You are not authorized to update this record' });
        }

        // Update fields
        const updateFields = [
            'patientName', 'patientId', 'dateOfBirth', 'gender', 
            'contactNumber', 'email', 'address', 'diagnosis', 
            'treatmentProvided', 'admissionDate', 'dischargeDate', 
            'caseNumber', 'caseType', 'caseDescription', 'incidentDate'
        ];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'dateOfBirth' || field === 'admissionDate' || 
                    field === 'dischargeDate' || field === 'incidentDate') {
                    record[field] = req.body[field] ? new Date(req.body[field]) : null;
                } else {
                    record[field] = req.body[field];
                }
            }
        });

        // Save updated record
        await record.save();

        res.json({
            message: 'Medical record updated successfully',
            record: record
        });
    } catch (error) {
        console.error('Error updating medical record:', error);
        res.status(500).json({ message: 'Failed to update medical record' });
    }
});

// Delete a medical record
router.delete('/records/:id', verifyMedical, async (req, res) => {
    try {
        // User is already verified as medical staff by middleware

        // Get the record
        const record = await MedicalRecord.findById(req.params.id);
        
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Check if user is authorized to delete this record
        if (record.uploadedBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this record' });
        }

        // Delete the file if it exists
        if (record.filePath && fs.existsSync(record.filePath)) {
            fs.unlinkSync(record.filePath);
        }

        // Delete the record from database
        await MedicalRecord.findByIdAndDelete(req.params.id);

        res.json({ message: 'Medical record deleted successfully' });
    } catch (error) {
        console.error('Error deleting medical record:', error);
        res.status(500).json({ message: 'Failed to delete medical record' });
    }
});

module.exports = router;
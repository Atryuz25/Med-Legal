document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    
    // Get form elements
    const uploadForm = document.getElementById('upload-form');
    const patientNameInput = document.getElementById('patientName');
    const patientIdInput = document.getElementById('patientId');
    const dateOfBirthInput = document.getElementById('dateOfBirth');
    const genderSelect = document.getElementById('gender');
    const contactNumberInput = document.getElementById('contactNumber');
    const emailInput = document.getElementById('email');
    const addressTextarea = document.getElementById('address');
    const diagnosisInput = document.getElementById('diagnosis');
    const treatmentProvidedInput = document.getElementById('treatmentProvided');
    const admissionDateInput = document.getElementById('admissionDate');
    const dischargeDateInput = document.getElementById('dischargeDate');
    const caseNumberInput = document.getElementById('caseNumber');
    const caseTypeSelect = document.getElementById('caseType');
    const caseDescriptionTextarea = document.getElementById('caseDescription');
    const incidentDateInput = document.getElementById('incidentDate');
    const fileInput = document.getElementById('file');
    
    // Handle file drop area
    const dropArea = document.querySelector('.drop-area');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        
        // Trigger change event
        const event = new Event('change');
        fileInput.dispatchEvent(event);
    }
    
    // Handle file selection
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('File size exceeds 10MB limit');
                this.value = '';
                dropArea.querySelector('p').innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Drag & Drop PDF or Click';
            } else {
                dropArea.querySelector('p').innerHTML = `<i class="fas fa-file-pdf"></i> ${file.name}`;
                
                // Read file content as data URL for storage
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Store file data in a global variable for later use
                    window.recordFileData = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        } else {
            dropArea.querySelector('p').innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Drag & Drop PDF or Click';
        }
    });
    
    // Handle form submission
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        // Validate form
        if (!uploadForm.checkValidity()) {
            uploadForm.reportValidity();
            return;
        }
        
        // Get form data
        const patientName = patientNameInput.value;
        const patientId = patientIdInput.value;
        const dateOfBirth = dateOfBirthInput.value;
        const gender = genderSelect.value;
        const contactNumber = contactNumberInput.value;
        const email = emailInput.value;
        const address = addressTextarea.value;
        const diagnosis = diagnosisInput.value;
        const treatmentProvided = treatmentProvidedInput.value;
        const admissionDate = admissionDateInput.value;
        const dischargeDate = dischargeDateInput.value;
        const caseNumber = caseNumberInput.value;
        const caseType = caseTypeSelect.value;
        const caseDescription = caseDescriptionTextarea.value;
        const incidentDate = incidentDateInput.value;
        const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : '';
        const fileData = window.recordFileData || '';
        
        // Create record object
        const record = {
            id: `REC-${Date.now()}`,
            patientName: patientName,
            patientId: patientId,
            dateOfBirth: dateOfBirth,
            gender: gender,
            contactNumber: contactNumber,
            email: email,
            address: address,
            diagnosis: diagnosis,
            treatmentProvided: treatmentProvided,
            admissionDate: admissionDate,
            dischargeDate: dischargeDate,
            caseNumber: caseNumber,
            caseType: caseType,
            caseDescription: caseDescription,
            incidentDate: incidentDate,
            fileName: fileName,
            fileData: fileData,
            recordType: caseType,
            recordDate: incidentDate,
            content: caseDescription,
            uploadedBy: localStorage.getItem('userName') || 'Medical Staff',
            hospital: localStorage.getItem('userHospital') || 'General Hospital',
            doctor: localStorage.getItem('userName') || 'Medical Staff',
            uploadDate: new Date().toISOString()
        };
        
        // Show loading state
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Store record in localStorage for demo purposes
            // In a real app, this would be sent to a server
            const existingRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
            existingRecords.push(record);
            localStorage.setItem('medicalRecords', JSON.stringify(existingRecords));
            
            // Create notifications
            createUploadNotification(record);
            createPatientNotification(record);
            
            // Clear form
            uploadForm.reset();
            dropArea.querySelector('p').innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Drag & Drop PDF or Click';
            window.recordFileData = null;
            
            // Show success message
            showNotification('success', 'Record uploaded successfully!');
            
            // Show alert for confirmation
            alert('Medical record for ' + patientName + ' has been uploaded successfully!');
            
        } catch (error) {
            console.error('Error uploading record:', error);
            showNotification('error', 'Record has been uploaded successfully.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
    
    // Handle save draft button
    const draftBtn = document.querySelector('.btn.draft');
    if (draftBtn) {
        draftBtn.addEventListener('click', function() {
            showNotification('success', 'Draft saved successfully!');
        });
    }
});

function showNotification(type, message) {
    // Get or create notification container
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.bottom = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '1000';
        document.body.appendChild(notificationContainer);
    }
    
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') {
        icon = 'fa-check-circle';
    } else if (type === 'error') {
        icon = 'fa-exclamation-circle';
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icon}"></i>
            <p>${message}</p>
        </div>
        <button class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Style the notification
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.marginBottom = '10px';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.justifyContent = 'space-between';
    notification.style.gap = '15px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.animation = 'slideIn 0.3s ease-out';
    notification.style.maxWidth = '400px';
    
    if (type === 'success') {
        notification.style.background = 'rgba(16, 185, 129, 0.95)';
        notification.style.borderLeft = '4px solid #059669';
        notification.style.color = 'white';
    } else if (type === 'error') {
        notification.style.background = 'rgba(18, 232, 96, 0.95)';
        notification.style.borderLeft = '4px solidrgb(83, 249, 6)';
        notification.style.color = 'white';
    } else {
        notification.style.background = 'rgba(59, 130, 246, 0.95)';
        notification.style.borderLeft = '4px solid #2563eb';
        notification.style.color = 'white';
    }
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Add event listener to close button
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', function() {
        notification.remove();
    });
    
    // Auto-remove notification after 8 seconds
    setTimeout(() => {
        if (notificationContainer.contains(notification)) {
            notification.remove();
        }
    }, 8000);
}

function createUploadNotification(record) {
    // Create a notification for the medical staff
    const notifications = JSON.parse(localStorage.getItem('medicalNotifications') || '[]');
    
    const notification = {
        id: `NOTIF-${Date.now()}`,
        type: 'system',
        title: 'Record Uploaded',
        message: `You uploaded a ${record.caseType} record for patient ${record.patientName}`,
        timestamp: new Date().toISOString(),
        read: false,
        recordId: record.id
    };
    
    notifications.push(notification);
    localStorage.setItem('medicalNotifications', JSON.stringify(notifications));
    
    // Update dashboard stats if needed
    updateDashboardStats();
}

function createPatientNotification(record) {
    // Create a notification for the patient
    const patientNotifications = JSON.parse(localStorage.getItem('patientNotifications') || '[]');
    
    const notification = {
        id: `NOTIF-${Date.now() + 1}`,
        type: 'record',
        title: 'New Medical Record Added',
        message: `A new ${record.caseType} record has been added to your profile by Dr. ${record.doctor}`,
        timestamp: new Date().toISOString(),
        read: false,
        recordId: record.id,
        patientName: record.patientName
    };
    
    patientNotifications.push(notification);
    localStorage.setItem('patientNotifications', JSON.stringify(patientNotifications));
}

function updateDashboardStats() {
    // This function will be called from the dashboard page
    // It's included here to ensure it's available when needed
    
    // If we're on a different page, we don't need to update the dashboard
    if (!window.location.href.includes('medical-dashboard.html')) {
        return;
    }
    
    // Update records count
    const medicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    const recordsCountElement = document.getElementById('records-uploaded-count');
    if (recordsCountElement) {
        recordsCountElement.textContent = medicalRecords.length;
    }
    
    // Update notifications count
    const notifications = JSON.parse(localStorage.getItem('medicalNotifications') || '[]');
    const unreadNotifications = notifications.filter(notification => !notification.read);
    const notificationsCountElement = document.getElementById('notifications-count');
    if (notificationsCountElement) {
        notificationsCountElement.textContent = unreadNotifications.length;
    }
    
    // Update notifications badge in sidebar
    const notificationsBadge = document.getElementById('notifications-badge');
    if (notificationsBadge) {
        notificationsBadge.textContent = unreadNotifications.length;
        // Hide badge if no unread notifications
        if (unreadNotifications.length === 0) {
            notificationsBadge.style.display = 'none';
        } else {
            notificationsBadge.style.display = 'inline';
        }
    }
}
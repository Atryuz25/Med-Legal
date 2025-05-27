document.addEventListener('DOMContentLoaded', function() {
    const accessRequestForm = document.getElementById('access-request-form');
    const draftBtn = document.querySelector('.draft-btn');
    const isCourtOrderCheckbox = document.getElementById('is-court-order');
    const courtOrderSection = document.getElementById('court-order-section');
    const courtOrderDocument = document.getElementById('court-order-document');
    const patientConsentStep = document.getElementById('patient-consent-step');
    const approvalFlowText = document.getElementById('approval-flow-text');
    
    // File upload handling
    const advocateLicense = document.getElementById('advocate-license');
    const advocateLicenseName = document.getElementById('advocate-license-name');
    const purposeDocument = document.getElementById('purpose-document');
    const purposeDocumentName = document.getElementById('purpose-document-name');
    const courtOrderDocumentName = document.getElementById('court-order-document-name');
    
    // Handle file selection for advocate license
    advocateLicense.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showNotification('File size exceeds 5MB limit', 'error');
                this.value = '';
                advocateLicenseName.textContent = 'No file selected';
            } else if (file.type !== 'application/pdf') {
                showNotification('Only PDF files are allowed', 'error');
                this.value = '';
                advocateLicenseName.textContent = 'No file selected';
            } else {
                advocateLicenseName.textContent = file.name;
                
                // Read file content as data URL for storage
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Store file data in a global variable for later use
                    window.advocateLicenseData = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        } else {
            advocateLicenseName.textContent = 'No file selected';
        }
    });
    
    // Handle file selection for purpose document
    purposeDocument.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showNotification('File size exceeds 5MB limit', 'error');
                this.value = '';
                purposeDocumentName.textContent = 'No file selected';
            } else if (file.type !== 'application/pdf') {
                showNotification('Only PDF files are allowed', 'error');
                this.value = '';
                purposeDocumentName.textContent = 'No file selected';
            } else {
                purposeDocumentName.textContent = file.name;
                
                // Read file content as data URL for storage
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Store file data in a global variable for later use
                    window.purposeDocumentData = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        } else {
            purposeDocumentName.textContent = 'No file selected';
        }
    });
    
    // Handle file selection for court order document
    courtOrderDocument.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showNotification('File size exceeds 5MB limit', 'error');
                this.value = '';
                courtOrderDocumentName.textContent = 'No file selected';
            } else if (file.type !== 'application/pdf') {
                showNotification('Only PDF files are allowed', 'error');
                this.value = '';
                courtOrderDocumentName.textContent = 'No file selected';
            } else {
                courtOrderDocumentName.textContent = file.name;
                
                // Read file content as data URL for storage
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Store file data in a global variable for later use
                    window.courtOrderDocumentData = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        } else {
            courtOrderDocumentName.textContent = 'No file selected';
        }
    });
    
    // Toggle court order section and update approval flow
    isCourtOrderCheckbox.addEventListener('change', function() {
        if (this.checked) {
            courtOrderSection.style.display = 'block';
            courtOrderDocument.required = true;
            patientConsentStep.style.display = 'none';
            approvalFlowText.textContent = 'Since this is a court order request, only medical staff approval is required.';
        } else {
            courtOrderSection.style.display = 'none';
            courtOrderDocument.required = false;
            patientConsentStep.style.display = 'block';
            approvalFlowText.textContent = 'Both patient consent and medical staff approval are required for this request.';
        }
    });
    
    // Load draft if exists
    const savedDraft = localStorage.getItem('legalRequestDraft');
    if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        
        // Fill form fields with saved data
        Object.keys(draftData).forEach(key => {
            const input = accessRequestForm.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = draftData[key];
                    // Trigger change event for court order checkbox
                    if (key === 'isCourtOrder') {
                        const event = new Event('change');
                        input.dispatchEvent(event);
                    }
                } else if (input.type !== 'file') { // Skip file inputs
                    input.value = draftData[key];
                }
            }
        });
        
        // Handle file names if they were saved
        if (draftData.advocateLicenseName) {
            advocateLicenseName.textContent = draftData.advocateLicenseName;
        }
        if (draftData.purposeDocumentName) {
            purposeDocumentName.textContent = draftData.purposeDocumentName;
        }
        if (draftData.courtOrderDocumentName) {
            courtOrderDocumentName.textContent = draftData.courtOrderDocumentName;
        }
        
        showNotification('Draft loaded', 'info');
    }
    
    // Save draft functionality
    draftBtn.addEventListener('click', function() {
        const formData = new FormData(accessRequestForm);
        const draftData = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            if (key === 'consentConfirmation' || key === 'isCourtOrder') {
                draftData[key] = true;
            } else if (key !== 'advocateLicense' && key !== 'purposeDocument' && key !== 'courtOrderDocument') {
                // Skip file inputs but save everything else
                draftData[key] = value;
            }
        }
        
        // Save file names if files were selected
        if (advocateLicense.files.length > 0) {
            draftData.advocateLicenseName = advocateLicense.files[0].name;
        }
        if (purposeDocument.files.length > 0) {
            draftData.purposeDocumentName = purposeDocument.files[0].name;
        }
        if (courtOrderDocument.files.length > 0) {
            draftData.courtOrderDocumentName = courtOrderDocument.files[0].name;
        }
        
        // Store form data in localStorage
        localStorage.setItem('legalRequestDraft', JSON.stringify(draftData));
        
        // Show success message
        showNotification('Draft saved successfully!', 'success');
    });
    
    // Handle form submission
    accessRequestForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        // Get form data
        const patientName = document.getElementById('patient-name').value;
        const patientPhone = document.getElementById('patient-phone').value;
        const hospital = document.getElementById('hospital').value;
        const caseId = document.getElementById('case-id').value;
        const caseType = document.getElementById('case-type').value;
        const reason = document.getElementById('reason').value;
        const isCourtOrder = isCourtOrderCheckbox.checked;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const urgency = document.getElementById('urgency').value;
        const additionalInfo = document.getElementById('additional-info').value;
        
        // Basic validation
        if (!patientName || !patientPhone || !hospital || !caseId || !caseType || !reason) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Validate file uploads
        if (advocateLicense.files.length === 0) {
            showNotification('Please upload your advocate license', 'error');
            return;
        }
        
        if (purposeDocument.files.length === 0) {
            showNotification('Please upload the purpose of request document', 'error');
            return;
        }
        
        if (isCourtOrder && courtOrderDocument.files.length === 0) {
            showNotification('Please upload the court order document', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = accessRequestForm.querySelector('.submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        // Create request object
        const requestData = {
            id: `REQ-${Date.now()}`,
            patientName: patientName,
            patientPhone: patientPhone,
            hospital: hospital,
            caseId: caseId,
            caseType: caseType,
            reason: reason,
            isCourtOrder: isCourtOrder,
            startDate: startDate,
            endDate: endDate,
            urgency: urgency,
            additionalInfo: additionalInfo,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            legalProfessionalName: localStorage.getItem('userName') || 'Legal Professional',
            legalProfessionalEmail: localStorage.getItem('userEmail') || '',
            status: 'pending',
            requiresPatientConsent: !isCourtOrder,
            requiresMedicalApproval: true
        };
        
        // Add file names
        if (advocateLicense.files.length > 0) {
            requestData.advocateLicenseName = advocateLicense.files[0].name;
        }
        if (purposeDocument.files.length > 0) {
            requestData.purposeDocumentName = purposeDocument.files[0].name;
        }
        if (courtOrderDocument.files.length > 0) {
            requestData.courtOrderDocumentName = courtOrderDocument.files[0].name;
        }
        
        // Store request in localStorage
        try {
            // Get existing requests
            const existingRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
            
            // Add new request
            existingRequests.push(requestData);
            
            // Save back to localStorage
            localStorage.setItem('accessRequests', JSON.stringify(existingRequests));
            
            // Add notification for medical staff
            const notifications = JSON.parse(localStorage.getItem('medicalNotifications') || '[]');
            notifications.push({
                id: `NOTIF-${Date.now()}`,
                type: 'access_request',
                title: 'New Access Request',
                message: `Legal professional ${requestData.legalProfessionalName} has requested access to medical records for patient ${requestData.patientName}`,
                requestId: requestData.id,
                timestamp: requestData.timestamp,
                read: false,
                isCourtOrder: isCourtOrder
            });
            localStorage.setItem('medicalNotifications', JSON.stringify(notifications));
            
            // Add notification for patient if patient consent is required
            if (!isCourtOrder) {
                const patientNotifications = JSON.parse(localStorage.getItem('patientNotifications') || '[]');
                
                // Create a detailed notification for the patient
                patientNotifications.push({
                    id: `NOTIF-${Date.now() + 1}`,
                    type: 'access_request',
                    title: 'Consent Request',
                    message: `Legal professional ${requestData.legalProfessionalName} is requesting access to your medical records for case ${requestData.caseId}`,
                    details: {
                        legalProfessional: requestData.legalProfessionalName,
                        caseId: requestData.caseId,
                        caseType: requestData.caseType,
                        reason: requestData.reason,
                        hospital: requestData.hospital,
                        dateRange: startDate && endDate ? `${startDate} to ${endDate}` : "Not specified",
                        urgency: requestData.urgency || "Normal"
                    },
                    requestId: requestData.id,
                    timestamp: requestData.timestamp,
                    read: false,
                    patientName: requestData.patientName,
                    requiresAction: true
                });
                
                localStorage.setItem('patientNotifications', JSON.stringify(patientNotifications));
            }
            
            // Clear form and draft
            accessRequestForm.reset();
            localStorage.removeItem('legalRequestDraft');
            advocateLicenseName.textContent = 'No file selected';
            purposeDocumentName.textContent = 'No file selected';
            courtOrderDocumentName.textContent = 'No file selected';
            courtOrderSection.style.display = 'none';
            patientConsentStep.style.display = 'block';
            
            // Clear stored file data
            window.advocateLicenseData = null;
            window.purposeDocumentData = null;
            window.courtOrderDocumentData = null;
            
            // Show success message
            const successMessage = isCourtOrder ? 
                'Court order request submitted successfully! Medical staff will be notified.' : 
                'Request submitted successfully! Both the patient and medical staff have been notified for consent.';
            
            showNotification(successMessage, 'success');
            
            // Redirect to dashboard after a delay
            setTimeout(() => {
                window.location.href = 'legal-dashboard.html';
            }, 3000);
            
        } catch (error) {
            console.error('Error submitting request:', error);
            showNotification('Failed to submit request. Please try again.', 'error');
            
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
    
    // Helper function to show notifications
    function showNotification(message, type) {
        // Get or create notification container
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <p>${message}</p>
            </div>
            <button class="close-notification"><i class="fas fa-times"></i></button>
        `;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Add event listener to close button
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.addEventListener('click', function() {
            notification.remove();
        });
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (notificationContainer.contains(notification)) {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 500);
            }
        }, 8000);
    }
});
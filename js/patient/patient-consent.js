document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || userType !== 'patient') {
        window.location.href = '../index.html';
        return;
    }
    
    // Get current patient's name
    const patientName = localStorage.getItem('userName');
    
    // Load consents and access requests
    loadConsentsAndRequests(patientName);
    
    // Set up tab switching
    const consentTabs = document.querySelectorAll('.consent-tab');
    consentTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            consentTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.consent-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show the selected tab content
            const tabName = this.getAttribute('data-tab');
            document.getElementById(`${tabName}-consents`).classList.add('active');
        });
    });
    
    // Add to recent activities
    addActivity({
        id: `ACT-${Date.now()}`,
        type: 'consent',
        title: 'Consents Viewed',
        description: 'You viewed your consent management page',
        timestamp: new Date().toISOString(),
        patientName: patientName
    });
});

function loadConsentsAndRequests(patientName) {
    // Get existing consents
    const consents = JSON.parse(localStorage.getItem('patientConsents') || '[]');
    
    // Get access requests that need patient consent
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    const pendingRequests = accessRequests.filter(request => 
        request.patientName === patientName && 
        request.status === 'pending' && 
        request.requiresPatientConsent === true
    );
    
    // Convert pending requests to consent format
    const pendingConsents = pendingRequests.map(request => ({
        id: request.id,
        title: `Access Request for ${request.caseType} Case`,
        status: 'pending',
        requestedBy: request.legalProfessionalName,
        organization: request.legalProfessionalEmail ? request.legalProfessionalEmail.split('@')[1] : 'Legal Organization',
        purpose: request.reason,
        requestDate: request.timestamp,
        recordsIncluded: request.startDate && request.endDate ? 
            `Medical records from ${request.startDate} to ${request.endDate}` : 
            'All relevant medical records',
        caseId: request.caseId,
        caseType: request.caseType,
        hospital: request.hospital,
        urgency: request.urgency || 'Normal',
        additionalInfo: request.additionalInfo || 'No additional information provided'
    }));
    
    // Combine with existing consents
    const allConsents = [...consents];
    
    // Add pending requests that aren't already in consents
    pendingConsents.forEach(pending => {
        if (!allConsents.some(consent => consent.id === pending.id)) {
            allConsents.push(pending);
        }
    });
    
    // Filter consents by status
    const activeConsents = allConsents.filter(consent => consent.status === 'active');
    const pendingConsentRequests = allConsents.filter(consent => consent.status === 'pending');
    const expiredConsents = allConsents.filter(consent => consent.status === 'expired');
    
    // Load active consents
    loadConsentsByType('active', activeConsents);
    
    // Load pending consents
    loadConsentsByType('pending', pendingConsentRequests);
    
    // Load expired consents
    loadConsentsByType('expired', expiredConsents);
    
    // Update active consents count in localStorage
    localStorage.setItem('activeConsents', activeConsents.length.toString());
}

function loadConsentsByType(type, consents) {
    const consentList = document.getElementById(`${type}-consent-list`);
    const emptyState = document.getElementById(`${type}-empty-state`);
    
    if (consents.length > 0) {
        // Hide empty state
        emptyState.style.display = 'none';
        
        // Clear consent list
        consentList.innerHTML = '';
        
        // Add consents
        consents.forEach(consent => {
            const consentCard = createConsentCard(consent);
            consentList.appendChild(consentCard);
        });
    } else {
        // Show empty state
        emptyState.style.display = 'block';
        consentList.innerHTML = '';
    }
}

function createConsentCard(consent) {
    const consentCard = document.createElement('div');
    consentCard.className = 'consent-card';
    
    // Format dates
    let dateInfo = '';
    if (consent.status === 'active' || consent.status === 'expired') {
        const grantedDate = new Date(consent.grantedDate);
        const expiryDate = new Date(consent.expiryDate);
        
        const formattedGrantedDate = grantedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        dateInfo = `
            <p><strong>Granted:</strong> ${formattedGrantedDate}</p>
            <p><strong>Expires:</strong> ${formattedExpiryDate}</p>
        `;
    } else if (consent.status === 'pending') {
        const requestDate = new Date(consent.requestDate);
        
        const formattedRequestDate = requestDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        dateInfo = `
            <p><strong>Requested:</strong> ${formattedRequestDate}</p>
        `;
    }
    
    // Create actions based on status
    let actions = '';
    if (consent.status === 'active') {
        actions = `
            <button class="consent-btn view-btn" onclick="viewConsent('${consent.id}')">
                <i class="fas fa-eye"></i> View
            </button>
            <button class="consent-btn revoke-btn" onclick="revokeConsent('${consent.id}')">
                <i class="fas fa-times"></i> Revoke
            </button>
        `;
    } else if (consent.status === 'pending') {
        actions = `
            <button class="consent-btn view-btn" onclick="viewConsent('${consent.id}')">
                <i class="fas fa-eye"></i> View
            </button>
            <button class="consent-btn approve-btn" onclick="approveConsent('${consent.id}')">
                <i class="fas fa-check"></i> Approve
            </button>
            <button class="consent-btn reject-btn" onclick="rejectConsent('${consent.id}')">
                <i class="fas fa-times"></i> Reject
            </button>
        `;
    } else {
        actions = `
            <button class="consent-btn view-btn" onclick="viewConsent('${consent.id}')">
                <i class="fas fa-eye"></i> View
            </button>
        `;
    }
    
    // Add additional details for access requests
    let additionalDetails = '';
    if (consent.caseId) {
        additionalDetails = `
            <p><strong>Case ID:</strong> ${consent.caseId}</p>
            <p><strong>Case Type:</strong> ${consent.caseType}</p>
            <p><strong>Hospital:</strong> ${consent.hospital}</p>
            ${consent.urgency ? `<p><strong>Urgency:</strong> ${consent.urgency}</p>` : ''}
        `;
    }
    
    consentCard.innerHTML = `
        <div class="consent-header">
            <h3 class="consent-title">${consent.title}</h3>
        </div>
        <span class="consent-status ${consent.status}">${capitalizeFirstLetter(consent.status)}</span>
        <div class="consent-details">
            <p><strong>Requested by:</strong> ${consent.requestedBy}</p>
            <p><strong>Organization:</strong> ${consent.organization}</p>
            <p><strong>Purpose:</strong> ${consent.purpose}</p>
            ${dateInfo}
            <p><strong>Records:</strong> ${consent.recordsIncluded}</p>
            ${additionalDetails}
        </div>
        <div class="consent-actions">
            ${actions}
        </div>
    `;
    
    return consentCard;
}

function viewConsent(consentId) {
    // Get consents from localStorage
    const consents = JSON.parse(localStorage.getItem('patientConsents') || '[]');
    
    // Get access requests
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Find the consent or request
    let consent = consents.find(c => c.id === consentId);
    
    if (!consent) {
        // Check if it's an access request
        const request = accessRequests.find(r => r.id === consentId);
        if (request) {
            // Convert request to consent format for viewing
            consent = {
                id: request.id,
                title: `Access Request for ${request.caseType} Case`,
                status: request.status,
                requestedBy: request.legalProfessionalName,
                organization: request.legalProfessionalEmail ? request.legalProfessionalEmail.split('@')[1] : 'Legal Organization',
                purpose: request.reason,
                requestDate: request.timestamp,
                recordsIncluded: request.startDate && request.endDate ? 
                    `Medical records from ${request.startDate} to ${request.endDate}` : 
                    'All relevant medical records',
                caseId: request.caseId,
                caseType: request.caseType,
                hospital: request.hospital,
                urgency: request.urgency || 'Normal',
                additionalInfo: request.additionalInfo || 'No additional information provided'
            };
        }
    }
    
    if (!consent) {
        alert('Consent details not found');
        return;
    }
    
    // Format dates
    let dateInfo = '';
    if (consent.status === 'active' || consent.status === 'expired') {
        const grantedDate = new Date(consent.grantedDate);
        const expiryDate = new Date(consent.expiryDate);
        
        const formattedGrantedDate = grantedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        dateInfo = `
            <p><strong>Granted:</strong> ${formattedGrantedDate}</p>
            <p><strong>Expires:</strong> ${formattedExpiryDate}</p>
        `;
    } else if (consent.status === 'pending') {
        const requestDate = new Date(consent.requestDate);
        
        const formattedRequestDate = requestDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        dateInfo = `
            <p><strong>Requested:</strong> ${formattedRequestDate}</p>
        `;
    }
    
    // Create a modal to display the consent details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>${consent.title}</h2>
            <span class="consent-status ${consent.status}">${capitalizeFirstLetter(consent.status)}</span>
            <div class="consent-details">
                <p><strong>Requested by:</strong> ${consent.requestedBy}</p>
                <p><strong>Organization:</strong> ${consent.organization}</p>
                <p><strong>Purpose:</strong> ${consent.purpose}</p>
                ${dateInfo}
                <p><strong>Records:</strong> ${consent.recordsIncluded}</p>
                ${consent.caseId ? `<p><strong>Case ID:</strong> ${consent.caseId}</p>` : ''}
                ${consent.caseType ? `<p><strong>Case Type:</strong> ${consent.caseType}</p>` : ''}
                ${consent.hospital ? `<p><strong>Hospital:</strong> ${consent.hospital}</p>` : ''}
                ${consent.urgency ? `<p><strong>Urgency:</strong> ${consent.urgency}</p>` : ''}
                ${consent.additionalInfo ? `<p><strong>Additional Information:</strong> ${consent.additionalInfo}</p>` : ''}
            </div>
            <div class="modal-actions">
                ${consent.status === 'pending' ? `
                    <button class="consent-btn approve-btn" onclick="approveConsent('${consent.id}'); closeModal();">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="consent-btn reject-btn" onclick="rejectConsent('${consent.id}'); closeModal();">
                        <i class="fas fa-times"></i> Reject
                    </button>
                ` : consent.status === 'active' ? `
                    <button class="consent-btn revoke-btn" onclick="revokeConsent('${consent.id}'); closeModal();">
                        <i class="fas fa-times"></i> Revoke
                    </button>
                ` : ''}
                <button class="consent-btn close-btn" onclick="closeModal()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    
    // Add modal to the document
    document.body.appendChild(modal);
    
    // Show the modal
    modal.style.display = 'block';
    
    // Add event listener to close button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', function() {
        modal.remove();
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    });
    
    // Add to recent activities
    addActivity({
        id: `ACT-${Date.now()}`,
        type: 'consent',
        title: 'Consent Viewed',
        description: `You viewed consent ${consentId}`,
        timestamp: new Date().toISOString(),
        patientName: localStorage.getItem('userName')
    });
    
    // Make closeModal function available globally
    window.closeModal = function() {
        modal.remove();
    };
}

function approveConsent(consentId) {
    // Get access requests from localStorage
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Find the request to approve
    const requestIndex = accessRequests.findIndex(r => r.id === consentId);
    
    if (requestIndex !== -1) {
        // Update request with patient consent
        accessRequests[requestIndex].patientConsent = true;
        accessRequests[requestIndex].patientConsentDate = new Date().toISOString();
        
        // Check if medical approval is also needed
        if (accessRequests[requestIndex].medicalApproval) {
            // Both approvals received, update status to approved
            accessRequests[requestIndex].status = 'approved';
        }
        
        // Save back to localStorage
        localStorage.setItem('accessRequests', JSON.stringify(accessRequests));
        
        // Add to patient consents
        const consents = JSON.parse(localStorage.getItem('patientConsents') || '[]');
        const request = accessRequests[requestIndex];
        
        // Create a new consent entry
        const newConsent = {
            id: request.id,
            title: `Access Request for ${request.caseType} Case`,
            status: request.medicalApproval ? 'active' : 'pending',
            requestedBy: request.legalProfessionalName,
            organization: request.legalProfessionalEmail ? request.legalProfessionalEmail.split('@')[1] : 'Legal Organization',
            purpose: request.reason,
            grantedDate: new Date().toISOString(),
            expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
            recordsIncluded: request.startDate && request.endDate ? 
                `Medical records from ${request.startDate} to ${request.endDate}` : 
                'All relevant medical records',
            caseId: request.caseId,
            caseType: request.caseType,
            hospital: request.hospital
        };
        
        // Add to consents if not already present
        if (!consents.some(c => c.id === newConsent.id)) {
            consents.push(newConsent);
            localStorage.setItem('patientConsents', JSON.stringify(consents));
        }
        
        // Create notification for legal professional
        const legalNotifications = JSON.parse(localStorage.getItem('legalNotifications') || '[]');
        legalNotifications.push({
            id: `NOTIF-${Date.now()}`,
            type: 'system',
            title: 'Consent Approved',
            message: `Patient ${request.patientName} has approved your access request for case ${request.caseId}`,
            requestId: request.id,
            timestamp: new Date().toISOString(),
            read: false
        });
        localStorage.setItem('legalNotifications', JSON.stringify(legalNotifications));
        
        // Create notification for medical staff
        const medicalNotifications = JSON.parse(localStorage.getItem('medicalNotifications') || '[]');
        medicalNotifications.push({
            id: `NOTIF-${Date.now() + 1}`,
            type: 'system',
            title: 'Patient Consent Received',
            message: `Patient ${request.patientName} has approved access request from ${request.legalProfessionalName} for case ${request.caseId}`,
            requestId: request.id,
            timestamp: new Date().toISOString(),
            read: false
        });
        localStorage.setItem('medicalNotifications', JSON.stringify(medicalNotifications));
        
        // Add to recent activities
        addActivity({
            id: `ACT-${Date.now()}`,
            type: 'consent',
            title: 'Consent Approved',
            description: `You approved consent for ${request.legalProfessionalName}`,
            timestamp: new Date().toISOString(),
            patientName: localStorage.getItem('userName')
        });
        
        // Reload consents
        loadConsentsAndRequests(localStorage.getItem('userName'));
        
        // Show success message
        alert('Consent approved successfully. The legal professional and medical staff have been notified.');
    } else {
        // Check if it's in the patient consents
        const consents = JSON.parse(localStorage.getItem('patientConsents') || '[]');
        const consentIndex = consents.findIndex(c => c.id === consentId);
        
        if (consentIndex !== -1 && consents[consentIndex].status === 'pending') {
            // Update consent status
            consents[consentIndex].status = 'active';
            consents[consentIndex].grantedDate = new Date().toISOString();
            consents[consentIndex].expiryDate = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString();
            
            // Save back to localStorage
            localStorage.setItem('patientConsents', JSON.stringify(consents));
            
            // Reload consents
            loadConsentsAndRequests(localStorage.getItem('userName'));
            
            // Show success message
            alert('Consent approved successfully.');
        } else {
            alert('Could not find the consent request.');
        }
    }
}

function rejectConsent(consentId) {
    // Get access requests from localStorage
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Find the request to reject
    const requestIndex = accessRequests.findIndex(r => r.id === consentId);
    
    if (requestIndex !== -1) {
        // Update request status to rejected
        accessRequests[requestIndex].status = 'rejected';
        accessRequests[requestIndex].patientConsent = false;
        accessRequests[requestIndex].rejectionDate = new Date().toISOString();
        
        // Save back to localStorage
        localStorage.setItem('accessRequests', JSON.stringify(accessRequests));
        
        // Create notification for legal professional
        const legalNotifications = JSON.parse(localStorage.getItem('legalNotifications') || '[]');
        const request = accessRequests[requestIndex];
        
        legalNotifications.push({
            id: `NOTIF-${Date.now()}`,
            type: 'system',
            title: 'Consent Rejected',
            message: `Patient ${request.patientName} has rejected your access request for case ${request.caseId}`,
            requestId: request.id,
            timestamp: new Date().toISOString(),
            read: false
        });
        localStorage.setItem('legalNotifications', JSON.stringify(legalNotifications));
        
        // Add to recent activities
        addActivity({
            id: `ACT-${Date.now()}`,
            type: 'consent',
            title: 'Consent Rejected',
            description: `You rejected consent for ${request.legalProfessionalName}`,
            timestamp: new Date().toISOString(),
            patientName: localStorage.getItem('userName')
        });
        
        // Reload consents
        loadConsentsAndRequests(localStorage.getItem('userName'));
        
        // Show success message
        alert('Consent rejected. The legal professional has been notified.');
    } else {
        // Check if it's in the patient consents
        const consents = JSON.parse(localStorage.getItem('patientConsents') || '[]');
        const consentIndex = consents.findIndex(c => c.id === consentId);
        
        if (consentIndex !== -1) {
            // Remove the consent
            consents.splice(consentIndex, 1);
            
            // Save back to localStorage
            localStorage.setItem('patientConsents', JSON.stringify(consents));
            
            // Reload consents
            loadConsentsAndRequests(localStorage.getItem('userName'));
            
            // Show success message
            alert('Consent rejected successfully.');
        } else {
            alert('Could not find the consent request.');
        }
    }
}

function revokeConsent(consentId) {
    if (confirm('Are you sure you want to revoke this consent?')) {
        // Get access requests from localStorage
        const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
        
        // Find the request to revoke
        const requestIndex = accessRequests.findIndex(r => r.id === consentId);
        
        if (requestIndex !== -1) {
            // Update request status to revoked
            accessRequests[requestIndex].status = 'revoked';
            accessRequests[requestIndex].patientConsent = false;
            accessRequests[requestIndex].revocationDate = new Date().toISOString();
            
            // Save back to localStorage
            localStorage.setItem('accessRequests', JSON.stringify(accessRequests));
            
            // Create notification for legal professional
            const legalNotifications = JSON.parse(localStorage.getItem('legalNotifications') || '[]');
            const request = accessRequests[requestIndex];
            
            legalNotifications.push({
                id: `NOTIF-${Date.now()}`,
                type: 'system',
                title: 'Consent Revoked',
                message: `Patient ${request.patientName} has revoked consent for your access request for case ${request.caseId}`,
                requestId: request.id,
                timestamp: new Date().toISOString(),
                read: false
            });
            localStorage.setItem('legalNotifications', JSON.stringify(legalNotifications));
        }
        
        // Get consents from localStorage
        const consents = JSON.parse(localStorage.getItem('patientConsents') || '[]');
        
        // Find the consent to revoke
        const consentIndex = consents.findIndex(c => c.id === consentId);
        
        if (consentIndex !== -1) {
            // Update consent status
            consents[consentIndex].status = 'expired';
            consents[consentIndex].revokedDate = new Date().toISOString();
            
            // Save back to localStorage
            localStorage.setItem('patientConsents', JSON.stringify(consents));
            
            // Add to recent activities
            addActivity({
                id: `ACT-${Date.now()}`,
                type: 'consent',
                title: 'Consent Revoked',
                description: `You revoked consent ${consentId}`,
                timestamp: new Date().toISOString(),
                patientName: localStorage.getItem('userName')
            });
            
            // Reload consents
            loadConsentsAndRequests(localStorage.getItem('userName'));
            
            // Show success message
            alert('Consent revoked successfully. The legal professional has been notified.');
        } else if (requestIndex === -1) {
            alert('Could not find the consent to revoke.');
        }
    }
}

function addActivity(activity) {
    const activities = JSON.parse(localStorage.getItem('patientActivities') || '[]');
    activities.unshift(activity);
    
    // Keep only the 10 most recent activities
    const recentActivities = activities.slice(0, 10);
    
    // Save back to localStorage
    localStorage.setItem('patientActivities', JSON.stringify(recentActivities));
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Make functions available globally
window.viewConsent = viewConsent;
window.approveConsent = approveConsent;
window.rejectConsent = rejectConsent;
window.revokeConsent = revokeConsent;
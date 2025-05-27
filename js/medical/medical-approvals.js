document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    
    // Get user's hospital
    const userHospital = localStorage.getItem('userHospital') || '';
    
    // Load access requests
    loadAccessRequests(userHospital);
    
    // Set up tab switching
    const approvalTabs = document.querySelectorAll('.approval-tab');
    approvalTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            approvalTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.approval-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show the selected tab content
            const tabName = this.getAttribute('data-tab');
            document.getElementById(`${tabName}-approvals`).classList.add('active');
        });
    });
    
    // Set up modal close button
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('request-details-modal').style.display = 'none';
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('request-details-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

function loadAccessRequests(userHospital) {
    // Get access requests from localStorage
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Filter requests by hospital if userHospital is specified
    const filteredRequests = userHospital ? 
        accessRequests.filter(request => request.hospital === userHospital) : 
        accessRequests;
    
    // Filter requests by status
    const pendingRequests = filteredRequests.filter(request => request.status === 'pending');
    const approvedRequests = filteredRequests.filter(request => request.status === 'approved');
    const rejectedRequests = filteredRequests.filter(request => request.status === 'rejected');
    
    // Load pending requests
    loadRequestsByType('pending', pendingRequests);
    
    // Load approved requests
    loadRequestsByType('approved', approvedRequests);
    
    // Load rejected requests
    loadRequestsByType('rejected', rejectedRequests);
}

function loadRequestsByType(type, requests) {
    const requestList = document.getElementById(`${type}-approval-list`);
    const emptyState = document.getElementById(`${type}-empty-state`);
    
    if (requests.length > 0) {
        // Hide empty state
        emptyState.style.display = 'none';
        
        // Clear request list
        requestList.innerHTML = '';
        
        // Add requests
        requests.forEach(request => {
            const requestCard = createRequestCard(request, type);
            requestList.appendChild(requestCard);
        });
    } else {
        // Show empty state
        emptyState.style.display = 'block';
        requestList.innerHTML = '';
    }
}

function createRequestCard(request, type) {
    const requestCard = document.createElement('div');
    requestCard.className = 'approval-card';
    
    // Format date
    const requestDate = new Date(request.timestamp);
    const formattedDate = requestDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Create actions based on status
    let actions = '';
    if (type === 'pending') {
        actions = `
            <button class="approval-btn view-btn" onclick="viewRequest('${request.id}')">
                <i class="fas fa-eye"></i> View Details
            </button>
            <button class="approval-btn approve-btn" onclick="approveRequest('${request.id}')">
                <i class="fas fa-check"></i> Approve
            </button>
            <button class="approval-btn reject-btn" onclick="rejectRequest('${request.id}')">
                <i class="fas fa-times"></i> Reject
            </button>
        `;
    } else {
        actions = `
            <button class="approval-btn view-btn" onclick="viewRequest('${request.id}')">
                <i class="fas fa-eye"></i> View Details
            </button>
        `;
    }
    
    // Check if it's a court order
    const courtOrderBadge = request.isCourtOrder ? 
        '<span class="badge court-order">Court Order</span>' : '';
    
    // Check if patient consent is required and has been given
    let patientConsentStatus = '';
    if (request.requiresPatientConsent && !request.isCourtOrder) {
        if (request.patientConsent) {
            patientConsentStatus = '<span class="badge consent-given">Patient Consent Given</span>';
        } else {
            patientConsentStatus = '<span class="badge consent-pending">Awaiting Patient Consent</span>';
        }
    }
    
    requestCard.innerHTML = `
        <div class="approval-header">
            <h3 class="approval-title">Access Request ${courtOrderBadge} ${patientConsentStatus}</h3>
            <span class="approval-date">${formattedDate}</span>
        </div>
        <span class="approval-status ${type}">${capitalizeFirstLetter(type)}</span>
        <div class="approval-details">
            <p><strong>Legal Professional:</strong> ${request.legalProfessionalName}</p>
            <p><strong>Patient:</strong> ${request.patientName}</p>
            <p><strong>Hospital:</strong> ${request.hospital}</p>
            <p><strong>Case Type:</strong> ${capitalizeFirstLetter(request.caseType.replace('-', ' '))}</p>
            <p><strong>Urgency:</strong> ${capitalizeFirstLetter(request.urgency || 'Normal')}</p>
        </div>
        <div class="approval-actions">
            ${actions}
        </div>
    `;
    
    return requestCard;
}

function viewRequest(requestId) {
    // Get access requests from localStorage
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Find the request
    const request = accessRequests.find(r => r.id === requestId);
    
    if (request) {
        // Format date
        const requestDate = new Date(request.timestamp);
        const formattedDate = requestDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Create content for modal
        let modalContent = `
            <div class="approval-details">
                <p><strong>Request ID:</strong> ${request.id}</p>
                <p><strong>Date Requested:</strong> ${formattedDate}</p>
                <p><strong>Legal Professional:</strong> ${request.legalProfessionalName}</p>
                <p><strong>Email:</strong> ${request.legalProfessionalEmail}</p>
                <p><strong>Patient:</strong> ${request.patientName}</p>
                <p><strong>Patient Phone:</strong> ${request.patientPhone}</p>
                <p><strong>Hospital:</strong> ${request.hospital}</p>
                <p><strong>Case ID:</strong> ${request.caseId}</p>
                <p><strong>Case Type:</strong> ${capitalizeFirstLetter(request.caseType.replace('-', ' '))}</p>
                <p><strong>Urgency:</strong> ${capitalizeFirstLetter(request.urgency || 'Normal')}</p>
                <p><strong>Reason for Request:</strong> ${request.reason}</p>
        `;
        
        // Add patient consent status if required
        if (request.requiresPatientConsent && !request.isCourtOrder) {
            const consentStatus = request.patientConsent ? 
                '<span class="badge consent-given">Patient Consent Given</span>' : 
                '<span class="badge consent-pending">Awaiting Patient Consent</span>';
            
            modalContent += `
                <p><strong>Patient Consent Status:</strong> ${consentStatus}</p>
            `;
        }
        
        // Add date range if provided
        if (request.startDate && request.endDate) {
            modalContent += `
                <p><strong>Records Date Range:</strong> ${request.startDate} to ${request.endDate}</p>
            `;
        }
        
        // Add additional info if provided
        if (request.additionalInfo) {
            modalContent += `
                <p><strong>Additional Information:</strong> ${request.additionalInfo}</p>
            `;
        }
        
        // Add court order info if applicable
        if (request.isCourtOrder) {
            modalContent += `
                <p><strong>Court Order:</strong> Yes</p>
            `;
        }
        
        // Add uploaded documents section
        modalContent += `<h3 style="margin-top: 20px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">Uploaded Documents</h3>`;
        
        // Add advocate license document
        if (request.advocateLicenseName) {
            modalContent += `
                <div class="document-item">
                    <div class="document-info">
                        <i class="fas fa-file-pdf document-icon"></i>
                        <div class="document-details">
                            <h4>Advocate License</h4>
                            <p>${request.advocateLicenseName}</p>
                        </div>
                    </div>
                    <div class="document-actions">
                        <button class="document-btn view-doc-btn" onclick="viewDocument('${request.id}', 'advocate-license')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="document-btn download-btn" onclick="downloadDocument('${request.id}', 'advocate-license')">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Add purpose document
        if (request.purposeDocumentName) {
            modalContent += `
                <div class="document-item">
                    <div class="document-info">
                        <i class="fas fa-file-pdf document-icon"></i>
                        <div class="document-details">
                            <h4>Purpose of Request Document</h4>
                            <p>${request.purposeDocumentName}</p>
                        </div>
                    </div>
                    <div class="document-actions">
                        <button class="document-btn view-doc-btn" onclick="viewDocument('${request.id}', 'purpose-document')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="document-btn download-btn" onclick="downloadDocument('${request.id}', 'purpose-document')">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Add court order document if applicable
        if (request.isCourtOrder && request.courtOrderDocumentName) {
            modalContent += `
                <div class="document-item">
                    <div class="document-info">
                        <i class="fas fa-file-pdf document-icon"></i>
                        <div class="document-details">
                            <h4>Court Order Document</h4>
                            <p>${request.courtOrderDocumentName}</p>
                        </div>
                    </div>
                    <div class="document-actions">
                        <button class="document-btn view-doc-btn" onclick="viewDocument('${request.id}', 'court-order')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="document-btn download-btn" onclick="downloadDocument('${request.id}', 'court-order')">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Close details div
        modalContent += `</div>`;
        
        // Add approval actions if request is pending
        if (request.status === 'pending') {
            modalContent += `
                <div class="approval-actions" style="margin-top: 20px; justify-content: flex-end;">
                    <button class="approval-btn approve-btn" onclick="approveRequest('${request.id}', true)">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="approval-btn reject-btn" onclick="rejectRequest('${request.id}', true)">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            `;
        }
        
        // Set modal content
        document.getElementById('request-details-content').innerHTML = modalContent;
        
        // Show modal
        document.getElementById('request-details-modal').style.display = 'block';
    }
}

// Function to view document
function viewDocument(requestId, docType) {
    // Get access requests from localStorage
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Find the request
    const request = accessRequests.find(r => r.id === requestId);
    
    if (!request) {
        alert('Request not found');
        return;
    }
    
    let fileName = '';
    let fileData = '';
    
    // Get the appropriate file data based on document type
    switch(docType) {
        case 'advocate-license':
            fileName = request.advocateLicenseName;
            fileData = request.advocateLicenseData;
            break;
        case 'purpose-document':
            fileName = request.purposeDocumentName;
            fileData = request.purposeDocumentData;
            break;
        case 'court-order':
            fileName = request.courtOrderDocumentName;
            fileData = request.courtOrderDocumentData;
            break;
    }
    
    if (!fileName || !fileData) {
        alert('Document not found');
        return;
    }
    
    // Open the PDF in a new window
    const viewerWindow = window.open('', '_blank');
    
    // Create the document viewer HTML
    const viewerHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${fileName} - Document Viewer</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f5f5f5;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                
                .viewer-header {
                    background-color: #1e293b;
                    color: white;
                    padding: 10px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .viewer-title {
                    margin: 0;
                    font-size: 18px;
                }
                
                .viewer-controls {
                    display: flex;
                    gap: 10px;
                }
                
                .viewer-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    border-radius: 4px;
                    padding: 5px 10px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .viewer-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                
                .document-container {
                    flex: 1;
                    overflow: hidden;
                }
                
                .document-frame {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
            </style>
        </head>
        <body>
            <div class="viewer-header">
                <h1 class="viewer-title">${fileName}</h1>
                <div class="viewer-controls">
                    <button class="viewer-btn" onclick="window.print()">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button class="viewer-btn" onclick="downloadFile()">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="viewer-btn" onclick="window.close()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
            <div class="document-container">
                <embed src="${fileData}" type="application/pdf" class="document-frame">
            </div>
            <script>
                function downloadFile() {
                    const link = document.createElement('a');
                    link.href = "${fileData}";
                    link.download = "${fileName}";
                    link.click();
                }
            </script>
        </body>
        </html>
    `;
    
    // Write the HTML to the new window
    viewerWindow.document.write(viewerHTML);
    viewerWindow.document.close();
}

// Function to download document
function downloadDocument(requestId, docType) {
    // Get access requests from localStorage
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Find the request
    const request = accessRequests.find(r => r.id === requestId);
    
    if (!request) {
        alert('Request not found');
        return;
    }
    
    let fileName = '';
    let fileData = '';
    
    // Get the appropriate file data based on document type
    switch(docType) {
        case 'advocate-license':
            fileName = request.advocateLicenseName;
            fileData = request.advocateLicenseData;
            break;
        case 'purpose-document':
            fileName = request.purposeDocumentName;
            fileData = request.purposeDocumentData;
            break;
        case 'court-order':
            fileName = request.courtOrderDocumentName;
            fileData = request.courtOrderDocumentData;
            break;
    }
    
    if (!fileName || !fileData) {
        alert('Document not found');
        return;
    }
    
    // Create a temporary link element
    const a = document.createElement('a');
    a.href = fileData;
    a.download = fileName;
    
    // Append to the document, click it, and remove it
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function approveRequest(requestId, closeModal = false) {
    if (confirm('Are you sure you want to approve this access request?')) {
        // Get access requests from localStorage
        const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
        
        // Find the request
        const requestIndex = accessRequests.findIndex(r => r.id === requestId);
        
        if (requestIndex !== -1) {
            // Mark medical approval
            accessRequests[requestIndex].medicalApproval = true;
            accessRequests[requestIndex].approvedDate = new Date().toISOString();
            accessRequests[requestIndex].approvedBy = localStorage.getItem('userName') || 'Medical Staff';
            
            // Only change status to approved if it's a court order or patient consent is already given
            if (accessRequests[requestIndex].isCourtOrder || accessRequests[requestIndex].patientConsent) {
                accessRequests[requestIndex].status = 'approved';
            }
            
            // Save back to localStorage
            localStorage.setItem('accessRequests', JSON.stringify(accessRequests));
            
            // Add notification for legal professional
            const notifications = JSON.parse(localStorage.getItem('legalNotifications') || '[]');
            
            // Create appropriate message based on whether patient consent is still needed
            let notificationMessage = '';
            let notificationType = '';
            let notificationTitle = '';
            
            if (accessRequests[requestIndex].requiresPatientConsent && !accessRequests[requestIndex].patientConsent) {
                notificationMessage = `Your request for access to medical records for patient ${accessRequests[requestIndex].patientName} has been approved by medical staff. Waiting for patient consent.`;
                notificationType = 'medical_approved';
                notificationTitle = 'Medical Staff Approved Request';
            } else {
                notificationMessage = `Your request for access to medical records for patient ${accessRequests[requestIndex].patientName} has been fully approved. You can now access the records.`;
                notificationType = 'access_approved';
                notificationTitle = 'Access Request Fully Approved';
            }
            
            notifications.push({
                id: `NOTIF-${Date.now()}`,
                type: notificationType,
                title: notificationTitle,
                message: notificationMessage,
                requestId: requestId,
                timestamp: new Date().toISOString(),
                read: false
            });
            localStorage.setItem('legalNotifications', JSON.stringify(notifications));
            
            // Add notification for patient if consent is still needed
            if (accessRequests[requestIndex].requiresPatientConsent && !accessRequests[requestIndex].patientConsent) {
                const patientNotifications = JSON.parse(localStorage.getItem('patientNotifications') || '[]');
                patientNotifications.push({
                    id: `NOTIF-${Date.now() + 1}`,
                    type: 'consent_request',
                    title: 'Medical Staff Approved Access Request',
                    message: `Medical staff has approved the access request from ${accessRequests[requestIndex].legalProfessionalName}. Your consent is still needed.`,
                    requestId: requestId,
                    timestamp: new Date().toISOString(),
                    read: false,
                    patientName: accessRequests[requestIndex].patientName,
                    requiresAction: true
                });
                localStorage.setItem('patientNotifications', JSON.stringify(patientNotifications));
            }
            
            // Close modal if needed
            if (closeModal) {
                document.getElementById('request-details-modal').style.display = 'none';
            }
            
            // Reload access requests
            const userHospital = localStorage.getItem('userHospital') || '';
            loadAccessRequests(userHospital);
            
            // Show success message
            if (accessRequests[requestIndex].requiresPatientConsent && !accessRequests[requestIndex].patientConsent) {
                alert('Access request approved by medical staff. Waiting for patient consent.');
            } else {
                alert('Access request fully approved!');
            }
        }
    }
}

function rejectRequest(requestId, closeModal = false) {
    if (confirm('Are you sure you want to reject this access request?')) {
        // Get access requests from localStorage
        const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
        
        // Find the request
        const requestIndex = accessRequests.findIndex(r => r.id === requestId);
        
        if (requestIndex !== -1) {
            // Update request status
            accessRequests[requestIndex].status = 'rejected';
            accessRequests[requestIndex].rejectedDate = new Date().toISOString();
            accessRequests[requestIndex].rejectedBy = localStorage.getItem('userName') || 'Medical Staff';
            
            // Save back to localStorage
            localStorage.setItem('accessRequests', JSON.stringify(accessRequests));
            
            // Add notification for legal professional
            const notifications = JSON.parse(localStorage.getItem('legalNotifications') || '[]');
            notifications.push({
                id: `NOTIF-${Date.now()}`,
                type: 'access_rejected',
                title: 'Access Request Rejected',
                message: `Your request for access to medical records for patient ${accessRequests[requestIndex].patientName} has been rejected by medical staff`,
                requestId: requestId,
                timestamp: new Date().toISOString(),
                read: false
            });
            localStorage.setItem('legalNotifications', JSON.stringify(notifications));
            
            // Close modal if needed
            if (closeModal) {
                document.getElementById('request-details-modal').style.display = 'none';
            }
            
            // Reload access requests
            const userHospital = localStorage.getItem('userHospital') || '';
            loadAccessRequests(userHospital);
            
            // Show success message
            alert('Access request rejected successfully!');
        }
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
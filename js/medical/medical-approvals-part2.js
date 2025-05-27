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
                <p><strong>Urgency:</strong> ${capitalizeFirstLetter(request.urgency)}</p>
                <p><strong>Reason for Request:</strong> ${request.reason}</p>
        `;
        
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
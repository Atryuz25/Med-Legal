document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    
    // Get current legal professional's information
    const legalProfessionalName = localStorage.getItem('userName') || '';
    const legalProfessionalEmail = localStorage.getItem('userEmail') || '';
    
    // Load approved access requests and display available records
    loadApprovedRequests(legalProfessionalName, legalProfessionalEmail);
    
    // Set up search functionality
    const searchBar = document.querySelector('.search-bar');
    searchBar.addEventListener('input', function() {
        filterRecords(this.value);
    });
    
    // Set up filter by type
    const typeFilter = document.querySelector('select');
    typeFilter.addEventListener('change', function() {
        filterRecordsByType(this.value);
    });
    
    // Set up filter by date
    const dateFilter = document.querySelector('input[type="date"]');
    dateFilter.addEventListener('change', function() {
        filterRecordsByDate(this.value);
    });
});

function loadApprovedRequests(legalProfessionalName, legalProfessionalEmail) {
    // Get all access requests from localStorage
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Filter for approved requests for this legal professional
    const approvedRequests = accessRequests.filter(request => 
        request.status === 'approved' && 
        (request.legalProfessionalName === legalProfessionalName || 
         request.legalProfessionalEmail === legalProfessionalEmail)
    );
    
    // Get the table body to populate
    const tableBody = document.querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (approvedRequests.length === 0) {
        // No approved requests
        const noRecordsRow = document.createElement('tr');
        noRecordsRow.innerHTML = `
            <td colspan="4" class="no-records">
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No Records Available</h3>
                    <p>You don't have any approved access requests yet. Please submit a request to access patient records.</p>
                    <a href="legal-request.html" class="btn">Request Access</a>
                </div>
            </td>
        `;
        tableBody.appendChild(noRecordsRow);
        return;
    }
    
    // Get medical records from localStorage
    const medicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    
    // For each approved request, find matching medical records
    approvedRequests.forEach(request => {
        // Check if both medical approval and patient consent are required and received
        const requiresPatientConsent = request.requiresPatientConsent !== false;
        const hasPatientConsent = request.patientConsent === true;
        const hasMedicalApproval = request.medicalApproval === true || request.status === 'approved';
        
        // If patient consent is required but not received, skip this request
        if (requiresPatientConsent && !hasPatientConsent) {
            // Create a row showing pending patient consent
            const pendingRow = document.createElement('tr');
            pendingRow.dataset.patientName = request.patientName;
            
            pendingRow.innerHTML = `
                <td>${request.caseId}</td>
                <td>${request.patientName}</td>
                <td><span class="status pending">Pending Consent</span></td>
                <td>
                    <div class="patient-info">
                        <p><strong>Patient:</strong> ${request.patientName}</p>
                        <p><strong>Phone:</strong> ${request.patientPhone}</p>
                        <p><strong>Hospital:</strong> ${request.hospital}</p>
                        <p><strong>Case Type:</strong> ${capitalizeFirstLetter(request.caseType.replace('-', ' '))}</p>
                        <p><strong>Date Range:</strong> ${request.startDate || 'Not specified'} to ${request.endDate || 'Not specified'}</p>
                        <p class="pending-message">Waiting for patient consent. You will be notified when consent is granted.</p>
                    </div>
                </td>
            `;
            tableBody.appendChild(pendingRow);
            return;
        }
        
        // If medical approval is required but not received, skip this request
        if (!hasMedicalApproval) {
            // Create a row showing pending medical approval
            const pendingRow = document.createElement('tr');
            pendingRow.dataset.patientName = request.patientName;
            
            pendingRow.innerHTML = `
                <td>${request.caseId}</td>
                <td>${request.patientName}</td>
                <td><span class="status pending">Pending Medical Approval</span></td>
                <td>
                    <div class="patient-info">
                        <p><strong>Patient:</strong> ${request.patientName}</p>
                        <p><strong>Phone:</strong> ${request.patientPhone}</p>
                        <p><strong>Hospital:</strong> ${request.hospital}</p>
                        <p><strong>Case Type:</strong> ${capitalizeFirstLetter(request.caseType.replace('-', ' '))}</p>
                        <p><strong>Date Range:</strong> ${request.startDate || 'Not specified'} to ${request.endDate || 'Not specified'}</p>
                        <p class="pending-message">Waiting for medical staff approval. You will be notified when approval is granted.</p>
                    </div>
                </td>
            `;
            tableBody.appendChild(pendingRow);
            return;
        }
        
        // Find medical records for this patient
        const patientRecords = medicalRecords.filter(record => 
            record.patientName === request.patientName
        );
        
        if (patientRecords.length === 0) {
            // Create a row for the patient even if no records exist yet
            const patientRow = document.createElement('tr');
            patientRow.dataset.patientName = request.patientName;
            
            patientRow.innerHTML = `
                <td>${request.caseId}</td>
                <td>${request.patientName}</td>
                <td><span class="status approved">Approved</span></td>
                <td>
                    <div class="patient-info">
                        <p><strong>Patient:</strong> ${request.patientName}</p>
                        <p><strong>Phone:</strong> ${request.patientPhone}</p>
                        <p><strong>Hospital:</strong> ${request.hospital}</p>
                        <p><strong>Case Type:</strong> ${capitalizeFirstLetter(request.caseType.replace('-', ' '))}</p>
                        <p><strong>Date Range:</strong> ${request.startDate || 'Not specified'} to ${request.endDate || 'Not specified'}</p>
                        <p class="no-records-message">No medical records uploaded yet for this patient</p>
                    </div>
                </td>
            `;
            tableBody.appendChild(patientRow);
        } else {
            // Create a row for each medical record
            patientRecords.forEach((record, index) => {
                const recordRow = document.createElement('tr');
                recordRow.dataset.patientName = record.patientName;
                recordRow.dataset.recordType = record.recordType || 'general';
                recordRow.dataset.recordDate = record.recordDate || '';
                
                recordRow.innerHTML = `
                    <td>${request.caseId}</td>
                    <td>${record.patientName}</td>
                    <td><span class="status approved">Approved</span></td>
                    <td>
                        <div class="record-card">
                            <div class="record-header">
                                <h3>Medical Record ${index + 1}</h3>
                                <span class="record-date">${formatDate(record.recordDate)}</span>
                            </div>
                            <div class="record-details">
                                <p><strong>Record Type:</strong> ${capitalizeFirstLetter(record.recordType || 'General')}</p>
                                <p><strong>Hospital:</strong> ${record.hospital || 'Not specified'}</p>
                                <p><strong>Doctor:</strong> ${record.doctor || 'Not specified'}</p>
                                <p><strong>Upload Date:</strong> ${formatDate(record.uploadDate)}</p>
                            </div>
                            <div class="record-content-preview">
                                <p><strong>Content:</strong></p>
                                <div class="content-preview">${record.content ? truncateText(record.content, 100) : 'No content available'}</div>
                            </div>
                            <div class="record-actions">
                                <button class="btn view-btn" onclick="viewRecord('${record.id}')">
                                    <i class="fas fa-eye"></i> View Full Record
                                </button>
                                <button class="btn download-btn" onclick="downloadRecord('${record.id}')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>
                        </div>
                    </td>
                `;
                tableBody.appendChild(recordRow);
            });
        }
    });
}

function viewRecord(recordId) {
    // Get medical records from localStorage
    const medicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    
    // Find the specific record
    const record = medicalRecords.find(r => r.id === recordId);
    
    if (!record) {
        alert('Record not found');
        return;
    }
    
    // Create a modal to display the record details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Medical Record</h2>
            <div class="record-details">
                <p><strong>Patient Name:</strong> ${record.patientName}</p>
                <p><strong>Record Type:</strong> ${capitalizeFirstLetter(record.recordType || 'General')}</p>
                <p><strong>Record Date:</strong> ${formatDate(record.recordDate)}</p>
                <p><strong>Hospital:</strong> ${record.hospital || 'Not specified'}</p>
                <p><strong>Doctor:</strong> ${record.doctor || 'Not specified'}</p>
                <p><strong>Upload Date:</strong> ${formatDate(record.uploadDate)}</p>
                
                <h3>Record Content</h3>
                <div class="record-content">
                    ${record.content || 'No content available'}
                </div>
                
                ${record.fileData ? `
                <div class="record-file">
                    <h3>Attached File</h3>
                    <embed src="${record.fileData}" type="application/pdf" width="100%" height="500px">
                </div>
                ` : ''}
            </div>
            <div class="modal-actions">
                <button class="btn download-btn" onclick="downloadRecord('${recordId}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn print-btn" onclick="printRecord('${recordId}')">
                    <i class="fas fa-print"></i> Print
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
    
    // Log this access for audit purposes
    logAccess(recordId, 'view');
}

function downloadRecord(recordId) {
    // Get medical records from localStorage
    const medicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    
    // Find the specific record
    const record = medicalRecords.find(r => r.id === recordId);
    
    if (!record) {
        alert('Record not found');
        return;
    }
    
    if (record.fileData) {
        // If there's a file attached, download it
        const link = document.createElement('a');
        link.href = record.fileData;
        link.download = `${record.patientName}_medical_record_${recordId}.pdf`;
        link.click();
    } else {
        // Otherwise, create a text file with the record details
        const recordText = `
            Patient Name: ${record.patientName}
            Record Type: ${capitalizeFirstLetter(record.recordType || 'General')}
            Record Date: ${formatDate(record.recordDate)}
            Hospital: ${record.hospital || 'Not specified'}
            Doctor: ${record.doctor || 'Not specified'}
            
            Record Content:
            ${record.content || 'No content available'}
        `;
        
        const blob = new Blob([recordText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${record.patientName}_medical_record_${recordId}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    }
    
    // Log this access for audit purposes
    logAccess(recordId, 'download');
}

function printRecord(recordId) {
    // Get medical records from localStorage
    const medicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    
    // Find the specific record
    const record = medicalRecords.find(r => r.id === recordId);
    
    if (!record) {
        alert('Record not found');
        return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Create the print content
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Medical Record - ${record.patientName}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    line-height: 1.5;
                }
                h1 {
                    color: #333;
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 10px;
                }
                .record-details p {
                    margin: 5px 0;
                }
                .record-content {
                    margin-top: 20px;
                    padding: 10px;
                    border: 1px solid #ccc;
                    background-color: #f9f9f9;
                }
                .footer {
                    margin-top: 30px;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <h1>Medical Record</h1>
            <div class="record-details">
                <p><strong>Patient Name:</strong> ${record.patientName}</p>
                <p><strong>Record Type:</strong> ${capitalizeFirstLetter(record.recordType || 'General')}</p>
                <p><strong>Record Date:</strong> ${formatDate(record.recordDate)}</p>
                <p><strong>Hospital:</strong> ${record.hospital || 'Not specified'}</p>
                <p><strong>Doctor:</strong> ${record.doctor || 'Not specified'}</p>
                
                <h2>Record Content</h2>
                <div class="record-content">
                    ${record.content || 'No content available'}
                </div>
            </div>
            <div class="footer">
                <p>Printed on: ${new Date().toLocaleString()}</p>
                <p>This document is confidential and intended only for authorized legal purposes.</p>
            </div>
        </body>
        </html>
    `;
    
    // Write the content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
        printWindow.print();
    };
    
    // Log this access for audit purposes
    logAccess(recordId, 'print');
}

function logAccess(recordId, accessType) {
    // Get existing access logs
    const accessLogs = JSON.parse(localStorage.getItem('accessLogs') || '[]');
    
    // Create a new log entry
    const logEntry = {
        id: `LOG-${Date.now()}`,
        recordId: recordId,
        userType: 'legal',
        userName: localStorage.getItem('userName') || 'Legal Professional',
        userEmail: localStorage.getItem('userEmail') || '',
        accessType: accessType,
        timestamp: new Date().toISOString()
    };
    
    // Add to logs
    accessLogs.push(logEntry);
    
    // Save back to localStorage
    localStorage.setItem('accessLogs', JSON.stringify(accessLogs));
}

function filterRecords(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        if (row.querySelector('.empty-state')) {
            // Skip the empty state row
            return;
        }
        
        const patientName = row.dataset.patientName?.toLowerCase() || '';
        const caseId = row.querySelector('td:first-child')?.textContent.toLowerCase() || '';
        const recordContent = row.querySelector('.content-preview')?.textContent.toLowerCase() || '';
        
        if (patientName.includes(searchTerm) || caseId.includes(searchTerm) || recordContent.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterRecordsByType(recordType) {
    if (!recordType) {
        // Show all records
        document.querySelectorAll('tbody tr').forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        if (row.querySelector('.empty-state')) {
            // Skip the empty state row
            return;
        }
        
        const rowType = row.dataset.recordType || '';
        
        if (rowType === recordType) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterRecordsByDate(date) {
    if (!date) {
        // Show all records
        document.querySelectorAll('tbody tr').forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        if (row.querySelector('.empty-state')) {
            // Skip the empty state row
            return;
        }
        
        const rowDate = row.dataset.recordDate || '';
        
        if (rowDate === date) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function formatDate(dateString) {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}
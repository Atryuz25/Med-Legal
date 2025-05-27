document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || userType !== 'legal') {
        window.location.href = '../index.html';
        return;
    }
    
    // Get user information
    const userName = localStorage.getItem('userName') || 'Legal Professional';
    document.title = `${userName}'s Dashboard - MedLegal`;
    
    // Update dashboard statistics
    updateDashboardStats();
    
    // Load recent access requests
    loadRecentRequests();
});

function updateDashboardStats() {
    // Update active cases count
    // For demo purposes, we'll count the number of unique case IDs in access requests
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    const userRequests = accessRequests.filter(req => 
        req.legalProfessionalName === localStorage.getItem('userName')
    );
    
    // Count unique case IDs
    const uniqueCaseIds = new Set();
    userRequests.forEach(req => uniqueCaseIds.add(req.caseId));
    const activeCasesCount = uniqueCaseIds.size;
    
    document.getElementById('active-cases').textContent = activeCasesCount;
    
    // Update medical records count
    // Count the number of records the legal professional has access to
    const medicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    const approvedRequests = accessRequests.filter(req => 
        req.legalProfessionalName === localStorage.getItem('userName') && 
        req.status === 'approved'
    );
    
    // Count records that match approved requests (by patient name)
    const accessibleRecords = medicalRecords.filter(record => 
        approvedRequests.some(req => req.patientName === record.patientName)
    );
    
    document.getElementById('medical-records').textContent = accessibleRecords.length;
    
    // Update pending requests count
    const pendingRequests = accessRequests.filter(req => 
        req.legalProfessionalName === localStorage.getItem('userName') && 
        req.status === 'pending'
    );
    
    document.getElementById('pending-requests').textContent = pendingRequests.length;
    
    // Update notifications badge in sidebar
    updateNotificationsBadge();
}

function loadRecentRequests() {
    const recentRequestsList = document.getElementById('recent-requests-list');
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Filter requests for the current user
    const userRequests = accessRequests.filter(req => 
        req.legalProfessionalName === localStorage.getItem('userName')
    );
    
    if (userRequests.length > 0) {
        // Clear empty state
        recentRequestsList.innerHTML = '';
        
        // Sort by timestamp (newest first)
        userRequests.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
        
        // Display up to 5 most recent requests
        const recentRequests = userRequests.slice(0, 5);
        
        recentRequests.forEach(request => {
            const requestDate = new Date(request.timestamp || request.createdAt).toLocaleDateString();
            const statusClass = request.status === 'pending' ? 'pending' : 
                              request.status === 'approved' ? 'approved' : 'rejected';
            
            const requestItem = document.createElement('div');
            requestItem.className = 'request-item';
            requestItem.dataset.id = request.id;
            
            requestItem.innerHTML = `
                <div class="request-info">
                    <h3>${request.patientName}</h3>
                    <p><strong>Hospital:</strong> ${request.hospital.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</p>
                    <p><strong>Case ID:</strong> ${request.caseId}</p>
                    <p><strong>Submitted:</strong> ${requestDate}</p>
                </div>
                <div class="request-status ${statusClass}">
                    ${request.status.toUpperCase()}
                </div>
                <div class="request-remove" title="Remove request">
                    <i class="fas fa-times"></i>
                </div>
            `;
            
            // Add event listener for remove button
            const removeButton = requestItem.querySelector('.request-remove');
            removeButton.addEventListener('click', () => {
                removeRequest(request.id);
            });
            
            recentRequestsList.appendChild(requestItem);
        });
        
        // Add "View All" button if there are more than 5 requests
        if (userRequests.length > 5) {
            const viewAllBtn = document.createElement('button');
            viewAllBtn.className = 'btn view-all-btn';
            viewAllBtn.textContent = 'View All Requests';
            viewAllBtn.addEventListener('click', function() {
                window.location.href = 'legal-view.html';
            });
            
            recentRequestsList.appendChild(viewAllBtn);
        }
    } else {
        // Show empty state
        recentRequestsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-medical"></i>
                <p>No recent access requests found</p>
                <button onclick="window.location.href='legal-request.html'" class="btn">Create New Request</button>
            </div>
        `;
    }
}

function removeRequest(requestId) {
    // Remove from UI
    const requestItem = document.querySelector(`.request-item[data-id="${requestId}"]`);
    if (requestItem) {
        requestItem.remove();
    }
    
    // Remove from localStorage
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    const updatedRequests = accessRequests.filter(request => request.id !== requestId);
    localStorage.setItem('accessRequests', JSON.stringify(updatedRequests));
    
    // Also remove related notifications
    const notifications = JSON.parse(localStorage.getItem('legalNotifications') || '[]');
    const updatedNotifications = notifications.filter(notification => notification.requestId !== requestId);
    localStorage.setItem('legalNotifications', JSON.stringify(updatedNotifications));
    
    // Update dashboard stats
    updateDashboardStats();
    
    // Check if we need to show empty state
    const recentRequestsList = document.getElementById('recent-requests-list');
    const remainingItems = recentRequestsList.querySelectorAll('.request-item');
    
    if (remainingItems.length === 0) {
        recentRequestsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-medical"></i>
                <p>No recent access requests found</p>
                <button onclick="window.location.href='legal-request.html'" class="btn">Create New Request</button>
            </div>
        `;
    }
}

function updateNotificationsBadge() {
    // Count unread notifications
    const notifications = JSON.parse(localStorage.getItem('legalNotifications') || '[]');
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Update badge in sidebar
    const badge = document.querySelector('.sidebar ul li:nth-child(2) .badge');
    if (badge) {
        badge.textContent = unreadCount;
        
        // Hide badge if no unread notifications
        if (unreadCount === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'inline';
        }
    }
}
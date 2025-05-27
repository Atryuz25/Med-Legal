function approveRequest(requestId, closeModal = false) {
    if (confirm('Are you sure you want to approve this access request?')) {
        // Get access requests from localStorage
        const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
        
        // Find the request
        const requestIndex = accessRequests.findIndex(r => r.id === requestId);
        
        if (requestIndex !== -1) {
            // Update request status
            accessRequests[requestIndex].status = 'approved';
            accessRequests[requestIndex].approvedDate = new Date().toISOString();
            accessRequests[requestIndex].approvedBy = localStorage.getItem('userName') || 'Medical Staff';
            
            // Save back to localStorage
            localStorage.setItem('accessRequests', JSON.stringify(accessRequests));
            
            // Add notification for legal professional
            const notifications = JSON.parse(localStorage.getItem('legalNotifications') || '[]');
            notifications.push({
                id: `NOTIF-${Date.now()}`,
                type: 'access_approved',
                title: 'Access Request Approved',
                message: `Your request for access to medical records for patient ${accessRequests[requestIndex].patientName} has been approved`,
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
            alert('Access request approved successfully!');
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
                message: `Your request for access to medical records for patient ${accessRequests[requestIndex].patientName} has been rejected`,
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
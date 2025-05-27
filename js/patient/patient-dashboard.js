document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || userType !== 'patient') {
        window.location.href = '/index.html';
        return;
    }

    // Load user profile
    loadUserProfile();
    
    // Update dashboard statistics
    updateDashboardStats();
    
    // Load recent activities
    loadRecentActivities();
});

async function loadUserProfile() {
    try {
        // Try to load from backend API
        try {
            const response = await fetch('https://medicolegal.onrender.com/api/auth/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load profile');
            }

            const data = await response.json();
            
            // Update page title with user name
            document.title = `${data.name}'s Dashboard - MedLegal`;

        } catch (error) {
            console.log('Backend API not available, using localStorage for profile');
            // Fallback to localStorage
            const userName = localStorage.getItem('userName');
            if (userName) {
                document.title = `${userName}'s Dashboard - MedLegal`;
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile. Please try again.');
    }
}

function updateDashboardStats() {
    // Get the current patient's name
    const patientName = localStorage.getItem('userName');
    
    // Update records count - count records for this patient
    const medicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    const patientRecords = medicalRecords.filter(record => record.patientName === patientName);
    
    const recordsCountElement = document.getElementById('records-count');
    if (recordsCountElement) {
        recordsCountElement.textContent = patientRecords.length;
    }
    
    // Update active consents count
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    const approvedRequests = accessRequests.filter(req => 
        req.patientName === patientName && 
        req.status === 'approved'
    );
    
    const consentsCountElement = document.getElementById('consents-count');
    if (consentsCountElement) {
        consentsCountElement.textContent = approvedRequests.length;
    }
    
    // Update notifications count
    const notifications = JSON.parse(localStorage.getItem('patientNotifications') || '[]');
    const patientNotifications = notifications.filter(notification => 
        notification.patientName === patientName && 
        !notification.read
    );
    
    const notificationsCountElement = document.getElementById('notifications-count');
    if (notificationsCountElement) {
        notificationsCountElement.textContent = patientNotifications.length;
    }
}

function loadRecentActivities() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // Clear existing activities
    activityList.innerHTML = '';
    
    // Get the current patient's name
    const patientName = localStorage.getItem('userName');
    
    // Get recent activities
    const activities = [];
    
    // Add record activities
    const medicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    const patientRecords = medicalRecords.filter(record => record.patientName === patientName);
    
    patientRecords.forEach(record => {
        activities.push({
            id: record.id,
            type: 'record',
            title: 'Medical Record Added',
            description: `A ${record.recordType} record was added to your profile`,
            timestamp: new Date(record.uploadDate),
            doctor: record.doctor,
            hospital: record.hospital
        });
    });
    
    // Add consent activities
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    const patientRequests = accessRequests.filter(req => req.patientName === patientName);
    
    patientRequests.forEach(request => {
        const actionText = request.status === 'approved' ? 'approved' : 
                          request.status === 'rejected' ? 'rejected' : 'pending';
        
        activities.push({
            id: request.id,
            type: 'consent',
            title: `Access Request ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}`,
            description: `Access request from ${request.legalProfessionalName} is ${actionText}`,
            timestamp: new Date(request.updatedAt || request.createdAt),
            legalProfessional: request.legalProfessionalName,
            caseId: request.caseId
        });
    });
    
    // Get saved activities
    const savedActivities = JSON.parse(localStorage.getItem('patientActivities') || '[]');
    
    // Add login activity if not already in saved activities
    if (!savedActivities.some(activity => activity.type === 'login' && activity.patientName === patientName)) {
        const loginActivity = {
            id: `ACT-${Date.now()}`,
            type: 'login',
            title: 'Account Login',
            description: 'You logged in to your account',
            timestamp: new Date().toISOString(),
            patientName: patientName
        };
        savedActivities.push(loginActivity);
        localStorage.setItem('patientActivities', JSON.stringify(savedActivities));
    }
    
    // Add saved activities to the list
    savedActivities.forEach(activity => {
        if (activity.patientName === patientName) {
            activities.push({
                id: activity.id,
                type: activity.type,
                title: activity.title,
                description: activity.description,
                timestamp: new Date(activity.timestamp)
            });
        }
    });
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    // Display up to 5 most recent activities
    const recentActivities = activities.slice(0, 5);
    
    if (recentActivities.length > 0) {
        recentActivities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.dataset.id = activity.id;
            activityItem.dataset.type = activity.type;
            
            // Format time ago
            const timeAgo = formatTimeAgo(activity.timestamp);
            
            // Determine icon based on activity type
            let iconClass = 'fa-sign-in-alt';
            if (activity.type === 'record') {
                iconClass = 'fa-file-medical';
            } else if (activity.type === 'consent') {
                iconClass = 'fa-handshake';
            }
            
            activityItem.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="activity-details">
                    <h3>${activity.title}</h3>
                    <p>${activity.description}</p>
                    <span class="activity-time">${timeAgo}</span>
                </div>
                <div class="activity-remove" title="Remove activity">
                    <i class="fas fa-times"></i>
                </div>
            `;
            
            // Add event listener for remove button
            const removeButton = activityItem.querySelector('.activity-remove');
            removeButton.addEventListener('click', () => {
                removeActivity(activity.id, activity.type);
            });
            
            activityList.appendChild(activityItem);
        });
    } else {
        // Show empty state if no activities
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <p>No recent activity to display</p>
        `;
        activityList.appendChild(emptyState);
    }
}

function removeActivity(activityId, activityType) {
    // Remove from UI
    const activityItem = document.querySelector(`.activity-item[data-id="${activityId}"]`);
    if (activityItem) {
        activityItem.remove();
    }
    
    // Remove from localStorage based on activity type
    if (activityType === 'login' || activityType === 'system') {
        // Remove from saved activities
        const savedActivities = JSON.parse(localStorage.getItem('patientActivities') || '[]');
        const updatedActivities = savedActivities.filter(activity => activity.id !== activityId);
        localStorage.setItem('patientActivities', JSON.stringify(updatedActivities));
    }
    
    // Check if we need to show empty state
    const activityList = document.getElementById('activity-list');
    const remainingItems = activityList.querySelectorAll('.activity-item');
    
    if (remainingItems.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <p>No recent activity to display</p>
        `;
        activityList.appendChild(emptyState);
    }
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

function showError(message) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    document.body.appendChild(errorMessage);
    
    // Remove error message after 5 seconds
    setTimeout(() => {
        errorMessage.remove();
    }, 5000);
}

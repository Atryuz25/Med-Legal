document.addEventListener('DOMContentLoaded', () => {
    // Get user information from localStorage
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || userType !== 'medical') {
        window.location.href = '/index.html';
        return;
    }

    // Load user profile
    loadUserProfile();
    
    // Update dashboard statistics
    updateDashboardStats();

    // Add event listeners
    document.querySelector('.edit-profile')?.addEventListener('click', handleEditProfile);
    document.querySelector('.btn.deny')?.addEventListener('click', handleLogout);
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
            
            // Update profile information if on profile page
            const profileInfoH2 = document.querySelector('.profile-info h2');
            if (profileInfoH2) {
                profileInfoH2.textContent = data.name;
                document.getElementById('user-email').textContent = data.email;
                document.getElementById('user-phone').textContent = data.phone;
                document.getElementById('user-hospital').textContent = data.hospitalName;

                // Update role and ID
                const roleElement = document.querySelector('.profile-info p:nth-child(2)');
                roleElement.textContent = `Role: ${data.userType}`;
                const idElement = document.querySelector('.profile-info p:nth-child(3)');
                idElement.textContent = `ID: ${data.id}`;
            }
            
            // Update user name on dashboard
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = data.name;
            }

        } catch (error) {
            console.log('Backend API not available, using localStorage for profile');
            // Fallback to localStorage
            const userName = localStorage.getItem('userName');
            if (userName) {
                // Update user name on dashboard
                const userNameElement = document.getElementById('user-name');
                if (userNameElement) {
                    userNameElement.textContent = userName;
                }
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile. Please try again.');
    }
}

function updateDashboardStats() {
    // Update records count
    const medicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    const recordsCountElement = document.querySelector('.stat-card:nth-child(1) .stat-number');
    if (recordsCountElement) {
        recordsCountElement.textContent = medicalRecords.length;
    }
    
    // Update pending approvals count
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    const pendingRequests = accessRequests.filter(request => request.status === 'pending');
    const pendingApprovalsElement = document.getElementById('pending-approvals-count');
    if (pendingApprovalsElement) {
        pendingApprovalsElement.textContent = pendingRequests.length;
    }
    
    // Update notifications count
    const notifications = JSON.parse(localStorage.getItem('medicalNotifications') || '[]');
    const unreadNotifications = notifications.filter(notification => !notification.read);
    const notificationsCountElement = document.getElementById('notifications-count');
    if (notificationsCountElement) {
        notificationsCountElement.textContent = unreadNotifications.length;
    }
    
    // Update notifications badge in sidebar
    const notificationsBadge = document.querySelector('.sidebar nav ul li:nth-child(2) .badge');
    if (notificationsBadge) {
        notificationsBadge.textContent = unreadNotifications.length;
        // Hide badge if no unread notifications
        if (unreadNotifications.length === 0) {
            notificationsBadge.style.display = 'none';
        } else {
            notificationsBadge.style.display = 'inline';
        }
    }
    
    // Update recent activity
    updateRecentActivity();
}

function updateRecentActivity() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // Clear existing activities
    activityList.innerHTML = '';
    
    // Get recent activities (combine records, approvals, and logins)
    const activities = [];
    
    // Add uploaded records
    const medicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    medicalRecords.forEach(record => {
        activities.push({
            id: record.id,
            type: 'upload',
            title: 'Record Uploaded',
            description: `You uploaded a ${record.recordType} record for ${record.patientName}`,
            timestamp: new Date(record.uploadDate)
        });
    });
    
    // Add approval actions
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    const handledRequests = accessRequests.filter(request => request.status !== 'pending');
    handledRequests.forEach(request => {
        activities.push({
            id: request.id,
            type: 'approval',
            title: `Access Request ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}`,
            description: `You ${request.status} an access request from ${request.legalProfessionalName}`,
            timestamp: new Date(request.updatedAt || request.createdAt)
        });
    });
    
    // Get activities from localStorage
    const savedActivities = JSON.parse(localStorage.getItem('medicalActivities') || '[]');
    
    // Add login activity if not already in saved activities
    if (!savedActivities.some(activity => activity.type === 'login')) {
        const loginActivity = {
            id: `ACT-${Date.now()}`,
            type: 'login',
            title: 'Account Login',
            description: 'You logged in to your account',
            timestamp: new Date().toISOString()
        };
        savedActivities.push(loginActivity);
        localStorage.setItem('medicalActivities', JSON.stringify(savedActivities));
    }
    
    // Add saved activities to the list
    savedActivities.forEach(activity => {
        activities.push({
            id: activity.id,
            type: activity.type,
            title: activity.title,
            description: activity.description,
            timestamp: new Date(activity.timestamp)
        });
    });
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    // Display up to 5 most recent activities
    const recentActivities = activities.slice(0, 5);
    
    recentActivities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.dataset.id = activity.id;
        activityItem.dataset.type = activity.type;
        
        // Format time ago
        const timeAgo = formatTimeAgo(activity.timestamp);
        
        // Determine icon based on activity type
        let iconClass = 'fa-sign-in-alt';
        if (activity.type === 'upload') {
            iconClass = 'fa-upload';
        } else if (activity.type === 'approval') {
            iconClass = 'fa-clipboard-check';
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
    
    // If no activities, show a message
    if (recentActivities.length === 0) {
        const emptyActivity = document.createElement('div');
        emptyActivity.className = 'activity-item';
        emptyActivity.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-info-circle"></i>
            </div>
            <div class="activity-details">
                <h3>No Recent Activity</h3>
                <p>Your recent activities will appear here</p>
            </div>
        `;
        activityList.appendChild(emptyActivity);
    }
}

function removeActivity(activityId, activityType) {
    // Remove from UI
    const activityItem = document.querySelector(`.activity-item[data-id="${activityId}"]`);
    if (activityItem) {
        activityItem.remove();
    }
    
    // Remove from localStorage based on activity type
    if (activityType === 'upload') {
        // Remove from medical records
        const medicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
        const updatedRecords = medicalRecords.filter(record => record.id !== activityId);
        localStorage.setItem('medicalRecords', JSON.stringify(updatedRecords));
        
        // Also remove related notifications
        const notifications = JSON.parse(localStorage.getItem('medicalNotifications') || '[]');
        const updatedNotifications = notifications.filter(notification => notification.recordId !== activityId);
        localStorage.setItem('medicalNotifications', JSON.stringify(updatedNotifications));
    } else if (activityType === 'approval') {
        // Remove from access requests
        const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
        const updatedRequests = accessRequests.filter(request => request.id !== activityId);
        localStorage.setItem('accessRequests', JSON.stringify(updatedRequests));
        
        // Also remove related notifications
        const notifications = JSON.parse(localStorage.getItem('medicalNotifications') || '[]');
        const updatedNotifications = notifications.filter(notification => notification.requestId !== activityId);
        localStorage.setItem('medicalNotifications', JSON.stringify(updatedNotifications));
    } else {
        // Remove from saved activities
        const savedActivities = JSON.parse(localStorage.getItem('medicalActivities') || '[]');
        const updatedActivities = savedActivities.filter(activity => activity.id !== activityId);
        localStorage.setItem('medicalActivities', JSON.stringify(updatedActivities));
    }
    
    // Update dashboard stats
    updateDashboardStats();
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

function handleLogout() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        window.location.href = '/index.html';
    }
}

function handleEditProfile() {
    // Add edit profile functionality here
    alert('Edit profile functionality will be implemented soon');
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

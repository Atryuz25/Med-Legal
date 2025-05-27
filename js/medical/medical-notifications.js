document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || userType !== 'medical') {
        window.location.href = '../index.html';
        return;
    }
    
    // Load notifications
    loadNotifications();
    
    // Set up filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Apply filter
            const filter = this.getAttribute('data-filter');
            filterNotifications(filter);
        });
    });
    
    // Update notifications badge in sidebar
    updateNotificationsBadge();
});

function loadNotifications() {
    const notificationList = document.getElementById('notification-list');
    let notifications = JSON.parse(localStorage.getItem('medicalNotifications') || '[]');
    
    // Display notifications
    if (notifications.length > 0) {
        notificationList.innerHTML = '';
        
        // Sort by timestamp (newest first)
        notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        notifications.forEach(notification => {
            const notificationItem = createNotificationItem(notification);
            notificationList.appendChild(notificationItem);
        });
    } else {
        // Show empty state
        notificationList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications to display</p>
            </div>
        `;
    }
}

function createNotificationItem(notification) {
    const notificationItem = document.createElement('div');
    notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
    notificationItem.setAttribute('data-id', notification.id);
    notificationItem.setAttribute('data-type', notification.type);
    
    // Format timestamp
    const timestamp = new Date(notification.timestamp);
    const formattedTime = formatTimeAgo(timestamp);
    
    // Determine icon based on notification type
    let iconClass = 'fa-bell';
    let notificationType = 'system';
    
    if (notification.type === 'access_request') {
        iconClass = 'fa-file-signature';
        notificationType = 'access-request';
    } else if (notification.type === 'alert') {
        iconClass = 'fa-exclamation-triangle';
        notificationType = 'alert';
    }
    
    // Create notification content
    let actionsHtml = '';
    
    // Add specific actions based on notification type
    if (notification.type === 'access_request') {
        actionsHtml = `
            <div class="notification-actions">
                <button class="notification-btn approve-btn" data-request-id="${notification.requestId}">Approve</button>
                <button class="notification-btn reject-btn" data-request-id="${notification.requestId}">Reject</button>
                <button class="notification-btn view-btn" data-request-id="${notification.requestId}">View Details</button>
                <button class="notification-btn mark-read-btn" data-notification-id="${notification.id}">${notification.read ? 'Mark as Unread' : 'Mark as Read'}</button>
            </div>
        `;
    } else {
        actionsHtml = `
            <div class="notification-actions">
                <button class="notification-btn mark-read-btn" data-notification-id="${notification.id}">${notification.read ? 'Mark as Unread' : 'Mark as Read'}</button>
            </div>
        `;
    }
    
    notificationItem.innerHTML = `
        <div class="notification-icon ${notificationType}">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${formattedTime}</div>
            ${actionsHtml}
        </div>
        <div class="notification-remove" title="Remove notification">
            <i class="fas fa-times"></i>
        </div>
    `;
    
    // Add event listeners for action buttons
    setTimeout(() => {
        const markReadBtn = notificationItem.querySelector('.mark-read-btn');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleReadStatus(notification.id);
            });
        }
        
        const approveBtn = notificationItem.querySelector('.approve-btn');
        if (approveBtn) {
            approveBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                handleRequestAction(notification.requestId, 'approved');
            });
        }
        
        const rejectBtn = notificationItem.querySelector('.reject-btn');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                handleRequestAction(notification.requestId, 'rejected');
            });
        }
        
        const viewBtn = notificationItem.querySelector('.view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                viewRequestDetails(notification.requestId);
            });
        }
        
        const removeBtn = notificationItem.querySelector('.notification-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                removeNotification(notification.id);
            });
        }
    }, 0);
    
    return notificationItem;
}

function removeNotification(notificationId) {
    // Remove from UI
    const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
    if (notificationItem) {
        notificationItem.remove();
    }
    
    // Remove from localStorage
    const notifications = JSON.parse(localStorage.getItem('medicalNotifications') || '[]');
    const updatedNotifications = notifications.filter(notification => notification.id !== notificationId);
    localStorage.setItem('medicalNotifications', JSON.stringify(updatedNotifications));
    
    // Update notifications badge in sidebar
    updateNotificationsBadge();
    
    // Check if we need to show empty state
    const notificationList = document.getElementById('notification-list');
    if (updatedNotifications.length === 0) {
        notificationList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications to display</p>
            </div>
        `;
    }
}

function filterNotifications(filter) {
    const notificationItems = document.querySelectorAll('.notification-item');
    
    notificationItems.forEach(item => {
        if (filter === 'all') {
            item.style.display = 'flex';
        } else if (filter === 'unread') {
            item.style.display = item.classList.contains('unread') ? 'flex' : 'none';
        } else {
            item.style.display = item.getAttribute('data-type') === filter ? 'flex' : 'none';
        }
    });
    
    // Show empty state if no notifications match the filter
    const visibleItems = Array.from(notificationItems).filter(item => item.style.display !== 'none');
    const notificationList = document.getElementById('notification-list');
    
    if (visibleItems.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-bell-slash"></i>
            <p>No ${filter === 'all' ? '' : filter} notifications to display</p>
        `;
        
        // Remove any existing empty state
        const existingEmptyState = notificationList.querySelector('.empty-state');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }
        
        notificationList.appendChild(emptyState);
    } else {
        // Remove empty state if there are visible items
        const existingEmptyState = notificationList.querySelector('.empty-state');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }
    }
}

function toggleReadStatus(notificationId) {
    const notifications = JSON.parse(localStorage.getItem('medicalNotifications') || '[]');
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex !== -1) {
        notifications[notificationIndex].read = !notifications[notificationIndex].read;
        localStorage.setItem('medicalNotifications', JSON.stringify(notifications));
        
        // Update UI
        const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        if (notificationItem) {
            if (notifications[notificationIndex].read) {
                notificationItem.classList.remove('unread');
            } else {
                notificationItem.classList.add('unread');
            }
            
            const markReadBtn = notificationItem.querySelector('.mark-read-btn');
            if (markReadBtn) {
                markReadBtn.textContent = notifications[notificationIndex].read ? 'Mark as Unread' : 'Mark as Read';
            }
        }
        
        // Update notifications badge in sidebar
        updateNotificationsBadge();
    }
}

function handleRequestAction(requestId, action) {
    // Update access request status
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    const requestIndex = accessRequests.findIndex(r => r.id === requestId);
    
    if (requestIndex !== -1) {
        accessRequests[requestIndex].status = action;
        accessRequests[requestIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('accessRequests', JSON.stringify(accessRequests));
        
        // Create notification for legal professional
        const request = accessRequests[requestIndex];
        const legalNotifications = JSON.parse(localStorage.getItem('legalNotifications') || '[]');
        
        legalNotifications.push({
            id: `NOTIF-${Date.now()}`,
            type: 'system',
            title: `Access Request ${action.toUpperCase()}`,
            message: `Your request for access to medical records for patient ${request.patientName} has been ${action}.`,
            requestId: requestId,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        localStorage.setItem('legalNotifications', JSON.stringify(legalNotifications));
        
        // Update UI
        alert(`Request ${action} successfully. The legal professional has been notified.`);
        
        // Reload notifications
        loadNotifications();
        
        // Update notifications badge in sidebar
        updateNotificationsBadge();
    }
}

function viewRequestDetails(requestId) {
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    const request = accessRequests.find(r => r.id === requestId);
    
    if (request) {
        // In a real app, this would open a modal with details
        // For now, we'll just show an alert with some basic info
        alert(`
            Request Details:
            
            Patient: ${request.patientName}
            Phone: ${request.patientPhone}
            Hospital: ${request.hospital.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            Case ID: ${request.caseId}
            Case Type: ${request.caseType}
            Reason: ${request.reason}
            Status: ${request.status}
            Requested by: ${request.legalProfessionalName}
        `);
    }
}

function updateNotificationsBadge() {
    // Count unread notifications
    const notifications = JSON.parse(localStorage.getItem('medicalNotifications') || '[]');
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Update badge in sidebar
    const badge = document.querySelector('.sidebar nav ul li:nth-child(2) .badge');
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
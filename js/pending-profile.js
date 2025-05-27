document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch user profile data
        const response = await fetch('/api/auth/profile');
        const profile = await response.json();

        // Update profile information
        document.getElementById('user-name').textContent = profile.name;
        document.getElementById('user-id').textContent = `ID: ${profile.id}`;
        document.getElementById('user-type').textContent = `Type: ${profile.userType}`;
        document.getElementById('user-email').textContent = profile.email;
        document.getElementById('user-phone').textContent = profile.phone;

        // Check approval status and show appropriate message
        if (profile.approvalStatus === 'pending') {
            document.querySelector('.approval-status').innerHTML = `
                <i class="fas fa-clock"></i>
                <p>Waiting for Admin Approval</p>
            `;
        } else if (profile.approvalStatus === 'approved') {
            document.querySelector('.approval-status').innerHTML = `
                <i class="fas fa-check-circle"></i>
                <p>Account Approved</p>
            `;
            document.querySelector('.approval-status').style.background = '#d4edda';
            document.querySelector('.approval-status').style.color = '#155724';
        } else if (profile.approvalStatus === 'rejected') {
            document.querySelector('.approval-status').innerHTML = `
                <i class="fas fa-times-circle"></i>
                <p>Account Rejected</p>
            `;
            document.querySelector('.approval-status').style.background = '#f8d7da';
            document.querySelector('.approval-status').style.color = '#721c24';
        }

    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Error loading profile data', 'error');
    }
});

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

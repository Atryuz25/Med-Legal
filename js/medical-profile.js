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

    // Add event listeners
    document.getElementById('logout').addEventListener('click', handleLogout);
    document.getElementById('edit-profile').addEventListener('click', handleEditProfile);
});

async function loadUserProfile() {
    try {
        const response = await fetch('https://medicolegal.onrender.com/api/auth/login', {
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
        
        // Update profile information
        document.getElementById('user-name').textContent = data.name;
        document.getElementById('full-name').value = data.name;
        document.getElementById('email').value = data.email;
        document.getElementById('phone').value = data.phone;
        document.getElementById('hospital-id').value = data.id;
        
        // Set specialization based on user type
        document.getElementById('specialization').value = data.specialization || 'Not specified';
        document.getElementById('hospital-name').value = data.hospitalName || 'Not specified';
        document.getElementById('department').value = data.department || 'Not specified';
        document.getElementById('experience').value = data.experience || 'Not specified';
        document.getElementById('qualifications').value = data.qualifications || 'Not specified';
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile. Please try again.');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    window.location.href = '/index.html';
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

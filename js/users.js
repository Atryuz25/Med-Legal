// Initialize users if not already present
document.addEventListener('DOMContentLoaded', function() {
    // Check if users exist in localStorage
    if (!localStorage.getItem('users')) {
        // Create sample users
        const sampleUsers = [
            {
                id: 'admin1',
                name: 'Admin User',
                email: 'admin@medlegal.com',
                password: 'admin123',
                userType: 'admin',
                isSuperAdmin: true,
                failedAttempts: 0,
                accountLocked: false
            },
            {
                id: 'doctor1',
                name: 'Dr. Sarah Johnson',
                email: 'sarah@hospital.com',
                password: 'doctor123',
                userType: 'medical',
                hospital: 'General Hospital',
                department: 'Cardiology',
                failedAttempts: 0,
                accountLocked: false
            },
            {
                id: 'lawyer1',
                name: 'Atty. James Wilson',
                email: 'james@legal.com',
                password: 'lawyer123',
                userType: 'legal',
                firm: 'Wilson Legal Associates',
                barId: 'BAR12345',
                failedAttempts: 0,
                accountLocked: false
            },
            {
                id: 'patient1',
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: 'patient123',
                userType: 'patient',
                dateOfBirth: '1985-05-15',
                gender: 'female',
                failedAttempts: 0,
                accountLocked: false
            }
        ];
        
        // Save to localStorage
        localStorage.setItem('users', JSON.stringify(sampleUsers));
    } else {
        // Make sure all users have the required account locking properties
        const users = JSON.parse(localStorage.getItem('users'));
        let needsUpdate = false;
        
        users.forEach(user => {
            if (typeof user.failedAttempts === 'undefined') {
                user.failedAttempts = 0;
                needsUpdate = true;
            }
            if (typeof user.accountLocked === 'undefined') {
                user.accountLocked = false;
                needsUpdate = true;
            }
        });
        
        if (needsUpdate) {
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    
    // Set up event listeners for login page elements if they exist
    const forgotCredentialsLink = document.getElementById('forgot-credentials');
    if (forgotCredentialsLink) {
        forgotCredentialsLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'forgot-credentials.html';
        });
    }
    
    const requestOtpLink = document.getElementById('request-otp');
    if (requestOtpLink) {
        requestOtpLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('OTP functionality will be implemented in a future update.');
        });
    }
});
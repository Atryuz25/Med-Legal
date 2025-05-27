document.addEventListener('DOMContentLoaded', function() {
    const forgotForm = document.getElementById('forgot-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const resetContainer = document.getElementById('reset-container');
    const otpContainer = document.getElementById('otp-container');
    const newPasswordContainer = document.getElementById('new-password-container');
    
    // Handle form submission
    forgotForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userType = document.getElementById('user-type').value;
        const identifier = document.getElementById('identifier').value;
        
        // Validate inputs
        if (!userType || !identifier) {
            showError('Please fill in all required fields');
            return;
        }
        
        // Show loading state
        const submitBtn = forgotForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        try {
            // Try to use the backend API if available
            try {
                const response = await fetch('https://medicolegal.onrender.com/api/auth/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userType, identifier }),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Show OTP input
                    resetContainer.style.display = 'none';
                    otpContainer.style.display = 'block';
                    
                    // Store user info for later
                    sessionStorage.setItem('resetUserType', userType);
                    sessionStorage.setItem('resetIdentifier', identifier);
                    
                    showSuccess('OTP sent to your registered email/phone');
                } else {
                    showError(data.message || 'Failed to process request');
                }
            } catch (error) {
                console.log('Backend API not available, using localStorage for password reset');
                
                // Fallback to localStorage
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                
                // Find user by ID or email
                const user = users.find(u => 
                    (u.id === identifier || u.email === identifier) && 
                    u.userType === userType
                );
                
                if (user) {
                    // Generate a random 6-digit OTP
                    const otp = Math.floor(100000 + Math.random() * 900000).toString();
                    
                    // Store OTP in sessionStorage (in a real app, this would be sent via email/SMS)
                    sessionStorage.setItem('resetOTP', otp);
                    sessionStorage.setItem('resetUserType', userType);
                    sessionStorage.setItem('resetIdentifier', identifier);
                    
                    // Show OTP input
                    resetContainer.style.display = 'none';
                    otpContainer.style.display = 'block';
                    
                    // In a real app, the OTP would be sent to the user's email or phone
                    // For demo purposes, we'll show it in the success message
                    showSuccess(`OTP sent to your registered email/phone. (Demo OTP: ${otp})`);
                } else {
                    showError('No account found with the provided information');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred. Please try again.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
    
    // Handle OTP verification
    const verifyOtpForm = document.getElementById('verify-otp-form');
    verifyOtpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const otp = document.getElementById('otp').value;
        
        // Validate OTP
        if (!otp || otp.length !== 6) {
            showError('Please enter a valid 6-digit OTP');
            return;
        }
        
        // Show loading state
        const submitBtn = verifyOtpForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        
        try {
            // Get stored OTP from sessionStorage
            const storedOtp = sessionStorage.getItem('resetOTP');
            
            if (otp === storedOtp) {
                // OTP verified, show new password form
                otpContainer.style.display = 'none';
                newPasswordContainer.style.display = 'block';
                showSuccess('OTP verified successfully. Please set a new password.');
            } else {
                showError('Invalid OTP. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred. Please try again.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
    
    // Handle new password submission
    const newPasswordForm = document.getElementById('new-password-form');
    newPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate passwords
        if (!newPassword || !confirmPassword) {
            showError('Please fill in all required fields');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (newPassword.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }
        
        // Show loading state
        const submitBtn = newPasswordForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        
        try {
            // Get user info from sessionStorage
            const userType = sessionStorage.getItem('resetUserType');
            const identifier = sessionStorage.getItem('resetIdentifier');
            
            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Find user by ID or email
            const userIndex = users.findIndex(u => 
                (u.id === identifier || u.email === identifier) && 
                u.userType === userType
            );
            
            if (userIndex !== -1) {
                // Update user password
                users[userIndex].password = newPassword;
                
                // Reset failed attempts and unlock account
                users[userIndex].failedAttempts = 0;
                users[userIndex].accountLocked = false;
                delete users[userIndex].lockTime;
                
                // Save back to localStorage
                localStorage.setItem('users', JSON.stringify(users));
                
                // Clear sessionStorage
                sessionStorage.removeItem('resetOTP');
                sessionStorage.removeItem('resetUserType');
                sessionStorage.removeItem('resetIdentifier');
                
                // Show success message
                showSuccess('Password updated successfully! Redirecting to login page...');
                
                // Redirect to login page after a delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            } else {
                showError('User not found. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred. Please try again.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
    
    // Helper functions
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }
    
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }
});

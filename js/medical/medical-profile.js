document.addEventListener('DOMContentLoaded', () => {
    console.log('Medical profile script loaded');
    
    // Get user information from localStorage
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    // Set last login time
    localStorage.setItem('lastLogin', new Date().toISOString());
    
    // Initialize contact information if not present
    if (!localStorage.getItem('userPhone')) {
        localStorage.setItem('userPhone', 'Add your phone number');
    }
    if (!localStorage.getItem('userHospital')) {
        localStorage.setItem('userHospital', 'Add your hospital');
    }
    
    // For development purposes, skip authentication check
    // if (!token || userType !== 'medical') {
    //     window.location.href = '../index.html';
    //     return;
    // }

    // Load user profile
    loadUserProfile();

    // Add event listeners
    const editProfileButton = document.getElementById('edit-profile-btn');
    if (editProfileButton) {
        console.log('Edit profile button found');
        editProfileButton.addEventListener('click', function() {
            console.log('Edit profile button clicked');
            window.handleEditProfile();
        });
        
        // Also add direct onclick handler for extra reliability
        editProfileButton.onclick = function() {
            console.log('Edit profile button clicked via onclick');
            window.handleEditProfile();
        };
    } else {
        console.error('Edit profile button not found');
    }
    
    const logoutButton = document.querySelector('.btn.deny');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
});

async function loadUserProfile() {
    try {
        // Get user data from localStorage
        const userName = localStorage.getItem('userName') || 'User';
        const userEmail = localStorage.getItem('userEmail') || '';
        const userType = localStorage.getItem('userType') || 'medical';
        const userId = localStorage.getItem('userId') || 'MED-001';
        const userPhone = localStorage.getItem('userPhone') || '';
        const userHospital = localStorage.getItem('userHospital') || '';
        
        // Use localStorage data instead of mock data
        const data = {
            name: userName,
            userType: userType,
            id: userId,
            email: userEmail,
            phone: userPhone,
            hospitalName: userHospital,
            stats: {
                recordsUploaded: parseInt(localStorage.getItem('recordsUploaded') || '0'),
                consentsApproved: parseInt(localStorage.getItem('consentsApproved') || '0')
            },
            lastLogin: localStorage.getItem('lastLogin') || new Date().toISOString()
        };
        
        // If no user data in localStorage, set some default values for first-time users
        if (!userName || userName === 'User') {
            // Get the current count of users and increment by 1 for sequential IDs
            const userCount = parseInt(localStorage.getItem('userCount') || '1');
            const formattedId = 'MED-' + userCount.toString().padStart(3, '0');
            
            // Increment the user count for the next user
            localStorage.setItem('userCount', (userCount + 1).toString());
            
            // Store default values in localStorage for first-time users
            localStorage.setItem('userName', 'Medical Staff');
            localStorage.setItem('userEmail', 'your.email@example.com');
            localStorage.setItem('userType', 'medical');
            localStorage.setItem('userId', formattedId);
            localStorage.setItem('userPhone', 'Add your phone number');
            localStorage.setItem('userHospital', 'Add your hospital');
            localStorage.setItem('recordsUploaded', '0');
            localStorage.setItem('consentsApproved', '0');
            localStorage.setItem('lastLogin', new Date().toISOString());
            
            // Update data with newly set values
            data.name = localStorage.getItem('userName');
            data.email = localStorage.getItem('userEmail');
            data.id = formattedId;
            data.phone = localStorage.getItem('userPhone');
            data.hospitalName = localStorage.getItem('userHospital');
        }
        
        // Update profile information in header
        document.querySelector('.profile-info h2').textContent = data.name || 'Medical Staff';
        document.querySelector('.profile-info p:nth-child(2)').innerHTML = `<strong>Role:</strong> ${capitalizeFirstLetter(data.userType)}`;
        document.querySelector('.profile-info p:nth-child(3)').innerHTML = `<strong>ID:</strong> ${data.id}`;
        
        // Update contact details
        document.getElementById('user-email').textContent = data.email || 'Not provided';
        document.getElementById('user-phone').textContent = data.phone || 'Not provided';
        document.getElementById('user-hospital').textContent = data.hospitalName || 'Not provided';
        
        // Update activity stats
        const recordsUploaded = data.stats?.recordsUploaded || 0;
        const consentsApproved = data.stats?.consentsApproved || 0;
        const lastLogin = data.lastLogin ? new Date(data.lastLogin).toLocaleDateString() : new Date().toLocaleDateString();
        
        document.querySelector('.stat-item:nth-child(1) .stat-number').textContent = recordsUploaded;
        document.querySelector('.stat-item:nth-child(2) .stat-number').textContent = consentsApproved;
        document.querySelector('.stat-item:nth-child(3) .stat-number').textContent = lastLogin;
        
    } catch (error) {
        console.error('Error loading profile:', error);
        console.log('Using default profile data instead');
        
        // Set default values if error occurs
        const defaultName = localStorage.getItem('userName') || 'Medical Staff';
        const defaultEmail = localStorage.getItem('userEmail') || 'your.email@example.com';
        const defaultRole = capitalizeFirstLetter(localStorage.getItem('userType') || 'medical');
        
        // Get the current count of users and increment by 1 for sequential IDs
        const userCount = parseInt(localStorage.getItem('userCount') || '1');
        const defaultId = 'MED-' + userCount.toString().padStart(3, '0');
        localStorage.setItem('userId', defaultId);
        
        // Increment the user count for the next user
        localStorage.setItem('userCount', (userCount + 1).toString());
        
        const defaultPhone = localStorage.getItem('userPhone') || 'Add your phone number';
        const defaultHospital = localStorage.getItem('userHospital') || 'Add your hospital';
        
        document.querySelector('.profile-info h2').textContent = defaultName;
        document.querySelector('.profile-info p:nth-child(2)').innerHTML = `<strong>Role:</strong> ${defaultRole}`;
        document.querySelector('.profile-info p:nth-child(3)').innerHTML = `<strong>ID:</strong> ${defaultId}`;
        
        document.getElementById('user-email').textContent = defaultEmail;
        document.getElementById('user-phone').textContent = defaultPhone;
        document.getElementById('user-hospital').textContent = defaultHospital;
        
        document.querySelector('.stat-item:nth-child(1) .stat-number').textContent = localStorage.getItem('recordsUploaded') || '0';
        document.querySelector('.stat-item:nth-child(2) .stat-number').textContent = localStorage.getItem('consentsApproved') || '0';
        document.querySelector('.stat-item:nth-child(3) .stat-number').textContent = new Date().toLocaleDateString();
        
        // Store these values in localStorage for consistency
        localStorage.setItem('userName', defaultName);
        localStorage.setItem('userEmail', defaultEmail);
        localStorage.setItem('userType', defaultRole.toLowerCase());
        localStorage.setItem('userId', defaultId);
        localStorage.setItem('userPhone', defaultPhone);
        localStorage.setItem('userHospital', defaultHospital);
        localStorage.setItem('lastLogin', new Date().toISOString());
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isSuperAdmin');
    window.location.href = '../index.html';
}

// Make the function globally accessible
window.handleEditProfile = function() {
    // Remove any existing modals first to prevent duplicates
    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(m => m.remove());
    console.log('Edit profile function called');
    
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        display: block;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        overflow: auto;
    `;
    
    // Get current values
    const name = document.querySelector('.profile-info h2').textContent;
    const email = document.getElementById('user-email').textContent;
    const phone = document.getElementById('user-phone').textContent;
    const hospital = document.getElementById('user-hospital').textContent;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #1a1a2e;
        margin: 10% auto;
        padding: 30px;
        border-radius: 12px;
        width: 80%;
        max-width: 600px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    `;
    
    modalContent.innerHTML = `
        <span class="close" style="color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
        <h2 style="margin-top: 0; color: white; font-size: 1.8rem; margin-bottom: 30px;">Edit Profile</h2>
        <form id="edit-profile-form">
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; color: white; font-weight: 500;">Full Name</label>
                <input type="text" id="edit-name" name="name" value="${name}" required style="width: 100%; padding: 12px 15px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(255, 255, 255, 0.05); color: white;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; color: white; font-weight: 500;">Email</label>
                <input type="email" id="edit-email" name="email" value="${email}" required style="width: 100%; padding: 12px 15px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(255, 255, 255, 0.05); color: white;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; color: white; font-weight: 500;">Phone</label>
                <input type="tel" id="edit-phone" name="phone" value="${phone}" required style="width: 100%; padding: 12px 15px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(255, 255, 255, 0.05); color: white;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; color: white; font-weight: 500;">Hospital</label>
                <input type="text" id="edit-hospital" name="hospitalName" value="${hospital}" style="width: 100%; padding: 12px 15px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(255, 255, 255, 0.05); color: white;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; color: white; font-weight: 500;">New Password (leave blank to keep current)</label>
                <input type="password" id="edit-password" name="password" style="width: 100%; padding: 12px 15px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(255, 255, 255, 0.05); color: white;">
            </div>
            <div style="display: flex; justify-content: space-between;">
                <button type="button" class="cancel-btn" style="padding: 12px 20px; border: none; border-radius: 8px; background: #64748b; color: white; cursor: pointer; font-weight: 500; font-size: 1rem;">Cancel</button>
                <button type="submit" style="padding: 12px 20px; border: none; border-radius: 8px; background: #3b82f6; color: white; cursor: pointer; font-weight: 500; font-size: 1rem;">Save Changes</button>
            </div>
        </form>
    `;
    
    // Add modal to body
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking on X
    modal.querySelector('.close').addEventListener('click', function() {
        modal.remove();
    });
    
    // Close modal when clicking on Cancel button
    modal.querySelector('.cancel-btn').addEventListener('click', function() {
        modal.remove();
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    });
    
    // Handle form submission
    modal.querySelector('#edit-profile-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('edit-name').value,
            email: document.getElementById('edit-email').value,
            phone: document.getElementById('edit-phone').value,
            hospitalName: document.getElementById('edit-hospital').value
        };
        
        // Only include password if it's not empty
        const password = document.getElementById('edit-password').value;
        if (password) {
            formData.password = password;
        }
        
        try {
            // Show loading state on button
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Saving...';
            
            // Save the form data directly to localStorage
            console.log('Profile update data:', formData);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Save all form data to localStorage
            localStorage.setItem('userName', formData.name);
            localStorage.setItem('userEmail', formData.email);
            localStorage.setItem('userPhone', formData.phone);
            localStorage.setItem('userHospital', formData.hospitalName);
            
            // If password was provided, save it too (in a real app, this would be handled securely)
            if (formData.password) {
                localStorage.setItem('userPassword', formData.password);
            }
            
            // Create result object with existing ID and userType
            const result = {
                ...formData,
                id: localStorage.getItem('userId'),
                userType: localStorage.getItem('userType') || 'medical'
            };
            
            // Update localStorage with new user data
            localStorage.setItem('userName', result.name);
            localStorage.setItem('userEmail', result.email);
            
            // Refresh profile data
            loadUserProfile();
            
            // Close modal
            modal.remove();
            
            // Show success message
            alert('Profile updated successfully!');
            
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    });
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // Get admin's profile
        const response = await fetch('https://medicolegal.onrender.com/api/auth/login', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }
        
        const profile = await response.json();
        
        // Check if user is superadmin
        if (!profile.isSuperAdmin) {
            window.location.href = 'admin-dashboard.html';
            return;
        }
        
        document.getElementById('admin-name').textContent = profile.name;

        // Fetch pending users
        fetchPendingUsers();
        
        // Fetch statistics
        fetchStatistics();
        
        // Set up navigation
        setupNavigation();
        
        // Set up event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Error loading dashboard data', 'error');
    }
});

// Fetch pending users
async function fetchPendingUsers() {
    try {
        const token = localStorage.getItem('token');
        const pendingResponse = await fetch('http://https://medicolegal.onrender.com/api/auth/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!pendingResponse.ok) {
            throw new Error('Failed to fetch pending users');
        }
        
        const data = await pendingResponse.json();
        populatePendingUsers(data.pendingUsers);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        document.getElementById('pending-users-list').innerHTML = 
            '<p class="error">Failed to load pending users. Please try again.</p>';
    }
}

// Fetch all statistics
async function fetchStatistics() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://https://medicolegal.onrender.com/api/auth/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        
        const users = await response.json();
        
        // Update statistics
        document.getElementById('total-users').textContent = users.length;
        
        const pendingUsers = users.filter(user => user.approvalStatus === 'pending').length;
        document.getElementById('pending-users').textContent = pendingUsers;
        
        const approvedUsers = users.filter(user => user.approvalStatus === 'approved').length;
        document.getElementById('approved-users').textContent = approvedUsers;
        
        const adminUsers = users.filter(user => user.userType === 'admin').length;
        document.getElementById('admin-users').textContent = adminUsers;
        
    } catch (error) {
        console.error('Error fetching statistics:', error);
        document.getElementById('total-users').textContent = 'Error';
        document.getElementById('pending-users').textContent = 'Error';
        document.getElementById('approved-users').textContent = 'Error';
        document.getElementById('admin-users').textContent = 'Error';
    }
}

// Populate pending users
function populatePendingUsers(users) {
    const listContainer = document.getElementById('pending-users-list');
    listContainer.innerHTML = '';

    if (!users || users.length === 0) {
        listContainer.innerHTML = '<p class="no-users">No pending users to approve</p>';
        return;
    }

    users.forEach(user => {
        const userCard = createPendingUserCard(user);
        listContainer.appendChild(userCard);
    });
}

// Create pending user card
function createPendingUserCard(user) {
    const card = document.createElement('div');
    card.className = 'pending-user-card';
    
    card.innerHTML = `
        <div class="user-info">
            <h3>${user.name}</h3>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>User Type:</strong> ${user.userType}</p>
            <p><strong>Phone:</strong> ${user.phone}</p>
            <p><strong>Registered:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
        </div>
        <div class="action-buttons">
            <button class="approve-btn" data-user-id="${user._id}">
                <i class="fas fa-check"></i> Approve
            </button>
            <button class="reject-btn" data-user-id="${user._id}">
                <i class="fas fa-times"></i> Reject
            </button>
        </div>
    `;

    return card;
}

// Handle approval or rejection
async function handleApproval(userId, approve) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://https://medicolegal.onrender.com/api/auth/admin/${approve ? 'approve' : 'reject'}/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(`User ${approve ? 'approved' : 'rejected'} successfully`, 'success');
            // Refresh the pending users and statistics
            fetchPendingUsers();
            fetchStatistics();
        } else {
            showNotification(result.message || 'Error processing request', 'error');
        }
    } catch (error) {
        console.error('Error handling approval:', error);
        showNotification('Error processing request', 'error');
    }
}

// Set up navigation
function setupNavigation() {
    const manageUsersLink = document.getElementById('manage-users-link');
    const manageAdminsLink = document.getElementById('manage-admins-link');
    const systemSettingsLink = document.getElementById('system-settings-link');
    const logoutLink = document.getElementById('logout-link');
    
    // Dashboard sections
    const pendingUsersSection = document.getElementById('pending-users-section');
    const manageAdminsSection = document.getElementById('manage-admins-section');
    const systemSettingsSection = document.getElementById('system-settings-section');
    
    // Hide all sections except pending users
    manageAdminsSection.classList.add('hidden');
    systemSettingsSection.classList.add('hidden');
    
    // Manage users link (show pending users section)
    manageUsersLink.addEventListener('click', (e) => {
        e.preventDefault();
        pendingUsersSection.classList.remove('hidden');
        manageAdminsSection.classList.add('hidden');
        systemSettingsSection.classList.add('hidden');
        
        // Update active link
        document.querySelector('.nav-links li.active').classList.remove('active');
        manageUsersLink.parentElement.classList.add('active');
    });
    
    // Manage admins link
    manageAdminsLink.addEventListener('click', (e) => {
        e.preventDefault();
        pendingUsersSection.classList.add('hidden');
        manageAdminsSection.classList.remove('hidden');
        systemSettingsSection.classList.add('hidden');
        
        // Update active link
        document.querySelector('.nav-links li.active').classList.remove('active');
        manageAdminsLink.parentElement.classList.add('active');
        
        // Load admin users
        loadAdminUsers();
    });
    
    // System settings link
    systemSettingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        pendingUsersSection.classList.add('hidden');
        manageAdminsSection.classList.add('hidden');
        systemSettingsSection.classList.remove('hidden');
        
        // Update active link
        document.querySelector('.nav-links li.active').classList.remove('active');
        systemSettingsLink.parentElement.classList.add('active');
    });
    
    // Logout link
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        window.location.href = 'index.html';
    });
}

// Load admin users
async function loadAdminUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://https://medicolegal.onrender.com/api/auth/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        
        const users = await response.json();
        const adminUsers = users.filter(user => user.userType === 'admin');
        
        const adminsList = document.getElementById('admins-list');
        adminsList.innerHTML = '';
        
        if (adminUsers.length === 0) {
            adminsList.innerHTML = '<p class="no-users">No admin users found</p>';
            return;
        }
        
        adminUsers.forEach(admin => {
            const adminCard = document.createElement('div');
            adminCard.className = 'admin-card';
            
            adminCard.innerHTML = `
                <div class="admin-info">
                    <h3>${admin.name}</h3>
                    <p><strong>ID:</strong> ${admin.id}</p>
                    <p><strong>Email:</strong> ${admin.email}</p>
                    <p><strong>Phone:</strong> ${admin.phone}</p>
                    <p><strong>Super Admin:</strong> ${admin.isSuperAdmin ? 'Yes' : 'No'}</p>
                </div>
                <div class="action-buttons">
                    <button class="edit-btn" data-user-id="${admin._id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${admin.isSuperAdmin ? '' : `
                    <button class="delete-btn" data-user-id="${admin._id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    `}
                </div>
            `;
            
            adminsList.appendChild(adminCard);
        });
        
    } catch (error) {
        console.error('Error loading admin users:', error);
        document.getElementById('admins-list').innerHTML = 
            '<p class="error">Failed to load admin users. Please try again.</p>';
    }
}

// Set up event listeners
function setupEventListeners() {
    // Refresh pending users button
    document.getElementById('refresh-pending').addEventListener('click', () => {
        fetchPendingUsers();
    });
    
    // Add admin button
    document.getElementById('add-admin-btn').addEventListener('click', () => {
        document.getElementById('add-admin-modal').style.display = 'block';
    });
    
    // Close modal button
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('add-admin-modal').style.display = 'none';
    });
    
    // Add admin form submission
    document.getElementById('add-admin-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const adminId = document.getElementById('admin-id').value;
        const adminName = document.getElementById('admin-name-input').value;
        const adminEmail = document.getElementById('admin-email').value;
        const adminPhone = document.getElementById('admin-phone').value;
        const adminPassword = document.getElementById('admin-password').value;
        const isSuperAdmin = document.getElementById('admin-super').value === 'true';
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://https://medicolegal.onrender.com/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userType: 'admin',
                    id: adminId,
                    password: adminPassword,
                    name: adminName,
                    email: adminEmail,
                    phone: adminPhone,
                    isSuperAdmin: isSuperAdmin,
                    approved: true,
                    approvalStatus: 'approved'
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showNotification('Admin user created successfully', 'success');
                document.getElementById('add-admin-modal').style.display = 'none';
                document.getElementById('add-admin-form').reset();
                loadAdminUsers();
                fetchStatistics();
            } else {
                showNotification(result.message || 'Error creating admin user', 'error');
            }
        } catch (error) {
            console.error('Error creating admin user:', error);
            showNotification('Error creating admin user', 'error');
        }
    });
    
    // Save settings button
    document.getElementById('save-settings').addEventListener('click', () => {
        const systemName = document.getElementById('system-name').value;
        const autoApprove = document.getElementById('auto-approve').value;
        
        // Here you would typically save these settings to the server
        showNotification('Settings saved successfully', 'success');
    });
    
    // Event delegation for approve/reject buttons
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('approve-btn')) {
            await handleApproval(e.target.dataset.userId, true);
        } else if (e.target.classList.contains('reject-btn')) {
            await handleApproval(e.target.dataset.userId, false);
        }
    });
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
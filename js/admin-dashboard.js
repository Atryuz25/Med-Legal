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
        
        // Check if user is admin
        if (profile.userType !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
        
        // If user is superadmin, redirect to superadmin dashboard
        if (profile.isSuperAdmin) {
            window.location.href = 'superadmin-dashboard.html';
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
        
    } catch (error) {
        console.error('Error fetching statistics:', error);
        document.getElementById('total-users').textContent = 'Error';
        document.getElementById('pending-users').textContent = 'Error';
        document.getElementById('approved-users').textContent = 'Error';
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
    const reportsLink = document.getElementById('reports-link');
    const profileLink = document.getElementById('profile-link');
    const logoutLink = document.getElementById('logout-link');
    
    // Dashboard sections
    const pendingUsersSection = document.getElementById('pending-users-section');
    const manageUsersSection = document.getElementById('manage-users-section');
    const reportsSection = document.getElementById('reports-section');
    const profileSection = document.getElementById('profile-section');
    
    // Hide all sections except pending users
    manageUsersSection.classList.add('hidden');
    reportsSection.classList.add('hidden');
    profileSection.classList.add('hidden');
    
    // Manage users link
    manageUsersLink.addEventListener('click', (e) => {
        e.preventDefault();
        pendingUsersSection.classList.add('hidden');
        manageUsersSection.classList.remove('hidden');
        reportsSection.classList.add('hidden');
        profileSection.classList.add('hidden');
        
        // Update active link
        document.querySelector('.nav-links li.active').classList.remove('active');
        manageUsersLink.parentElement.classList.add('active');
        
        // Load all users
        loadAllUsers();
    });
    
    // Reports link
    reportsLink.addEventListener('click', (e) => {
        e.preventDefault();
        pendingUsersSection.classList.add('hidden');
        manageUsersSection.classList.add('hidden');
        reportsSection.classList.remove('hidden');
        profileSection.classList.add('hidden');
        
        // Update active link
        document.querySelector('.nav-links li.active').classList.remove('active');
        reportsLink.parentElement.classList.add('active');
    });
    
    // Profile link
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        pendingUsersSection.classList.add('hidden');
        manageUsersSection.classList.add('hidden');
        reportsSection.classList.add('hidden');
        profileSection.classList.remove('hidden');
        
        // Update active link
        document.querySelector('.nav-links li.active').classList.remove('active');
        profileLink.parentElement.classList.add('active');
        
        // Load profile data
        loadProfileData();
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

// Load all users
async function loadAllUsers() {
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
        
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '';
        
        if (users.length === 0) {
            usersList.innerHTML = '<p class="no-users">No users found</p>';
            return;
        }
        
        // Create a table for users
        const table = document.createElement('table');
        table.className = 'users-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Email</th>
                <th>User Type</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        users.forEach(user => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${user.name}</td>
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.userType}</td>
                <td>
                    <span class="status-badge ${user.approvalStatus}">
                        ${user.approvalStatus}
                    </span>
                </td>
                <td>
                    <button class="view-btn" data-user-id="${user._id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${user.approvalStatus === 'pending' ? `
                    <button class="approve-btn" data-user-id="${user._id}">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="reject-btn" data-user-id="${user._id}">
                        <i class="fas fa-times"></i>
                    </button>
                    ` : ''}
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        usersList.appendChild(table);
        
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('users-list').innerHTML = 
            '<p class="error">Failed to load users. Please try again.</p>';
    }
}

// Load profile data
async function loadProfileData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://medicolegal.onrender.com/api/auth/login', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }
        
        const profile = await response.json();
        
        document.getElementById('profile-name').value = profile.name;
        document.getElementById('profile-email').value = profile.email;
        document.getElementById('profile-phone').value = profile.phone;
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Error loading profile data', 'error');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Refresh pending users button
    document.getElementById('refresh-pending').addEventListener('click', () => {
        fetchPendingUsers();
    });
    
    // Update profile button
    document.getElementById('update-profile').addEventListener('click', async () => {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const phone = document.getElementById('profile-phone').value;
        
        // Validate passwords
        if (newPassword && newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        
        // Here you would typically update the profile on the server
        showNotification('Profile updated successfully', 'success');
    });
    
    // Search button
    document.getElementById('search-btn').addEventListener('click', () => {
        const searchTerm = document.getElementById('user-search').value;
        // Here you would typically filter users based on the search term
        showNotification('Search functionality will be implemented soon', 'info');
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
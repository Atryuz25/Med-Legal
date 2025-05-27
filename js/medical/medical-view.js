document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    
    // DOM elements
    const recordsList = document.getElementById('records-list');
    const loadingSpinner = document.getElementById('loading-spinner');
    const noRecords = document.getElementById('no-records');
    const searchInput = document.getElementById('search-records');
    const searchBtn = document.getElementById('search-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const filterCaseType = document.getElementById('filter-case-type');
    const filterDate = document.getElementById('filter-date');
    const filterStatus = document.getElementById('filter-status');
    const recordModal = document.getElementById('record-modal');
    const closeModal = document.querySelector('.close');
    const downloadPdfBtn = document.getElementById('download-pdf');
    const editRecordBtn = document.getElementById('edit-record');
    const deleteRecordBtn = document.getElementById('delete-record');
    
    // Current selected record ID
    let currentRecordId = null;
    
    // Get medical records from localStorage
    const medicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    
    // Fetch records on page load
    fetchRecords();
    
    // Event listeners
    refreshBtn.addEventListener('click', fetchRecords);
    searchBtn.addEventListener('click', applyFilters);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    filterCaseType.addEventListener('change', applyFilters);
    filterDate.addEventListener('change', applyFilters);
    filterStatus.addEventListener('change', applyFilters);
    
    closeModal.addEventListener('click', function() {
        recordModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === recordModal) {
            recordModal.style.display = 'none';
        }
    });
    
    downloadPdfBtn.addEventListener('click', function() {
        if (currentRecordId) {
            downloadRecordPdf(currentRecordId);
        }
    });
    
    editRecordBtn.addEventListener('click', function() {
        if (currentRecordId) {
            window.location.href = `medical-upload.html?edit=${currentRecordId}`;
        }
    });
    
    deleteRecordBtn.addEventListener('click', function() {
        if (currentRecordId) {
            if (confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
                deleteRecord(currentRecordId);
            }
        }
    });
    
    // Fetch records from localStorage
    function fetchRecords() {
        try {
            showLoading();
            
            if (medicalRecords.length === 0) {
                showNoRecords();
            } else {
                displayRecords(medicalRecords);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
            showError('Failed to load records. Please try again later.');
        } finally {
            hideLoading();
        }
    }
    
    // Display records in the UI
    function displayRecords(records) {
        recordsList.innerHTML = '';
        noRecords.classList.add('hidden');
        recordsList.classList.remove('hidden');
        
        records.forEach(record => {
            const recordCard = createRecordCard(record);
            recordsList.appendChild(recordCard);
        });
    }
    
    // Create a record card element
    function createRecordCard(record) {
        const card = document.createElement('div');
        card.className = 'record-card';
        card.dataset.id = record.id;
        
        // Format dates
        const createdDate = new Date(record.uploadDate).toLocaleDateString();
        const recordDate = new Date(record.recordDate).toLocaleDateString();
        
        card.innerHTML = `
            <div class="record-header">
                <h3 class="record-title">${record.patientName}</h3>
                <span class="record-status approved">Approved</span>
            </div>
            <div class="record-info">
                <p><i class="fas fa-hashtag"></i> Record ID: ${record.id}</p>
                <p><i class="fas fa-stethoscope"></i> Type: ${capitalizeFirstLetter(record.recordType)}</p>
                <p><i class="fas fa-calendar-alt"></i> Date: ${recordDate}</p>
                <p><i class="fas fa-clock"></i> Created: ${createdDate}</p>
            </div>
            <div class="record-actions">
                <button class="view-btn" data-id="${record.id}"><i class="fas fa-eye"></i> View</button>
                <button class="edit-btn" data-id="${record.id}"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete-btn" data-id="${record.id}"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `;
        
        // Add event listeners
        card.querySelector('.view-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            viewRecordDetails(record.id);
        });
        
        card.querySelector('.edit-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            window.location.href = `medical-upload.html?edit=${record.id}`;
        });
        
        card.querySelector('.delete-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
                deleteRecord(record.id);
            }
        });
        
        // Make the whole card clickable
        card.addEventListener('click', function() {
            viewRecordDetails(record.id);
        });
        
        return card;
    }
    
    // View record details
    function viewRecordDetails(recordId) {
        try {
            // Find record in localStorage
            const record = medicalRecords.find(r => r.id === recordId);
            
            if (!record) {
                throw new Error('Record not found');
            }
            
            currentRecordId = record.id;
            
            // Format dates
            const createdDate = new Date(record.uploadDate).toLocaleDateString();
            const recordDate = new Date(record.recordDate).toLocaleDateString();
            
            // Populate modal with record details
            const recordDetails = document.querySelector('.record-details');
            recordDetails.innerHTML = `
                <h3>Patient Information</h3>
                <div>
                    <strong>Patient Name</strong>
                    <p>${record.patientName}</p>
                </div>
                <div>
                    <strong>Record Type</strong>
                    <p>${capitalizeFirstLetter(record.recordType)}</p>
                </div>
                <div>
                    <strong>Record Date</strong>
                    <p>${recordDate}</p>
                </div>
                <div>
                    <strong>Hospital</strong>
                    <p>${record.hospital}</p>
                </div>
                <div>
                    <strong>Doctor</strong>
                    <p>${record.doctor}</p>
                </div>
                <div>
                    <strong>Upload Date</strong>
                    <p>${createdDate}</p>
                </div>
                
                <h3>Record Content</h3>
                <div class="full-width">
                    <p>${record.content}</p>
                </div>
                
                ${record.fileData ? `
                <h3>Attached File</h3>
                <div class="full-width">
                    <embed src="${record.fileData}" type="application/pdf" width="100%" height="400px">
                </div>
                ` : ''}
            `;
            
            // Show modal
            recordModal.style.display = 'block';
            
        } catch (error) {
            console.error('Error fetching record details:', error);
            showNotification('Failed to load record details', 'error');
        }
    }
    
    // Download record PDF
    function downloadRecordPdf(recordId) {
        try {
            // Find record in localStorage
            const record = medicalRecords.find(r => r.id === recordId);
            
            if (!record) {
                throw new Error('Record not found');
            }
            
            if (record.fileData) {
                // If there's a file attached, download it
                const link = document.createElement('a');
                link.href = record.fileData;
                link.download = `${record.patientName}_medical_record.pdf`;
                link.click();
                showNotification('File downloaded successfully', 'success');
            } else {
                // Create a text file with the record details
                const recordText = `
Patient Name: ${record.patientName}
Record Type: ${capitalizeFirstLetter(record.recordType)}
Record Date: ${new Date(record.recordDate).toLocaleDateString()}
Hospital: ${record.hospital}
Doctor: ${record.doctor}
Upload Date: ${new Date(record.uploadDate).toLocaleDateString()}

Record Content:
${record.content}
                `;
                
                const blob = new Blob([recordText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${record.patientName}_medical_record.txt`;
                link.click();
                URL.revokeObjectURL(url);
                showNotification('Record downloaded as text file', 'success');
            }
        } catch (error) {
            console.error('Error downloading record:', error);
            showNotification('Failed to download record', 'error');
        }
    }
    
    // Delete record
    function deleteRecord(recordId) {
        try {
            // Find record index in localStorage
            const recordIndex = medicalRecords.findIndex(r => r.id === recordId);
            
            if (recordIndex === -1) {
                throw new Error('Record not found');
            }
            
            // Remove record from array
            medicalRecords.splice(recordIndex, 1);
            
            // Update localStorage
            localStorage.setItem('medicalRecords', JSON.stringify(medicalRecords));
            
            // Close modal if open
            recordModal.style.display = 'none';
            
            // Refresh records
            fetchRecords();
            
            showNotification('Record deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting record:', error);
            showNotification('Failed to delete record', 'error');
        }
    }
    
    // Apply filters
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const caseType = filterCaseType.value;
        const dateFilter = filterDate.value;
        const statusFilter = filterStatus.value;
        
        // Get all record cards
        const cards = recordsList.querySelectorAll('.record-card');
        
        // If no cards, show no records message
        if (cards.length === 0) {
            showNoRecords();
            return;
        }
        
        let visibleCount = 0;
        
        cards.forEach(card => {
            const title = card.querySelector('.record-title').textContent.toLowerCase();
            const recordId = card.querySelector('.record-info p:nth-child(1)').textContent.toLowerCase();
            const recordType = card.querySelector('.record-info p:nth-child(2)').textContent.toLowerCase();
            const status = card.querySelector('.record-status').textContent.toLowerCase();
            const date = card.querySelector('.record-info p:nth-child(3)').textContent;
            
            // Check if card matches all filters
            const matchesSearch = title.includes(searchTerm) || 
                                recordId.includes(searchTerm) || 
                                recordType.includes(searchTerm);
            
            const matchesCaseType = caseType === '' || recordType.includes(caseType.toLowerCase());
            
            const matchesStatus = statusFilter === '' || status === statusFilter.toLowerCase();
            
            const matchesDate = dateFilter === '' || matchesDateFilter(date, dateFilter);
            
            // Show or hide card based on filters
            if (matchesSearch && matchesCaseType && matchesStatus && matchesDate) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // If no visible cards, show no records message
        if (visibleCount === 0) {
            noRecords.classList.remove('hidden');
            noRecords.querySelector('p').textContent = 'No records match your filters';
        } else {
            noRecords.classList.add('hidden');
        }
    }
    
    // Check if date matches filter
    function matchesDateFilter(dateStr, filter) {
        const today = new Date();
        const date = new Date(dateStr);
        
        switch (filter) {
            case 'today':
                return date.toDateString() === today.toDateString();
            case 'week':
                const weekAgo = new Date();
                weekAgo.setDate(today.getDate() - 7);
                return date >= weekAgo;
            case 'month':
                const monthAgo = new Date();
                monthAgo.setMonth(today.getMonth() - 1);
                return date >= monthAgo;
            case 'year':
                const yearAgo = new Date();
                yearAgo.setFullYear(today.getFullYear() - 1);
                return date >= yearAgo;
            default:
                return true;
        }
    }
    
    // Show loading spinner
    function showLoading() {
        loadingSpinner.classList.remove('hidden');
        recordsList.classList.add('hidden');
        noRecords.classList.add('hidden');
    }
    
    // Hide loading spinner
    function hideLoading() {
        loadingSpinner.classList.add('hidden');
    }
    
    // Show no records message
    function showNoRecords() {
        recordsList.classList.add('hidden');
        noRecords.classList.remove('hidden');
        noRecords.querySelector('p').textContent = 'No records found';
    }
    
    // Show error message
    function showError(message) {
        recordsList.classList.add('hidden');
        noRecords.classList.remove('hidden');
        noRecords.querySelector('p').textContent = message;
    }
    
    // Show notification
    function showNotification(message, type) {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <p>${message}</p>
            </div>
            <button class="close-notification"><i class="fas fa-times"></i></button>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Add event listener to close button
        notification.querySelector('.close-notification').addEventListener('click', function() {
            notification.remove();
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});
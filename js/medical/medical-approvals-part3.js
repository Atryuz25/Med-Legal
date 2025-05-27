// Function to view document
function viewDocument(requestId, docType) {
    // Get access requests from localStorage
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Find the request
    const request = accessRequests.find(r => r.id === requestId);
    
    if (!request) {
        alert('Request not found');
        return;
    }
    
    let fileName = '';
    let fileContent = '';
    
    // Get the appropriate file data based on document type
    switch(docType) {
        case 'advocate-license':
            fileName = request.advocateLicenseName;
            fileContent = request.advocateLicenseContent || '';
            break;
        case 'purpose-document':
            fileName = request.purposeDocumentName;
            fileContent = request.purposeDocumentContent || '';
            break;
        case 'court-order':
            fileName = request.courtOrderDocumentName;
            fileContent = request.courtOrderDocumentContent || '';
            break;
    }
    
    if (!fileName) {
        alert('Document not found');
        return;
    }
    
    // Create an iframe to display the PDF
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    // Create a blob URL for the PDF content
    const blob = new Blob([fileContent || 'Document content not available'], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Create a new window for the document viewer
    const viewerWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Create the document viewer HTML
    const viewerHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${fileName} - Document Viewer</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f5f5f5;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                
                .viewer-header {
                    background-color: #1e293b;
                    color: white;
                    padding: 10px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .viewer-title {
                    margin: 0;
                    font-size: 18px;
                }
                
                .viewer-controls {
                    display: flex;
                    gap: 10px;
                }
                
                .viewer-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    border-radius: 4px;
                    padding: 5px 10px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .viewer-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                
                .document-container {
                    flex: 1;
                    overflow: hidden;
                }
                
                .document-frame {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
            </style>
        </head>
        <body>
            <div class="viewer-header">
                <h1 class="viewer-title">${fileName}</h1>
                <div class="viewer-controls">
                    <button class="viewer-btn" onclick="window.print()">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button class="viewer-btn" onclick="downloadFile()">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="viewer-btn" onclick="window.close()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
            <div class="document-container">
                <object data="${blobUrl}" type="application/pdf" class="document-frame">
                    <embed src="${blobUrl}" type="application/pdf" class="document-frame">
                        <p>This browser does not support embedded PDFs. Please <a href="${blobUrl}" download="${fileName}">download the PDF</a> to view it.</p>
                    </embed>
                </object>
            </div>
            <script>
                function downloadFile() {
                    const link = document.createElement('a');
                    link.href = "${blobUrl}";
                    link.download = "${fileName}";
                    link.click();
                }
            </script>
        </body>
        </html>
    `;
    
    // Write the HTML to the new window
    viewerWindow.document.write(viewerHTML);
    viewerWindow.document.close();
}

// Function to download document
function downloadDocument(requestId, docType) {
    // Get access requests from localStorage
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Find the request
    const request = accessRequests.find(r => r.id === requestId);
    
    if (!request) {
        alert('Request not found');
        return;
    }
    
    let fileName = '';
    let fileContent = '';
    
    // Get the appropriate file data based on document type
    switch(docType) {
        case 'advocate-license':
            fileName = request.advocateLicenseName;
            fileContent = request.advocateLicenseContent || '';
            break;
        case 'purpose-document':
            fileName = request.purposeDocumentName;
            fileContent = request.purposeDocumentContent || '';
            break;
        case 'court-order':
            fileName = request.courtOrderDocumentName;
            fileContent = request.courtOrderDocumentContent || '';
            break;
    }
    
    if (!fileName) {
        alert('Document not found');
        return;
    }
    
    // Create a blob from the file content
    const blob = new Blob([fileContent || 'Document content not available'], { type: 'application/pdf' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    
    // Append to the document, click it, and remove it
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Revoke the URL to free up memory
    URL.revokeObjectURL(url);
}
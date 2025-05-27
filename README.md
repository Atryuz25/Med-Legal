# MedicoLegal Application

## Overview
MedicoLegal is a web application that facilitates secure sharing of medical records between healthcare providers and legal professionals.

## Setup Instructions

### Frontend
The frontend is a static HTML/CSS/JavaScript application that connects to the backend API.

1. Open the application in a web browser
2. The application is configured to use the hosted backend at https://medicolegal.onrender.com

### Backend (Optional - for local development)
If you want to run the backend locally:

1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Start the server: `npm start`
4. The server will try to use port 3000 or another available port

## Authentication
- The application uses JWT for authentication
- Default login credentials are available in the localStorage fallback

## Features
- Medical staff can upload and manage patient records
- Legal professionals can request access to medical records
- Patients can view their records and approve/deny access requests
- Admins can manage users and system settings

## API Endpoints
The backend API is hosted at https://medicolegal.onrender.com with the following endpoints:
- `/api/auth/login` - User authentication
- `/api/auth/profile` - Get user profile
- `/api/medical/*` - Medical record operations

## Notes
- The application uses localStorage as a fallback when the backend is not available
- For production use, ensure proper security measures are implemented
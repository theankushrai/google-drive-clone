# React + TypeScript + Vite

A Google Drive clone built with React, TypeScript, Node.js, and AWS S3 with user-specific file management.

## Features

- 🔐 User Authentication with Firebase
- 📤 File Upload with progress tracking
- 📂 File organization by user
- 🗑️ Secure file deletion
- 🔍 File listing with metadata
- 🔄 Real-time updates (coming soon)
- 🔗 File sharing (coming soon)

## Tech Stack

- **Frontend**: React, TypeScript, Vite, React Bootstrap
- **Backend**: Node.js, Express, TypeScript
- **Database**: AWS DynamoDB
- **Storage**: AWS S3
- **Authentication**: Firebase Authentication

## Getting Started

### Prerequisites

- Node.js 16+ and npm 8+
- AWS Account with S3 and DynamoDB access
- Firebase project for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/google-drive-clone.git
   cd google-drive-clone
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Set up environment variables**
   - Copy `.env.example` to `.env` in both root and backend directories
   - Update the values with your configuration

5. **Set up Firebase Admin**
   - Download your Firebase Admin SDK private key
   - Save it as `serviceAccountKey.json` in the backend directory

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server** (in a new terminal)
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

## Environment Variables

### Frontend (`.env` in root)

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
    ...reactDom.configs.recommended.rules,
  },
})
```

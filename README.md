# 🌐 Google Drive Clone 🚀
A full-stack file storage solution with real-time sync and secure cloud storage

---

## 📖 Overview

This project is a **MERN stack** (MongoDB (DynamoDB), Express, React, Node.js) application that replicates core Google Drive functionality. It allows users to securely upload, store, manage, and share files with a clean, intuitive interface. Built with modern web technologies and best practices in mind.

---

## ✨ Features

- 🔐 **Secure Authentication**
  - Email/Password signup & login
  - Google OAuth integration
  - Protected routes and JWT-based sessions

- ☁️ **File Management**
  - Upload multiple files
  - Preview images and documents
  - Download files with one click
  - Delete files securely
  - Real-time file listing

- 🎨 **Modern UI/UX**
  - Responsive design
  - Drag & drop uploads
  - File type icons
  - Progress indicators
  - Toast notifications

- ⚡ **Performance**
  - Optimized file uploads
  - Lazy loading
  - Efficient state management

---

## 🛠️ Tech Stack

### Frontend
- ⚛️ React 18 with TypeScript
- 🔄 React Router v6
- 🔥 Firebase Authentication
- 🎨 React Bootstrap & custom CSS
- 📦 Vite for fast development

### Backend
- 🚀 Node.js with Express
- 🔑 JWT Authentication
- 📦 AWS S3 for file storage
- 🗄️ MongoDB with Mongoose
- 🐳 Docker support

### DevOps
- 🔄 GitHub Actions for CI/CD
- 📦 Docker containerization
- 🔒 Environment-based configuration
- 📊 Logging and monitoring

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB Atlas account
- AWS S3 bucket
- Firebase project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/google-drive-clone.git
   cd google-drive-clone
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env` in both frontend and backend
   - Update with your configuration

4. **Run the application**
   ```bash
   # Start backend
   cd backend
   npm run dev

   # In a new terminal, start frontend
   cd frontend
   npm run dev
   ```

### Docker Setup
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

---

## 📸 Screenshots

![Login Page](screenshots/login.png)
*Secure authentication with email/password or Google*

![Dashboard](screenshots/dashboard.png)
*Clean interface to manage your files*

![File Upload](screenshots/upload.png)
*Drag and drop file uploads with progress*

---

## 🎯 Features in Detail

### Authentication
- Secure JWT-based authentication
- Social login with Google
- Protected routes
- Session management

### File Operations
- Upload multiple files
- Preview images and PDFs
- Download files
- Delete files
- View file details

### User Experience
- Responsive design
- Loading states
- Error handling
- Toast notifications

### Performance
- Optimized file uploads
- Lazy loading
- Code splitting
- Efficient state management

---
## 🌐 View My Profiles

Check out more of my work and connect with me online:  
👉 [https://linktr.ee/your-link](https://linktr.ee/theankushrai)

Includes:
- GitHub  
- LeetCode  
- GeeksForGeeks  
- LinkedIn
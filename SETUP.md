# YouTube Clone - Full Stack Setup Guide

This guide will help you set up and run the complete YouTube clone application with both frontend and backend.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5.0 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **FFmpeg** (for video processing) - [Download here](https://ffmpeg.org/download.html)
- **Git** - [Download here](https://git-scm.com/)

## 🗄️ Database Setup

### 1. Install MongoDB

Download and install MongoDB Community Server from the official website.

**Windows:**
1. Download the MongoDB installer
2. Run the installer and follow the setup wizard
3. MongoDB will start automatically as a Windows service

**macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Update package database and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Verify MongoDB Installation

Check if MongoDB is running:
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ismaster')"
```

The default MongoDB connection string is: `mongodb://localhost:27017/youtube_clone`

## 🚀 Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file with your settings:

```env
# Database Configuration (MongoDB)
MONGODB_URI=mongodb://localhost:27017/youtube_clone

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# Other settings...
```

### 4. Database Setup and Seeding

Run the database setup scripts:

```bash
# Set up MongoDB and insert sample data
npm run db:setup

# Or manually seed the database
npm run db:seed

# Or reset everything (drops all data and re-seeds)
npm run db:reset
```

### 5. Create Upload Directories

The application will create these automatically, but you can create them manually:

```bash
mkdir -p uploads/videos uploads/thumbnails uploads/avatars
```

### 6. Start Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The backend will be available at `http://localhost:5000`

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd ..  # Go back to root directory if you're in backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_BACKEND_URL=http://localhost:5000
```

### 4. Start Frontend Development Server

```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## 🔧 FFmpeg Setup (Optional but Recommended)

### Windows
1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to your system PATH
4. Update your backend `.env` file:
   ```env
   FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe
   ```

### macOS
```bash
# Using Homebrew
brew install ffmpeg
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

## 📚 API Documentation

Once the backend is running, you can access the interactive API documentation at:
- **Swagger UI**: http://localhost:5000/api-docs

## 🧪 Testing the Application

### 1. Register a New User
- Go to http://localhost:3000
- Click on "Sign Up" or register via API
- Create a new account

### 2. Upload a Video
- Log in to your account
- Use the upload feature to add a video
- The system will process the video and generate thumbnails

### 3. Test Core Features
- Browse videos
- Search for content
- Like/dislike videos
- Add comments
- Subscribe to channels
- Create playlists

## 🛠️ Development Scripts

### Backend Scripts
```bash
npm run dev          # Start development server with auto-restart
npm start           # Start production server
npm test            # Run tests
npm run db:migrate  # Run database migrations
npm run db:seed     # Seed database with sample data
npm run db:reset    # Reset database (drops all data)
```

### Frontend Scripts
```bash
npm start           # Start development server
npm run build       # Build for production
npm test            # Run tests
npm run eject       # Eject from Create React App (not recommended)
```

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Error
- Verify MongoDB is running: `mongosh --eval "db.adminCommand('ismaster')"`
- Check MongoDB connection string in `.env`
- Ensure MongoDB service is started

#### Video Upload Issues
- Check file size limits in `.env`
- Verify upload directories exist and are writable
- Ensure FFmpeg is installed and accessible

#### Port Already in Use
- Change ports in `.env` files
- Kill processes using the ports:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # macOS/Linux
  lsof -ti:5000 | xargs kill -9
  ```

#### CORS Issues
- Verify `FRONTEND_URL` in backend `.env`
- Check `REACT_APP_API_URL` in frontend `.env`

## 📁 Project Structure

```
youtube-clone/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utility functions
│   ├── database/           # Database schema and seeds
│   ├── scripts/            # Database management scripts
│   ├── uploads/            # File upload directory
│   └── logs/               # Application logs
├── src/                    # Frontend React application
│   ├── components/         # React components
│   └── utils/              # Frontend utilities
├── public/                 # Static assets
└── package.json           # Frontend dependencies
```

## 🚀 Production Deployment

### Environment Variables
Update your production `.env` files with:
- Secure JWT secrets
- Production database credentials
- Cloud storage configuration (AWS S3)
- Email service configuration

### Database
- Use a managed MongoDB service (MongoDB Atlas, AWS DocumentDB, etc.)
- Set up regular backups
- Configure connection pooling and replica sets

### File Storage
- Consider using cloud storage (AWS S3, Google Cloud Storage)
- Set up CDN for video delivery
- Configure video transcoding services

### Security
- Use HTTPS in production
- Set up proper CORS policies
- Implement rate limiting
- Use environment-specific secrets

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the logs in `backend/logs/`
3. Ensure all prerequisites are properly installed
4. Verify environment configuration

## 🎉 Success!

If everything is set up correctly, you should have:
- ✅ Backend API running on http://localhost:5000
- ✅ Frontend app running on http://localhost:3000
- ✅ Database connected and seeded
- ✅ File uploads working
- ✅ Video processing functional

You now have a fully functional YouTube clone with user authentication, video upload, streaming, comments, subscriptions, and more!

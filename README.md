# 🎬 YouTube Clone - Full Stack Application

This is a full-stack YouTube clone application built with the MERN stack (MongoDB, Express, React, Node.js). It features video uploading, streaming, user authentication, comments, and other core functionalities of YouTube.

## ✨ Features

### Frontend (React + Material-UI)

*   Browse and stream videos
*   User authentication (login/register)
*   Video upload interface
*   Search functionality with filters
*   Channel pages and subscriptions
*   Like/dislike system
*   Comment system with nested replies
*   Responsive design

### Backend (Node.js + Express)

*   RESTful API with comprehensive endpoints
*   JWT-based authentication
*   Video upload and storage using Multer
*   Video streaming
*   User management system
*   Search and recommendation engine
*   Like/dislike and comment systems
*   Subscription management
*   View tracking and analytics

### Database (MongoDB)

*   Optimized schema for a video platform using Mongoose
*   Relational data structure for users, videos, comments, etc.

## 🛠️ Technologies Used

*   **Frontend:** React 18, Material-UI, React Router, Context API, Axios
*   **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT Authentication
*   **File Processing:** Multer for file uploads
*   **Documentation:** Swagger/OpenAPI
*   **Security:** Helmet, CORS, Rate limiting, Input validation

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v16 or higher)
*   npm (v8 or higher)
*   MongoDB (v5.0 or higher)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/youtube-clone.git
    cd youtube-clone
    ```

2.  **Setup Backend:**
    ```sh
    cd backend
    npm install
    cp .env.example .env
    ```
    *Update the `.env` file with your MongoDB connection string and other environment variables.*
    ```sh
    npm run db:setup
    npm run db:seed
    npm run dev
    ```
    The backend will be running on `http://localhost:5000`.

3.  **Setup Frontend:**
    *In a new terminal:*
    ```sh
    cd ..
    npm install
    npm start
    ```
    The frontend will be running on `http://localhost:3000`.

## 📂 Project Structure

<pre>
.
├── backend
│   ├── database
│   ├── node_modules
│   ├── scripts
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   └── utils
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend
│   ├── node_modules
│   ├── public
│   ├── src
│   │   ├── components
│   │   ├── contexts
│   │   └── utils
│   ├── .gitignore
│   ├── package.json
│   └── README.md
├── .gitignore
└── README.md
</pre>

## 📜 Available Scripts

### Frontend

*   `npm start`: Runs the app in the development mode.
*   `npm test`: Launches the test runner in the interactive watch mode.
*   `npm run build`: Builds the app for production to the `build` folder.
*   `npm run eject`: Removes the single dependency and copies all the configuration files and transitive dependencies (webpack, Babel, ESLint, etc.) right into your project.

### Backend

*   `npm start`: Starts the production server.
*   `npm run dev`: Starts the development server with auto-restart using nodemon.
*   `npm test`: Runs the tests.
*   `npm run db:setup`: Sets up the MongoDB database and seeds it with data.
*   `npm run db:seed`: Seeds the database with sample data.
*   `npm run db:reset`: Resets the database by dropping all data and re-seeding.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

Your Name - your.email@example.com

Project Link: [https://github.com/your-username/youtube-clone](https://github.com/your-username/youtube-clone)
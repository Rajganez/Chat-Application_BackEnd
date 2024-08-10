# HiBuddy (ChatApp) Backend Server

Welcome to the HiBuddy Chat Application Backend!

Users can send Direct messages by verifing their Email address and can join in group. Only Two Default Groups are availabe,

This project is built using Node.js, Express, MongoDB, Socket.io, Bcrypt, JWT, and Multer for handling various backend functionalities, including user authentication, real-time messaging, and file handling. Cloudinary for file storage

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Technologies Used](#technologies-used)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- User authentication using JWT and Bcrypt
- Real-time messaging with Socket.io
- File upload and retrieval using Multer
- RESTful API for user and chat management
- MongoDB for data storage

## Installation

To get started with the HiBuddy backend server, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Rajganez/Chat-Application_BackEnd.git
   cd HiBuddy-backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory and add the following environment variables:

   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```

## Configuration

### Environment Variables

- `PORT`: The port number on which the server will run.
- `DB_URL`: The MongoDB connection URI.
- `JWT_SECRET`: The secret key for signing JWT tokens.

## Running the Server

To start the server, run:

```bash
npm start
```

## API Endpoints

Here are the main API endpoints

User Routes: (`/user`)

- `POST /buddy/signup` : Register a user

- `POST /buddy/login` : Login a user

- `POST /buddy/logout` : Logout for the user

Chat Routes: (`/chat`)

- `GET /search/:id` : Search contacts of the fellow buddies

- `POST /getchatcontacts` : get chat details of the logged buddy

Group Routes: (`/group`)

- `GET /:groupid` : Get the Group from the DB

- `POST /addrecipient` : Add the logged buddy to the group

## Technologies Used

- Node.js: JavaScript runtime for building the server.
- Express: Web framework for Node.js to handle routing and middleware.
- MongoDB: NoSQL database for data storage.
- Socket.io: Library for real-time, bidirectional communication.
- Bcrypt: Library for hashing passwords securely.
- JWT (JSON Web Token): For user authentication and authorization.
- Multer: Middleware for handling file uploads.
- Cloudinary: For File storage

## Folder Structure

- DB/: Database setup.
- controllers/: Contains logic for handling incoming requests and interacting with the database.
- routes/: Defines API routes and maps them to controllers.
- middleware/: Middleware functions for tasks like authentication and validation.
- utils/: Mailer Utility function.
- socket.js : For Socket connection and
- express-server.js : Main server function

## License

This `README.md` file provides a comprehensive overview of the backend server for the HiBuddy chat application, Created for the learning and project purpose, including features, installation instructions, configuration details, how to run the server, API endpoints, technologies used, folder structure, and license information. Adjust any specific details as necessary for your project.

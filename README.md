# Backend API

This is the backend API for the Labour Project.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
# Add other environment variables as needed
```

3. Run the development server:
```bash
npm run dev
```

## API Documentation

The API will be available at `http://localhost:5000` (or your configured PORT).

## Dependencies

- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Other dependencies listed in package.json

## Security

- All sensitive information is stored in environment variables
- JWT is used for authentication
- CORS is enabled for security # hire-smart-backend

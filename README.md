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
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
API_KEY_G=your_google_ai_key
SESSION_SECRET=your_session_secret_key
# Add other environment variables as needed
```

3. Run the development server:
```bash
npm run dev
```

## Railway Deployment

1. Create a Railway account at https://railway.app

2. Install Railway CLI:
```bash
npm i -g @railway/cli
```

3. Login to Railway:
```bash
railway login
```

4. Initialize your project:
```bash
railway init
```

5. Add the following environment variables in Railway dashboard:
   - MONGODB_URI
   - JWT_SECRET
   - NODE_ENV=production
   - FRONTEND_URL (your frontend deployment URL)
   - API_KEY_G
   - Other required environment variables

6. Deploy your application:
```bash
railway up
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

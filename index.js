import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from "./routes/notification.routes.js";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import session from 'express-session';
import passport from 'passport';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import client from 'prom-client';

dotenv.config({});

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://hire-smart-frontend.vercel.app', process.env.FRONTEND_URL, 'https://hire-smart-frontend-dusky.vercel.app', '*'] 
        : 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

// Add CORS debug logging
const corsMiddleware = cors(corsOptions);
app.use((req, res, next) => {
    console.log(`CORS request from origin: ${req.headers.origin} to ${req.method} ${req.path}`);
    corsMiddleware(req, res, next);
});

// Add OPTIONS preflight handling for all routes
app.options('*', cors(corsOptions));

const PORT = process.env.PORT || 3000;

const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = process.env.API_KEY_G;
if (!API_KEY) {
    console.error('API_KEY_G is not set in environment variables');
    process.exit(1);
}

app.set('view engine','ejs');
app.use(express.static('public'));
// Middleware to handle HTTP post requests
app.use(bodyParser.json()); // To handle JSON body

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());



async function runChat(userInput) {
	const genAI = new GoogleGenerativeAI(API_KEY);
	const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
	const generationConfig = {
	  temperature: 0.9,
	  topK: 1,
	  topP: 1,
	  maxOutputTokens: 1000,
	};
  
	const safetySettings = [
	  {
		category: HarmCategory.HARM_CATEGORY_HARASSMENT,
		threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
	  },
	  // ... other safety settings
	];
  
	const chat = model.startChat({
	  generationConfig,
	  safetySettings,
	  history: [
		{
		  role: "user",
		  parts: [
			{text: "Hi\n"},
		  ],
		},
		{
		  role: "model",
		  parts: [
			{text: "Hello! Welcome to the Smart Labour Hiring System. How may I assist you?\n"},
		  ],
		},
		{
            role: "user",
            parts: [
              {text: "Can u tell me the feature of this Smart Labour Hiring Project\n"},
            ],
          },
          {
            role: "model",
            parts: [
              {text: "The Smart Labour Hiring System offers secure user authentication, real-time job postings, skill-based job matching, and seamless application tracking. It includes a rating system for both employers and workers, ensures transparent payments with integrated payment gateways, and provides an intuitive interface for easy job browsing and hiring, improving overall efficiency and user experience.\n"},
            ],
          },

		{
		  role: "user",
		  parts: [
			{text: "What is this Smart Labour Hiring System\n"},
		  ],
		},
		{
		  role: "model",
		  parts: [
			{text: "The Smart Labour Hiring System is an innovative platform designed to streamline the process of hiring skilled labor for various industries. It bridges the gap between employers and workers by providing an easy-to-use interface where employers can post job requirements, and workers can browse available opportunities based on their skills, location, and availability. The system leverages advanced algorithms to match workers with the most suitable jobs, ensuring efficiency and reducing hiring time. Features include secure user authentication, real-time job posting, and application tracking, along with a rating system for both employers and workers, promoting transparency and trust. The platform also supports payment integration, allowing for smooth and secure transactions. With its focus on simplicity, transparency, and user satisfaction, the Smart Labour Hiring System aims to revolutionize the labor hiring process, making it more accessible, efficient, and trustworthy for both employers and laborers alike.\n"},
		  ],
		},
	  ],
	});
	const result = await chat.sendMessage(userInput);
	const response = result.response;
	return response.text();
  }

  app.post('/chat', async (req, res) => {
	try {
	  const userInput = req.body?.userInput;
	  console.log('incoming /chat req', userInput)
	  if (!userInput) {
		return res.status(400).json({ error: 'Invalid request body' });
	  }
  
	  const response = await runChat(userInput);
	  res.json({ response });
	} catch (error) {
	  console.error('Error in chat endpoint:', error);
	  res.status(500).json({ error: 'Internal Server Error' });
	}
  });



// api's
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
app.use('/api/v1/payment', paymentRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// Health check route
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }
        res.json({ 
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// After the health check route, add a debug endpoint to list all routes
app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    
    // Function to collect routes from a router
    const extractRoutes = (router) => {
        if (!router.stack) return;
        
        router.stack.forEach((layer) => {
            if (layer.route) {
                // This is a route
                const path = layer.route.path;
                const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
                routes.push({ path, methods });
            } else if (layer.name === 'router' && layer.handle.stack) {
                // This is a router middleware
                extractRoutes(layer.handle);
            }
        });
    };
    
    // Get routes from the main app
    extractRoutes(app._router);
    
    res.json({
        total_routes: routes.length,
        routes,
        registered_middleware: [
            "/api/v1/user",
            "/api/v1/company",
            "/api/v1/job",
            "/api/v1/application",
            "/api/v1/payment",
            "/api/v1/notifications"
        ]
    });
});

// Add the test company route
app.get('/api/test/company', async (req, res) => {
    try {
        res.json({ 
            message: 'Company API test endpoint',
            company_routes: [
                { path: "/api/v1/company/register", method: "POST" },
                { path: "/api/v1/company/get", method: "GET" },
                { path: "/api/v1/company/get/:id", method: "GET" },
                { path: "/api/v1/company/update/:id", method: "PUT" }
            ]
        });
    } catch (error) {
        console.error('Company test endpoint error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

// Add auth debug endpoint
app.get('/api/debug/auth', async (req, res) => {
    try {
        // Check for token in cookies or Authorization header
        const token = req.cookies.token || 
            (req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? 
             req.headers.authorization.split(' ')[1] : null);

        const result = {
            headers: {
                authorization: req.headers.authorization ? 'exists' : 'missing',
                cookie: req.headers.cookie ? 'exists' : 'missing',
                origin: req.headers.origin || 'missing',
            },
            token: token ? {
                exists: true,
                prefix: token.substring(0, 10) + '...',
            } : {
                exists: false
            }
        };

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SECRET_KEY);
                result.token.valid = true;
                result.token.decoded = {
                    userId: decoded.userId,
                    exp: new Date(decoded.exp * 1000).toISOString(),
                    iat: new Date(decoded.iat * 1000).toISOString()
                };
            } catch (jwtError) {
                result.token.valid = false;
                result.token.error = jwtError.message;
            }
        }

        return res.status(200).json({
            message: 'Auth debug info',
            ...result
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error in auth debug endpoint',
            error: error.message
        });
    }
});

// Get company route without authentication (for testing)
app.get('/api/test/company/all', async (req, res) => {
    try {
        const companies = await mongoose.connection.collection('companies').find({}).toArray();
        res.json({
            count: companies.length,
            companies
        });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get('/', (req, res) => {
    res.send('Backend is running');
});

// Prometheus metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics(); // collects Node.js and process metrics

// Expose /metrics endpoint for Prometheus to scrape
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});

// Create a counter metric for login count

const loginCounter = new client.Counter({
  name: 'user_login_total',
  help: 'Total number of user logins',
});

app.post('/login', (req, res) => {
  loginCounter.inc(); // Increment the login counter
  res.send('Logged in');
});


// Create a counter metric for total requests
const totalRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
});

// Middleware to count all requests
app.use((req, res, next) => {
  totalRequests.inc();  // Increment counter by 1
  next();
});

app.listen(PORT, async () => {
    try {
        await connectDB();
        console.log(`Server running at port ${PORT}`);
    } catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }
});
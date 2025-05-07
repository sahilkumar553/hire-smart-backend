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

dotenv.config({});

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
const corsOptions = {
    origin: ['http://localhost:5173', 'http://frontend:5173','https://hire-smart-frontend.vercel.app'],
    credentials: true
}

app.use(cors(corsOptions));

const PORT = process.env.PORT || 3000;

const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = process.env.API_KEY_G;
app.set('view engine','ejs');
app.use(express.static('public'));
// Middleware to handle HTTP post requests
app.use(bodyParser.json()); // To handle JSON body

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
	secret:"This is the secret key",
	resave:false,
	saveUninitialized:false
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

app.get('/', (req, res) => {
    res.send('Server is running');
})

app.listen(PORT,()=>{
    connectDB();
    console.log(`Server running at port ${PORT}`);
})
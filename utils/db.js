import mongoose from "mongoose";
// Asynchronous function to connect to the database
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}
export default connectDB;
import mongoose from 'mongoose';

// Connect to MongoDB
// This function will be called when the server starts
const connectDB = async () => {
    try {
        // We use process.env.MONGO_URI to hide our actual database password
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        
        // Exit the process with failure (1) if database connection fails
        // We don't want the server running if it can't save data!
        process.exit(1);
    }
};

export default connectDB;

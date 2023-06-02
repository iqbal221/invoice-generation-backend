
import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

const config = {
    JWT_SECRET: process.env.JWT_SECRET,
    EMAIL: process.env.EMAIL,
    PASSWORD: process.env.PASSWORD,
    ATLAS_URI: process.env.ATLAS_URI,
    AWS: {
        bucketName: process.env.AWS_BUCKET_NAME,
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
};
async function connect(){
    const db = await mongoose.connect(config.ATLAS_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // serverSelectionTimeoutMS: 3000, // Add this option
    });
    console.log("Database Connected");
    return db;
}

export default connect;


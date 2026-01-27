import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/wdp-ecs";

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ Connected to MongoDB:", uri);
  } catch (err) {
    console.error("✗ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
};

export default connectDB;

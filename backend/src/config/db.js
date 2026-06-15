const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/search-goat';
    console.log(`Connecting to MongoDB at: ${connUri}`);
    // Set a moderate connection timeout so startup isn't blocked too long if offline
    await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connection established successfully.');
  } catch (error) {
    console.error(`MongoDB connection failure: ${error.message}. Database functionality will be unavailable.`);
  }
};

module.exports = connectDB;

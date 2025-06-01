const mongoose = require('mongoose');

// Replace with your MongoDB connection string
//const uri = 'mongodb://localhost:27017/catalogDB'; // For local MongoDB
const uri = 'mongodb+srv://gaziaycil27:<dGUn.BeTBmi29D5>@catalog-app.v0tfl.mongodb.net/?retryWrites=true&w=majority&appName=catalog-app'; // For Atlas

mongoose.connect(uri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));
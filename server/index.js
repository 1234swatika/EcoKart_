const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();

// CORS configuration for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const ecoRewardsRouter = require('./routes/ecoRewards');

app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/eco-rewards', ecoRewardsRouter);

// MongoDB connection with fallback
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://rishitagrawal217:t6ddr0l6cOyXxxml@cluster0.actbcon.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');
    // Import products if collection is empty
    const count = await Product.countDocuments();
    if (count === 0) {
      const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json')));
      // Flatten products by category
      const flatProducts = productsData.flatMap(cat => cat.products.map(prod => ({ ...prod, category: cat.category })));
      await Product.insertMany(flatProducts);
      console.log('Products imported to DB');
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('EcoKart backend is running!');
});

// Add a test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'EcoKart API is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the API at: http://localhost:${PORT}/test`);
  console.log(`Products API at: http://localhost:${PORT}/api/products`);
  console.log(`Auth API at: http://localhost:${PORT}/api/auth`);
  console.log(`Cart API at: http://localhost:${PORT}/api/cart`);
  console.log(`Orders API at: http://localhost:${PORT}/api/orders`);
  console.log(`EcoRewards API at: http://localhost:${PORT}/api/eco-rewards`);
}); 
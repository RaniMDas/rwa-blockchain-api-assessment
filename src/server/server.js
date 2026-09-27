const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const {ethers} = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Routes
app.use('/api/assets', require('./routes/assets'));
app.use('/api/validators', require('./routes/validators'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ipfs', require('./routes/ipfs'));

// Health check endpoint
//RaniM- RAW Assessment
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
// RaniM - RWA Assessment API Test
app.get('/api/RaniMApiTest', async (req, res) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider('https://ethereum-rpc.publicnode.com');

    // Public Ethereum smart contract: USDC
    const contractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

    const abi = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function totalSupply() view returns (uint256)'
    ];

    const contract = new ethers.Contract(contractAddress, abi, provider);

    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();

    const result = {
      contractAddress,
      name,
      symbol,
      totalSupply: totalSupply.toString()
    };

    console.log('Blockchain data fetched:', result);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Blockchain fetch error:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure Metro to bind to LAN IP for network access
config.server = {
  ...config.server,
  host: '172.16.58.80', // Bind to LAN IP
  port: 8081, // Default Metro port
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add CORS headers for network requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;

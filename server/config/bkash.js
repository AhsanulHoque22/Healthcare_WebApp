module.exports = {
  // bKash Sandbox Configuration
  sandbox: {
    baseURL: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    username: process.env.BKASH_SANDBOX_USERNAME || process.env.BKASH_USERNAME,
    password: process.env.BKASH_SANDBOX_PASSWORD || process.env.BKASH_PASSWORD,
    appKey: process.env.BKASH_SANDBOX_APP_KEY || process.env.BKASH_APP_KEY,
    appSecret: process.env.BKASH_SANDBOX_APP_SECRET || process.env.BKASH_APP_SECRET,
    callbackURL: process.env.BKASH_CALLBACK_URL
  },
  
  // bKash Production Configuration
  production: {
    baseURL: 'https://tokenized.pay.bka.sh/v1.2.0-beta',
    username: process.env.BKASH_USERNAME,
    password: process.env.BKASH_PASSWORD,
    appKey: process.env.BKASH_APP_KEY,
    appSecret: process.env.BKASH_APP_SECRET,
    callbackURL: process.env.BKASH_CALLBACK_URL
  },
  
  // Get current configuration based on environment
  getConfig: () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? module.exports.production : module.exports.sandbox;
  }
};

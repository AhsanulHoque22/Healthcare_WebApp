module.exports = {
  // bKash Sandbox Configuration
  sandbox: {
    baseURL: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    username: 'sandboxTokenizedUser02',
    password: 'sandboxTokenizedUser02@12345',
    appKey: '4f6o0cjiki2rfm34kfdadl1eqq',
    appSecret: '2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b',
    callbackURL: process.env.BKASH_CALLBACK_URL || 'http://localhost:3000/payment/callback'
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

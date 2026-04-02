const { User } = require('./models');

async function autoVerifyExistingUsers() {
  try {
    console.log('Fetching existing users...');
    const users = await User.findAll({ where: { emailVerified: false } });
    
    console.log(`Found ${users.length} unverified users. Setting emailVerified to true...`);
    
    for (const user of users) {
      await user.update({ emailVerified: true });
    }
    
    console.log('All existing users have been verified successfully. They will not be locked out by the new system.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

autoVerifyExistingUsers();

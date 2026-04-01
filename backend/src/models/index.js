const { Sequelize } = require('sequelize');
const config = require('../config/database.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  }
);

const db = {
  sequelize,
  Sequelize
};

// Import models
db.User = require('./user.js')(sequelize, Sequelize.DataTypes);
db.Ride = require('./ride.js')(sequelize, Sequelize.DataTypes);
db.Booking = require('./booking.js')(sequelize, Sequelize.DataTypes);
db.Message = require('./message.js')(sequelize, Sequelize.DataTypes);
db.Review = require('./review.js')(sequelize, Sequelize.DataTypes);
db.Wallet = require('./wallet.js')(sequelize, Sequelize.DataTypes);
db.Transaction = require('./transaction.js')(sequelize, Sequelize.DataTypes);
db.RidePayment = require('./ridePayment.js')(sequelize, Sequelize.DataTypes);
db.SplitPayment = require('./splitPayment.js')(sequelize, Sequelize.DataTypes);

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;

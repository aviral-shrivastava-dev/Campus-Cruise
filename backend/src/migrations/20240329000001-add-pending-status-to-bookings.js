'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For MySQL, we need to alter the ENUM type
    await queryInterface.sequelize.query(`
      ALTER TABLE bookings 
      MODIFY COLUMN status ENUM('pending', 'confirmed', 'cancelled') 
      DEFAULT 'pending' 
      NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to original ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE bookings 
      MODIFY COLUMN status ENUM('confirmed', 'cancelled') 
      DEFAULT 'confirmed' 
      NOT NULL;
    `);
  }
};

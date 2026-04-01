'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      college: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: ['passenger']
      },
      vehicleMake: {
        type: Sequelize.STRING,
        allowNull: true
      },
      vehicleModel: {
        type: Sequelize.STRING,
        allowNull: true
      },
      vehicleColor: {
        type: Sequelize.STRING,
        allowNull: true
      },
      licensePlate: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isOnline: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      lastSeen: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add index on email for faster lookups
    await queryInterface.addIndex('users', ['email']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};

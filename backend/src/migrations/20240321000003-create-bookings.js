'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bookings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      rideId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'rides',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      passengerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('confirmed', 'cancelled'),
        defaultValue: 'confirmed',
        allowNull: false
      },
      isLateCancellation: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
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

    // Add unique constraint on (rideId, passengerId)
    await queryInterface.addConstraint('bookings', {
      fields: ['rideId', 'passengerId'],
      type: 'unique',
      name: 'unique_ride_passenger'
    });

    // Add indexes for performance
    await queryInterface.addIndex('bookings', ['rideId']);
    await queryInterface.addIndex('bookings', ['passengerId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('bookings');
  }
};

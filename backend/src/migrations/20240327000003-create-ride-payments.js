'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ride_payments', {
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
      bookingId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'bookings',
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
      driverId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      paidAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      creditsUsed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      rewardPointsUsed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      cashbackEarned: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      rewardPointsEarned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      paymentMethod: {
        type: Sequelize.ENUM('wallet', 'credits', 'mixed', 'split'),
        allowNull: false,
        defaultValue: 'wallet'
      },
      status: {
        type: Sequelize.ENUM('pending', 'held', 'completed', 'refunded', 'failed'),
        defaultValue: 'pending',
        allowNull: false
      },
      splitPaymentId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      escrowTransactionId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      refundedAt: {
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

    await queryInterface.addIndex('ride_payments', ['rideId']);
    await queryInterface.addIndex('ride_payments', ['bookingId'], { unique: true });
    await queryInterface.addIndex('ride_payments', ['passengerId']);
    await queryInterface.addIndex('ride_payments', ['driverId']);
    await queryInterface.addIndex('ride_payments', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ride_payments');
  }
};

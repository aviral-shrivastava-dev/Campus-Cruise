'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      walletId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'wallets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM(
          'deposit',
          'withdrawal',
          'ride_payment',
          'ride_earning',
          'refund',
          'credit_purchase',
          'credit_usage',
          'reward_redemption',
          'cashback',
          'split_payment',
          'escrow_hold',
          'escrow_release'
        ),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      credits: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      rewardPoints: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'cancelled', 'held'),
        defaultValue: 'pending',
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      referenceId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      referenceType: {
        type: Sequelize.ENUM('ride', 'booking', 'topup', 'withdrawal'),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      balanceBefore: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      balanceAfter: {
        type: Sequelize.DECIMAL(10, 2),
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

    // Check and add indexes only if they don't exist
    const indexes = await queryInterface.showIndex('transactions');
    const indexNames = indexes.map(idx => idx.name);

    if (!indexNames.includes('transactions_wallet_id_created_at')) {
      await queryInterface.addIndex('transactions', ['walletId', 'createdAt'], {
        name: 'transactions_wallet_id_created_at'
      });
    }

    if (!indexNames.includes('transactions_type_status')) {
      await queryInterface.addIndex('transactions', ['type', 'status'], {
        name: 'transactions_type_status'
      });
    }

    if (!indexNames.includes('transactions_reference_id_reference_type')) {
      await queryInterface.addIndex('transactions', ['referenceId', 'referenceType'], {
        name: 'transactions_reference_id_reference_type'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transactions');
  }
};

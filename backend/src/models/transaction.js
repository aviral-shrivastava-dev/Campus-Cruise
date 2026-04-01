module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    walletId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'wallets',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
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
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true
      }
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    rewardPoints: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled', 'held'),
      defaultValue: 'pending',
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to related entity (ride, booking, etc.)'
    },
    referenceType: {
      type: DataTypes.ENUM('ride', 'booking', 'topup', 'withdrawal'),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    balanceBefore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    indexes: [
      {
        fields: ['walletId', 'createdAt']
      },
      {
        fields: ['type', 'status']
      },
      {
        fields: ['referenceId', 'referenceType']
      }
    ]
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.Wallet, {
      as: 'wallet',
      foreignKey: 'walletId'
    });
  };

  return Transaction;
};

module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('Wallet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        isInt: true
      }
    },
    rewardPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        isInt: true
      }
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    totalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: 'wallets',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
        unique: true
      }
    ]
  });

  Wallet.associate = (models) => {
    Wallet.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'userId'
    });
    Wallet.hasMany(models.Transaction, {
      as: 'transactions',
      foreignKey: 'walletId',
      onDelete: 'CASCADE'
    });
  };

  return Wallet;
};

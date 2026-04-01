module.exports = (sequelize, DataTypes) => {
  const SplitPayment = sequelize.define('SplitPayment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    rideId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'rides',
        key: 'id'
      }
    },
    initiatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    participantCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2,
        isInt: true
      }
    },
    amountPerPerson: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    paidCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('pending', 'partial', 'completed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false
    },
    participants: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of {userId, amount, paid, paidAt}'
    }
  }, {
    tableName: 'split_payments',
    timestamps: true,
    indexes: [
      {
        fields: ['rideId']
      },
      {
        fields: ['initiatorId']
      },
      {
        fields: ['status']
      }
    ]
  });

  SplitPayment.associate = (models) => {
    SplitPayment.belongsTo(models.Ride, {
      as: 'ride',
      foreignKey: 'rideId'
    });
    SplitPayment.belongsTo(models.User, {
      as: 'initiator',
      foreignKey: 'initiatorId'
    });
  };

  return SplitPayment;
};

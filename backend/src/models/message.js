module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rideId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'rides',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    messageType: {
      type: DataTypes.ENUM('direct', 'group'),
      allowNull: false,
      validate: {
        isValidMessageType(value) {
          if (value === 'direct' && !this.recipientId) {
            throw new Error('Direct messages must have a recipientId');
          }
          if (value === 'group' && !this.rideId) {
            throw new Error('Group messages must have a rideId');
          }
        }
      }
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    indexes: [
      {
        fields: ['senderId', 'recipientId']
      },
      {
        fields: ['rideId']
      }
    ],
    validate: {
      checkMessageTypeConstraints() {
        if (this.messageType === 'direct' && !this.recipientId) {
          throw new Error('Direct messages must have a recipientId');
        }
        if (this.messageType === 'group' && !this.rideId) {
          throw new Error('Group messages must have a rideId');
        }
      }
    }
  });

  // Define associations
  Message.associate = (models) => {
    Message.belongsTo(models.User, {
      as: 'sender',
      foreignKey: 'senderId'
    });
    Message.belongsTo(models.User, {
      as: 'recipient',
      foreignKey: 'recipientId'
    });
    Message.belongsTo(models.Ride, {
      as: 'ride',
      foreignKey: 'rideId'
    });
  };

  return Message;
};

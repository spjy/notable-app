
module.exports = (Sequelize, db) => {
  const Appointment = db.define('Appointment', {
    // Model attributes are defined here
    patientFirstName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    patientLastName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    startTime: {
      type: Sequelize.DATE,
      allowNull: false
    },
    kind: {
      type: Sequelize.ENUM(['New Patient', 'Follow-up']),
      allowNull: false
    },
    doctorId: {
      type: Sequelize.INTEGER,
    }
  }, {
    // Other model options go here
  });

  Appointment.associate = (models) => {
    Appointment.belongsTo(models.Doctor, {
      foreignKey: 'doctorId',
      as: 'doctors'
    })
  }

  return Appointment
}
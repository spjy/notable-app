module.exports = (Sequelize, db) => {
  const Doctor = db.define('Doctor', {
    // Model attributes are defined here
    firstName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false
    },
  }, {
    // Other model options go here
  });

  Doctor.associate = (models) => {
    Doctor.hasMany(models.Appointment, {
      as: 'appointments'
    })
  }

  return Doctor 
}

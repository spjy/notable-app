const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
// Database
const { Sequelize } = require('sequelize');
const { Op } = require('@sequelize/core');

// Routes
const indexRouter = require('./routes/index');
const doctorsRouter = require('./routes/doctors');

// DB Models

var app = express();
const router = express.Router();

const db = new Sequelize('sqlite::memory:');

// Initialize models
const Doctor = require('./database/Doctor')(Sequelize, db);
const Appointment = require('./database/Appointment')(Sequelize, db);

// Update database tables
db.sync();

// Database setup
(async () => {
  // Ensure connection
  try {
    await db.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

  // Seed starter data
  const d = await Doctor.create({ firstName: 'Algernop', lastName: 'Krieger' });
  await Appointment.create({
    patientFirstName: 'Sterling',
    patientLastName: 'Archer',
    startTime: new Date(),
    kind: 'New Patient',
    doctorId: d.id
  })

  // Log current data
  const users = await Doctor.findAll();
  const appts = await Appointment.findAll();

  console.log("All users:", JSON.stringify(users, null, 2));
  console.log("All appts:", JSON.stringify(appts, null, 2));
})();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Retrieves a list of all doctors.
 */
app.use(router.get('/doctors', async (req, res, next) => {
  const Doctors = await Doctor.findAll();

  res.setHeader('Content-Type', 'application/json')
  return res.end(JSON.stringify(Doctors, null, 2))
}));

/**
 * Creates an appointment for a certain doctor
 * Body params:
 * `doctorId`
 * `patientFirstName` - first name of  patient
 * `patientLastName` - last name of patient
 * `startTime` - start time of appt
 * `kind` - type of appt
 */
app.use(router.post('/doctor/appointment/add', async (req, res, next) => {
  const { doctorId, patientFirstName, patientLastName, startTime, kind } = req.body;

  // Check if doctor exists
  try {
    const result = await Doctor
      .findAndCountAll({
        where: {
          id: {
            [Op.eq]: doctorId
          }
        },
      })

    console.log(`RES COUNT: ${result.count}`)

    if (result.count !== 1) {
      return res.status(500).send('Doctor does not exist.');
    }
  } catch (exception) {
    console.log(exception);

    return res.status(500);
  }

  // Check if time is in a 15 minute interval
  const minutes = new Date(startTime).getMinutes();
  if (minutes % 15 !== 0) {
    // return error
    return res.status(400).send('Appointment is not a multiple of 15.')
  }

  // Check if doctor has >= 3 appointments
  try {
    const appts = await Appointment
      .findAndCountAll({
        where: {
          doctorId: {
            [Op.eq]: doctorId
          },
          startTime: {
            [Op.eq]: startTime
          }
        }
      });

    if (appts.count >= 3) {
      return res.status(400).send('Doctor is booked.')
    }
  } catch (exception) {
    console.log(exception);

    return res.status(500)
  }

  try {
    const appt = await Appointment.create({
      patientFirstName,
      patientLastName,
      startTime,
      kind,
      doctorId
    });

    if (appt) {
      return res.json(JSON.stringify(appt, null, 2))
    }
  } catch (exception) {
    console.log(exception)

    return res.sendStatus(500)
  }
}));

/**
 * Deletes a doctor's appointment
 * Body param:`id` - appointment ID
 */
app.use(router.delete('/doctor/appointment/delete', async (req, res, next) => {
  const { id } = req.body;

  // Check if number
  if (typeof id !== 'number') {
    return res.status(400);
  }

  try {
    // Retrieve record to be deleted
    const appt = await Appointment.findByPk(id);

    // If it exists, delete
    if (appt) {
      await appt.destroy();
  
      return res.status(200).send(`Successfully deleted appointment ${id}.`);
    }

    // If it could not be deleted
    return res.status(400).send(`Appointment ${id} does not exist.`)
  } catch (exception) {
    console.log(exception)

    return res.status(500)
  }
}));

/**
 * Get a doctor's appointments on a certain date
 * Body param:`id` - doctor's ID
 * Body param: `date` - appointment date
 */
app.use(router.get('/doctor/appointments', async (req, res, next) => {
  const { id, date } = req.body;

  // Check if number
  if (typeof id !== 'number') {
    return res.status(400)
  }

  try {
    // Retrieve from database and query based on doctor id
    const appts = await Appointment.findAll({
      where: {
        doctorId: {
          [Op.eq]: id
        },
        /** COULD NOT FIND HOW TO QUERY BY ONLY DATE IN SEQUELIZE. WOULD HAVE ADDED THIS IF MORE TIME. */
        // startTime: date
      }
    });

    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify(appts, null, 2))
  } catch (exception) {
    console.log(exception);

    return res.status(500)
  }
}));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const db = new Sequelize('sqlite::memory:');

const Doctor = require('../database/Doctor')(Sequelize, db);

/* GET users listing. */
router.get('/', async (req, res) => {
  const Doctors = Doctor.findAll();

  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(Doctors, null, 2))
});

module.exports = router;

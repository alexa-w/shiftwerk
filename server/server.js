/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { google } = require('googleapis');
// TODO need to make sure this is the correct path for dbHelpers
const dbHelpers = require('../dbHelpers/dbHelpers.js');
// const oauth2Client = new google.auth.OAuth2(
//   '347712232584-9dv95ud3ilg9bk7vg8i0biqav62fh1q7.apps.googleusercontent.com',
//   'WBbo3VF1_r9zsOovnfdi0h1Z',
// );
const { geocode, reverseGeocode } = require('../apiHelpers/tomtom');
const { models } = require('../db/index');


const app = express();
app.use(bodyParser.json());
app.use(cors());


const errorHandler = (err, res) => {
  console.error(err);
  res.send(500, 'Something went wrong!');
};

const appendAddressToShift = async (shift) => {
  const address = await reverseGeocode({ lat: shift.lat, long: shift.long });
  return Object.assign(shift, { address });
};

// ----WERKER---- ////

// get profile for werker
app.get('/werkers/:werkerId', (req, res) => {
  dbHelpers.getWerkerProfile(req.params.werkerId)
    .then(profile => res.json(200, profile))
    .catch((err) => {
      console.error(err);
      res.send(500, 'something went wrong!');
    });
});

// get werkers by position
app.get('/werkers/search/:positionName', (req, res) => {
  dbHelpers.getWerkersByPosition(req.params.positionName)
    .then(werkers => res.json(200, werkers))
    .catch((err) => {
      console.error(err);
      res.send(500, 'something went wrong!');
    });
});

/**
 * PUT /werkers
 * expects body with following properties:
 *  name_first
 *  name_last
 *  email
 *  url_photo
 *  bio
 *  phone
 *  last_minute
 *  certifications[]
 *  positions[]
 * creates new resource in db
 * sends back new db record
 */

app.put('/werkers', (req, res) => {
  dbHelpers.addWerker(req.body)
    .then(newWerker => res.json(201, newWerker))
    .catch((err) => {
      console.error(err);
      res.send(500, 'Something went wrong!');
    });
});

// ----MAKER---- //

/**
 * PUT /makers
 * expects body with the following properties:
 *  name
 *  url_photo
 *  email
 *  phone
 * creates new resource in db
 * sends back new db record
 */

app.put('/makers', (req, res) => {
  models.Maker.create(req.body)
    .then(newMaker => res.json(201, newMaker))
    .catch((err) => {
      console.error(err);
      res.send(500, 'Something went wrong!');
    });
});

// get a maker's profile
app.get('/makers/:makerId', (req, res) => {
  models.Maker.findOne({ where: { id: req.params.makerId } })
    .then(maker => res.json(201, maker))
    .catch((err) => {
      console.error(err);
      res.send(500, 'Something went wrong!');
    });
});

// ----SHIFT---- //

// WERKER-FACING //

// get list of shifts by terms
app.get('/shifts', async (req, res) => {
  const shifts = await dbHelpers.getShiftsByTerm(req.query).catch(err => errorHandler(err, res));
  const shiftsWithAddress = await Promise.all(shifts
    .map(shift => reverseGeocode(shift))).catch(err => errorHandler(err, res));
  return res.statusCode(200).json(shiftsWithAddress);
});

// gets all shifts a werker is eligible for based on positions
app.get('/werkers/:werkerId/shifts/available', async (req, res) => {
  const { werkerId } = req.params;
  const shifts = await dbHelpers.getShiftsForWerker(werkerId).catch(err => errorHandler(err, res));
  const shiftsWithAddress = await Promise.all(shifts
    .map(shift => reverseGeocode(shift))).catch(err => errorHandler(err, res));
  return res.statusCode(200).json(shiftsWithAddress);
});

// gets all shifts for werker based on invite status ('invite' or 'accept')
app.get('/werkers/:werkerId/shifts/:status', async (req, res) => {
  const { werkerId, status } = req.params;
  const shifts = dbHelpers.getInvitedOrAcceptedShifts(werkerId, status)
    .catch(err => errorHandler(err, res));
  const shiftsWithAddress = await Promise.all(shifts
    .map(shift => reverseGeocode(shift))).catch(err => errorHandler(err, res));
  return res.statusCode(200).json(shiftsWithAddress);
});

// MAKER-FACING //

/**
 * PUT /shifts
 * expects body with the following properties:
 *  MakerId
 *  name
 *  time_date
 *  duration
 *  address
 *  description
 *  positions[]
 *   position is obj with:
 *   position
 *   payment_amnt
 *  payment_type
 */
app.put('/shifts', async (req, res) => {
  const { body } = req;
  const { lat, lon } = await geocode(body.address);
  body.lat = lat;
  body.long = lon;
  const shift = await dbHelpers.createShift(body)
    .catch(err => errorHandler(err, res));
  res.status(201).json(shift);
});

app.delete('/shifts/:shiftId', (req, res) => {
  const { shiftId } = req.params;
  return dbHelpers.deleteShift(shiftId)
    .then(() => res.send(204))
    .catch((err) => {
      console.error(err);
      res.status(500).send('unable to delete');
    });
});

// get all shifts a werker is eligible for based on positions
app.get('/werkers/:werkerId/shifts/available', async (req, res) => {
  const { werkerId } = req.params;
  const shifts = dbHelpers.getShiftsForWerker(werkerId).catch(err => errorHandler(err, res));
  const shiftsWithAddress = await Promise.all(shifts
    .map(shift => reverseGeocode(shift))).catch(err => errorHandler(err, res));
  return res.statusCode(200).json(shiftsWithAddress);
});

// histOrUpcoming is either 'history' or 'upcoming'
// status is 'accept'
// histOrUpcoming does not apply if status is 'invite'
app.get('/werkers/:werkerId/shifts/:histOrUpcoming', async (req, res) => {
  const { werkerId, histOrUpcoming } = req.params;
  const shifts = dbHelpers.getAcceptedShifts(werkerId, histOrUpcoming)
    .catch(err => errorHandler(err, res));
  const shiftsWithAddress = await Promise.all(shifts
    .map(shift => reverseGeocode(shift))).catch(err => errorHandler(err, res));
  return res.statusCode(200).json(shiftsWithAddress);
});

// get all shifts werker is invited to
app.get('/werkers/:werkerId/invitations', (req, res) => {
  const { werkerId } = req.params;
  return dbHelpers.getInvitedShifts(werkerId)
    .then(shifts => res.status(200).json(shifts))
    .catch(err => errorHandler(err, res));
});

// get all applications to a maker's shifts
app.get('/makers/:makerId/applications', (req, res) => {
  const { makerId } = req.params;
  return dbHelpers.getApplicationsForShifts(makerId)
    .then(shifts => res.status(200).json(shifts))
    .catch(err => errorHandler(err, res));
});

// get all unfulfilled shifts of a maker
app.get('/makers/:makerId/unfulfilled', (req, res) => {
  const { makerId } = req.params;
  return dbHelpers.getUnfulfilledShifts(makerId)
    .then(shifts => res.status(200).json(shifts))
    .catch(err => errorHandler(err, res));
});

// get all fulfilled shifts for a maker
// histOrUpcoming is either 'history' or 'upcoming'
app.get('/makers/:makerId/fulfilled/:histOrUpcoming', (req, res) => {
  const { makerId, histOrUpcoming } = req.params;
  return dbHelpers.getFulfilledShifts(makerId, histOrUpcoming)
    .then(shifts => res.status(200).json(shifts))
    .catch(err => errorHandler(err, res));
});

// MAKER/WERKER //

// get detailed shift info by Id for maker and werker
app.get('/shifts/:shiftId', (req, res) => {
  const shiftId = JSON.parse(req.params.shiftId);
  // TODO check helper function name
  dbHelpers.getShiftsById(shiftId)
    .then((shift) => {
      res.send(shift);
    })
    .catch((error) => {
      console.log(error, 'unable to get SHIFT');
      res.status(500).send('unable to get SHIFT!');
    });
});

// apply or invite for shift
// applyOrInvite must be string "apply" or "invite"
app.put('/shifts/:shiftId/:applyOrInvite/:werkerId/:positionName', (req, res) => {
  const {
    shiftId,
    applyOrInvite,
    werkerId,
    positionName,
  } = req.params;
  dbHelpers.applyOrInviteForShift(shiftId, werkerId, positionName, applyOrInvite)
    .then(() => {
      res.send(201);
    })
    .catch((error) => {
      console.log(error, 'unable to apply');
      res.status(500).send('unable to apply');
    });
});

// accept or decline shift
app.patch('/shifts/:shiftId/application/:werkerId/:status', (req, res) => {
  const { shiftId, werkerId, status } = req.params;
  dbHelpers.acceptOrDeclineShift(shiftId, werkerId, status)
    .then(() => {
      res.send(204);
    })
    .catch((error) => {
      console.log(error, 'unable to accept/decline');
      res.status(500).send('unable to accept/decline');
    });
});

app.put('/auth', (req, res) => {
  const { tokens } = google;
});

const port = process.env.PORT || 4000;
// models.sequelize.sync();

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

// Core dependencies
const path = require('path');


// NPM dependencies
const express = require('express');
const router  = express.Router();
const dotenv  = require('dotenv');
const Email   = require('email-templates');


const { check, validationResult } = require('express-validator');


// Run before other code to make sure variables from .env are available
dotenv.config();


// Email templates
const templateConfirm = path.join(__dirname, '../templates/confirm/');
const templateSubscribed = path.join(__dirname, '../templates/subscribed/');


const email = new Email({
  message: {
    from: 'GOV.UK Email <gov.uk.doubleoptin@gmail.com>'
  },
  transport: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    }
  },
  views: {
    options: {
      extension: 'njk'
    }
  },
  send: true,
  preview: true
});


// Email updates
router.post('/email/email-updates',

  [
    check('your-email')
      .not()
      .isEmpty()
      .withMessage('Enter your email address'),

    check('your-email')
      .isEmail()
      .withMessage('Enter a valid email address')
  ],

  function(req, res) {

    var errors = validationResult(req).array()[0];

    if(errors) {

      var summaryError;
      var inlineError = errors.msg;
      var pageObject;

      if (inlineError != 'Enter your email address') {
        summaryError = inlineError;
      } else {
        summaryError = 'You must provide your email address'
      }

      pageObject = {
        errors: errors,
        summaryError: summaryError,
        inlineError: {
          text: inlineError
        }
      }

      res.render('email/email-updates', pageObject);

    } else {

      res.redirect('/email/email-frequency');

    }

});


// When do you want to be updated about changes?
router.post('/email/email-frequency',

  [
    check('email-frequency')
      .not()
      .isEmpty()
      .withMessage('Choose when you want to receive updates'),
  ],

  function(req, res) {

    var errors = validationResult(req).array()[0]; // Just get one error

    if(errors) {

      var summaryError;
      var inlineError = errors.msg;
      var pageObject;

      if (inlineError != 'Choose when you want to receive updates') {
        summaryError = inlineError;
      } else {
        summaryError = 'You must choose when you want to receive updates'
      }

      pageObject = {
        errors: errors,
        summaryError: summaryError,
        inlineError: {
          text: inlineError
        }
      }

      res.render('email/email-frequency', pageObject);

    } else {

      if (req.session.data['confirm'] != 1) {

        // Store in a session (send email once)
        req.session.data['confirm'] = 1;

        // Send email script
        email.send({
          template: templateConfirm,
          message: {
            to: req.session.data['your-email']
          }
        });

      }

      res.redirect('/email/check-email');

    }

});


// You’ve subscribed
router.get('/email/subscribed/:id', function(req, res) {

  var id = req.params.id;

  if (id === '1' && req.session.data['subscribed'] != 1) {

    // Store in a session (send email once)
    req.session.data['subscribed'] = 1;

    // Send email script
    email.send({
      template: templateSubscribed,
      message: {
        to: req.session.data['your-email']
      }
    });

  }

  res.render('email/subscribed');

});


// Email link expired
router.get('/email/email-link-expired', function(req, res) {

  // Kill session data
  req.session.destroy();

  res.render('email/email-link-expired');

});


module.exports = router;

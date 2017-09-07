const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
const router = express.Router();
router.use(bodyParser.json());
const userController = require('../controllers/userController');
const { Recipe, User } = require('../models');

const {
  // Assigns the Strategy export to the name JwtStrategy using object
  // destructuring
  // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#Assigning_to_new_variable_names
  Strategy: JwtStrategy,
  ExtractJwt
} = require('passport-jwt');
const { JWT_SECRET } = require('../config');

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

router.post('/signup', userController.register);

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
},
  function (req, username, password, done) {
    process.nextTick(function () {
      User.findOne({ username: username }, function (err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, req.flash('error', 'Invalid username or password'));
        }
        console.log('password:' + password);
        console.log('user' + user);
        console.log('username' + username);
        console.log('req' + req.body);
        if (user.validatePassword(password)) {
          console.log('password1:' + password);
          return done(null, user);
        }
        else if (!user.validatePassword(password)) {
          console.log('failed');
          return done(null, false, req.flash('error', 'Invalid username or password'));
        }
      });
    })
  }
))

router.post('/login',
  passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/failed'
  }), (req, res) => {
    if (req.user) {
      res.end(JSON.stringify({
        status: true
      })
    )}
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const app = express();
var cors = require('cors');
const {PORT, DATABASE_URL, CLIENT_ORIGIN} = require('./config.js');
const {User} = require('./models')
const userRouter = require('./routers/userRouter');
const recipeRouter = require('./routers/recipeRouter');
const userController = require('./controllers/userController');
mongoose.Promise = global.Promise;

app.use(morgan('common'));
app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
  secret: 'keyboard cat',
  saveUninitialized: true,
  resave: true,
  store: new MongoStore({
    url: DATABASE_URL,
    collection: 'sessions'
  })
}));

app.use(cors({
    origin: CLIENT_ORIGIN
}));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(204);
  }
  next();
});

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.get('/api/protected',
passport.authenticate('jwt', {session: false}),
(req, res) => {
    return res.json({
        data: 'rosebud'
    });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    console.log('no way jose');
    res.redirect('/');
  }
}
app.get('/failed', (req, res) => {
  res.json({status:false});
})
app.use('/api/users', userRouter);
app.use('/api/recipes', recipeRouter); 
// app.get('/notecard',ensureAuthenticated,(req, res) => {
//   res.status(200).sendFile(__dirname + '/public/notecard.html');
// });
app.get('/test', ensureAuthenticated, (req, res) => {
  console.log('testing');
  res.end('hello');
})

app.get('/logout', userController.logout);

app.use('*', (req,res) => {
  res.status(404).json({message: 'Request not found'});
});

let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Server started on port: ${port}`);
        console.log(databaseUrl);
        resolve();
      })
      .on('error', err => {
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};

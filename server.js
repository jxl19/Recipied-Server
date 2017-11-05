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
var multer = require('multer');
var path = require('path');
var fs = require('fs');
const uuidv4 = require('uuid/v4');

const config = require('./config');
var JwtStrategy = require('passport-jwt').Strategy,
ExtractJwt = require('passport-jwt').ExtractJwt;
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = config.JWT_SECRET;

passport.use(new JwtStrategy(jwtOptions, (jwt_payload, done) => {
  console.log("userid: " + jwt_payload.user.id);
  console.log(jwt_payload);

User.findOne({ id: jwt_payload.user.id }, function (err, user) {
    if (err) {
      console.log('err: ' + err)
        return done(err, false);
    }
    var user = jwt_payload.user.id;
    if (user) {
      console.log('inside user: ' + user)
        done(null, user);
    } else {
      console.log('else');
        done(null, false);
        // or you could create a new account 
    }
});
}, (e) => console.log(e)));

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

app.get("/secret", passport.authenticate('jwt', { session: false }), function(req, res){
  res.json("Success! You can not see this without a token");
});

const storage = 
multer.diskStorage({
    destination: './uploads',
    filename(req, file, cb) {
    id = uuidv4();
    req.imageid = id;
    console.log("filename: " + file.originalname);
    cb(null, `${id}.jpg`);
  },
});

const upload = multer({ storage });
app.post('/api/upload', upload.single('file'), function(req, res) {
  console.log(req.imageid);
  res.header("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify({imageid : req.imageid}));
})

app.get('/api/file/:id', function (req, res, next) {
  
    var options = {
      root: __dirname + '/uploads/',
      dotfiles: 'deny',
      headers: {
          'x-timestamp': Date.now(),
          'x-sent': true
      }
    };
  
    var fileName = req.params.id + '.jpg';
    res.sendFile(fileName, options, function (err) {
      if (err) {
        next(err);
      } else {
        console.log('Sent:', fileName);
      }
    });
  
  });

app.get('/failed', (req, res) => {
  res.json({status:false});
})

app.use('/api/users', userRouter);
app.use('/api/recipes', recipeRouter); 
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
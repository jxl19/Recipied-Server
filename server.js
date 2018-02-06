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
const {PORT, DATABASE_URL, CLIENT_ORIGIN, ACCESS_KEY_ID, SECRET_ACCESS_KEY} = require('./config.js');
const {User} = require('./models')
const userRouter = require('./routers/userRouter');
const recipeRouter = require('./routers/recipeRouter');
const userController = require('./controllers/userController');
mongoose.Promise = global.Promise;
var multer = require('multer');
var path = require('path');
var fs = require('fs');
const uuidv4 = require('uuid/v4');
var aws = require('aws-sdk');
var multerS3 = require('multer-s3');
const config = require('./config');
var JwtStrategy = require('passport-jwt').Strategy,
ExtractJwt = require('passport-jwt').ExtractJwt;
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = config.JWT_SECRET;

var s3 = new aws.S3({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY
})

passport.use(new JwtStrategy(jwtOptions, (jwt_payload, done) => {
  console.log("userid: " + jwt_payload.user.id);
  console.log(jwt_payload);

User.findOne({ id: jwt_payload.user.id }, function (err, user) {
    if (err) {
        return done(err, false);
    }
    var user = jwt_payload.user.id;
    if (user) {
        done(null, user);
    } else {
        done(null, false);
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

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'recipied/uploads',
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      id = uuidv4();
      var fileName = id +  path.extname(file.originalname);
      console.log(fileName);
      cb(null, fileName)
    }
  })
})

app.post('/api/upload', upload.single('file'), function(req, res, next) {
  res.send('Successfully uploaded file!')
})

app.get("/secret", passport.authenticate('jwt', { session: false }), function(req, res){
  res.json("Success! You can not see this without a token");
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
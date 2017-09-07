const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');
const validator = require('validator');
mongoose.Promise = global.Promise;

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: 'Please supply an username'
  },
  password: {
    type: String,
    required: true
  },
  recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }]
});

userSchema.statics.hashPassword = function (password) {
  return bcrypt
    .hash(password, 10)
    .then(hash => hash);
}
userSchema.methods.validatePassword = function (password) {
  return bcrypt
    .compareSync(password, this.password)
}

userSchema.methods.apiRepr = function () {
  return {
    id: this._id,
    username: this.username,
    password: this.password
  }
}
userSchema.plugin(mongodbErrorHandler);
const User = mongoose.model('User', userSchema);

//add steps to recipeschema

const recipeSchema = mongoose.Schema({
  username: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dishName: {type: String, required: true},
  nutritionLabels: {
      calories: {type:Number},
      fat: {type: Number},
      satFat: {type: Number},
      transFat: {type: Number},
      figer: {type: Number},
      sugar: {type: Number}
  },
  ingredients: {type: String, required: true},
  dietLabels: {type: String},
  healthLabels: {type: String},
});

recipeSchema.methods.apiResponse = function () {
  return {
    id: this._id,
    username: this.username,
    dishName: this.dishName,
    nutritionLabels: this.nutritionLabels,
    ingredients: this.ingredients,
    dietLabels: this.dietLabels,
    healthLabels: this.healthLabels
  }
}

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = { Recipe, User };
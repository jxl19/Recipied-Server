const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
mongoose.Promise = global.Promise;
const { Recipe } = require('../models');
router.use(bodyParser.json());

let currentUser;

//dispatch this in the frontend when we load up the page
router.get('/user', (req, res) => {
    console.log("user: " +  req.user);
    console.log("session" + req.session);
    if (req.user && req.user._id) {
        currentUser = req.user._id;
        console.log("userID: " + req.session.passport.user._id);
        console.log("requserid: " + req.user._id);
    }
    Recipe
    .find({username: currentUser})
    .exec()
    .then(recipe => {
        console.log(recipe);
        res.send(recipe)
    })
    
})

router.get('/get/:dishName', (req, res) => {

    if (req.session && req.user && req.user._id) {
        currentUser = req.user._id;
        console.log("userID: " + req.session.passport.user._id);
        console.log("requserid: " + req.user._id);
    }

    Recipe
        .find({ dishName: req.params.dishName })
        .exec()
        .then(recipe => {
            console.log("recipe: " + recipe);
            res.send(recipe);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Something went wrong' });
        })
});

router.get('/all', (req, res) => {
    Recipe
    .find()
        .exec()
        .then(recipes => {
            console.log("username: " + recipes.username);
            res.status(200).json(recipes.map(recipes => recipes.homePageRes()));   
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        });
})

router.get('/id/:id', (req, res ) => {
    Recipe
    .find({_id: req.params.id})
    .exec()
    .then(recipe => {
        console.log(recipe);
        res.send(recipe)
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    })
})
//update post req to take in 
//req.body.img should be a string that holds the id of the photo
router.post('/', (req, res) => {
    if (req.session && req.user && req.user._id) {
        currentUser = req.user._id;
        console.log("userID: " + req.session.passport.user._id);
        console.log("requserid: " + req.user._id);
    }
    console.log(req.body);
    //validate required fields
    const requiredFields = ['dishName', 'ingredients'];
    requiredFields.forEach(field => {
        if (!(field in req.body)) {
            const message = `Missing \'${field}'\ in request body`;
            console.error(message);
            res.status(400).send(message);
        }
    })
    Recipe
        .create({
            username: currentUser,
            dishName: req.body.dishName,
            ingredients: req.body.ingredients,
            calories: req.body.calories,
            steps: req.body.steps,
            image: req.body.image
        })
        .then(recipe => {
            res.status(201).json(recipe.apiResponse());
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Something went wrong' });
        });
});

// update put to have the other fields
// username, dishName, ingredients, calories, steps, image
router.put('/:id', (req, res) => {
    console.log(req.body._id);
    console.log(req.params.id);
    if (req.params.id !== req.body._id) {
        const message = (
            `Request path id (${req.params.id}) and request body id 
                    (${req.body._id}) must match`);
        console.error(message);
        return res.status(400).send(message);
    }
    const updateFields = ['dishName', 'ingredients', 'calories', 'steps', 'image'];
    const updateRecipe = {};
    updateFields.forEach(field => {
        if (field in req.body) {
            updateRecipe[field] = req.body[field];
        }
    });
    Recipe
        .findByIdAndUpdate(req.params.id, { $set: updateRecipe }, { new: true })
        .exec()
        .then(recipe => res.status(200).json(recipe.apiResponse()))
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        });
})

router.delete('/:id', (req, res) => {
    Recipe
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(() => {
            console.log('deleted');
            res.status(204).send('deleted');
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

module.exports = router;
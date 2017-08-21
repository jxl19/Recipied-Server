const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
mongoose.Promise = global.Promise;
const { Recipe } = require('../models');
router.use(bodyParser.json());

router.get('/get/:dishName', (req, res) => {

    Recipe
        .find({ dishName: req.params.dishName })
        .exec()
        .then(recipe => {
            res.send(recipe);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Something went wrong' });
        })
});

router.post('/', (req, res) => {
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
            dishName: req.body.dishName,
            nutritionLabels: req.body.nutritionLabels,
            ingredients: req.body.ingredients,
            dietLabels: req.body.dietLabels,
            healthLabels: req.body.healthLabels
        })
        .then(recipe => {
            res.status(201).json(recipe.apiResponse());
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Something went wrong' });
        });
});

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
    const updateFields = ['dishName', 'ingredients'];
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
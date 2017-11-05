const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const should = chai.should();
const { app, runServer, closeServer } = require('../server');
const { Recipe, User } = require('../models');
const { TEST_DATABASE_URL } = require('../config')
chai.use(chaiHttp);

function generateRecipe() {
    return{
        username:"561fa3aac09d1fa4eb63f806",
        dishName:faker.lorem.words(),
        calories:faker.random.number(1009),
        ingredients: [faker.lorem.words(), faker.lorem.words()],
        steps: [faker.lorem.words(), faker.lorem.words()],
        image: faker.lorem.words()
    }
}

function seedRecipeData() {
    const seedData = [];
    for(let i = 0; i < 10; i++) {
        seedData.push(generateRecipe());
    }
    return Recipe.insertMany(seedData);
}

function tearDownDb() {
    return mongoose.connection.dropDatabase();
}
//ignore tests for username for now?
describe('recipe API', function () {
    
        //starts server before each function
        before(function () {
            return runServer(TEST_DATABASE_URL);
        });
        //inserts seed data into collection before each function
        beforeEach(function () {
            return seedRecipeData();
        });
        //drops db connection after each function is done running to make sure state isn't maintained between tests
        afterEach(function () {
            return tearDownDb();
        });
        //closes server after function is done running
        after(function () {
            return closeServer();
        });
    //username, dishName, calories, ingredients, steps, image
        const expectedKeys = ['id', 'username', 'dishName', 'calories', 'ingredients', 'steps', 'image'];
        const eKeys = ['id', 'dishName', 'ingredients'];
        describe('GET endpoint', function () {
            it('should return all recipes', function () {
                let res;
                return chai.request(app)
                    .get('/api/recipes/all')
                    .then(res => {
                        console.log(res.body);
                        res.should.be.json;
                        res.should.have.status(200);
                        //at least one makes sure our db seeding worked
                        res.body.length.should.be.at.least(1);
                        res.body.forEach(recipe => {
                            recipe.should.be.a('object');
                            recipe.should.include.keys(eKeys);
                        })
                        return Recipe.count();
                    })
            });
    //username, dishName, calories, ingredients, steps, image
            it('should return recipes with the right fields', function () {
                let resRecipe;
                return chai.request(app)
                    .get('/api/recipes/all')
                    .then(res => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.length.should.be.at.least(1);
                        res.body.forEach(recipe => {
                            recipe.should.be.a('object');
                            recipe.should.include.keys(eKeys);
                        })
                        resRecipe = res.body[0];
                        return Recipe.findById(resRecipe.id);
                    })
                    .then(recipe => {
                        resRecipe.dishName.should.equal(recipe.dishName);
                        resRecipe.ingredients.should.be.an('array');
                    });
            });
        });
        describe('POST endpoint', function () {
            //make post request with data and prove what we get back has correct keys
            //username, dishName, calories, ingredients, steps, image 
            it('should add a new recipe', function () {
                const newRecipe = generateRecipe();
                return chai.request(app)
                    .post('/api/recipes')
                    .send(newRecipe)
                    .then(res => {
                        res.should.have.status(201);
                        res.should.be.json;
                        res.should.be.a('object');
                        res.body.should.include.keys(expectedKeys);
                        res.body.id.should.not.be.null;
                        res.body.dishName.should.equal(newRecipe.dishName);
                        res.body.calories.should.equal(newRecipe.calories);
                        res.body.image.should.equal(newRecipe.image);
                        return Recipe.findById(res.body.id);
                    })
                    .then(recipe => {
                        recipe.dishName.should.equal(newRecipe.dishName);
                        recipe.calories.should.equal(newRecipe.calories);
                        recipe.image.should.equal(newRecipe.image);
                    });
            });
        });
        describe('PUT endpoint', function () {
            it('should update fields you send over', function () {
                const updatedData = {
                    dishName: faker.lorem.words(),
                    calories: faker.random.number(1009),
                    image: faker.lorem.words()
                };
    
                return Recipe
                    .findOne()
                    .exec()
                    .then(recipe => {
                        updatedData._id = recipe.id;
                        return chai.request(app)
                            .put(`/api/recipes/${recipe.id}`)
                            .send(updatedData);
                    })
                    .then(res => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.should.be.a('object');
                        res.body.dishName.should.equal(updatedData.dishName);
                        res.body.calories.should.equal(updatedData.calories);
                        res.body.image.should.equal(updatedData.image);
                        return Recipe.findById(updatedData._id).exec();
                    })
                    .then(recipe => {
                        recipe.dishName.should.equal(updatedData.dishName);
                        recipe.calories.should.equal(updatedData.calories);
                        recipe.image.should.equal(updatedData.image);
                    });
            });
        });
        describe('DELETE endpoint', function () {
            it('should delete a recipe', function () {
                let deletedRecipe;
                return Recipe
                    .findOne()
                    .exec()
                    .then(delRecipe => {
                        deletedRecipe = delRecipe;
                        return chai.request(app)
                            .delete(`/api/recipes/${deletedRecipe.id}`);
                    })
                    .then(res => {
                        res.should.have.status(204);
                        return Recipe.findById(deletedRecipe.id).exec();
                    })
                    .then(delRecipe => {
                        should.not.exist(delRecipe);
                    });
            });
        });
    });
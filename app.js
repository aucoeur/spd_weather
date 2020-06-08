require('dotenv').config();

const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const request = require('request');

const mongoose = require("mongoose");
assert = require("assert");



// const url = process.env.MONGODB_URI;
const {
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_HOSTNAME,
  MONGO_PORT,
  MONGO_DB
} = process.env;

const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
mongoose.Promise = global.Promise;
mongoose.connect(
        url, {
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true,
            useUnifiedTopology: true
        }).then(function () {
        console.log('MongoDB is connected');
    })
    .catch(function (err) {
        console.log(err);
        // db.close(); // turn on for testing
    });

mongoose.connection.on("error", console.error.bind(console, "MongoDB connection Error:"));
mongoose.set("debug", true);

const WeatherMood = require('./models/WeatherMood')

const app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static('public'))
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', (req, res) => {
    res.render('home');
});

app.post('/', (req, res) => {
    let city = req.body.city
    let mood = req.body.mood
    let OpenWeatherAPI = process.env.OPEN_WEATHER_API
    let link = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OpenWeatherAPI}&units=imperial`

    request(link, function (err, response, body) {
        if (err) {
            res.render('index', {
                location: null,
                error: 'Uh oh, something didn\'t happen.  Please try again.'
            });
        } else {
            let location = JSON.parse(body)
            if (location.main == undefined) {
                res.render('home', {
                    location: null,
                    error: 'Uh oh, something didn\'t happen.  Please try again.'
                });
            } else {
                let weatherText = `It's ${location.main.temp} °F in ${location.name}.<br /><br />You're feeling ${mood}.`
                res.render('home', {
                    location: weatherText,
                    error: null
                })
            }
            const weatherMood = new WeatherMood({
                added: Date(),
                location: location.name,
                temperature: location.main.temp,
                mood: mood
            })

            weatherMood.save();

            console.log(weatherMood)

        }
    })

})

app.listen(3000, () => {
    console.log('Starter app listening on port 3000. http://localhost:3000')
});
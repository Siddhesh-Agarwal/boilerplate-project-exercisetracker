const express = require("express");
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const Exercise = require('./models/Exercise');
const User = require('./models/User')

require('dotenv').config()
app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))

// main page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const mongo_uri = process.env['MONGO_URI'];
mongoose.connect(mongo_uri)
	.then(() => {
		console.log('Connected to MongoDB')
	})
	.catch((err) => {
		console.log('Could not connect to MongoDB')
		console.log(err)
		console.log(mongo_uri)
	});

// Add new user
app.post('/api/users', async (req, res) => {
	const username = req.body.username;
	const newUser = new User({ username });
	res.json(await newUser.save());
});

// get all users
app.get('/api/users', async (req, res) => {
	res.json(await User.find({}));
});

// Add exercises
app.post('/api/users/:_id/exercises', async (req, res) => {
	const userId = req.params._id;
	const description = req.body.description;
	const duration = req.body.duration;
	let date = req.body.date;

	if (!date) {
		date = new Date();
	} else {
		date = new Date(date);
	}

	const exercise = new Exercise({
		userId,
		description,
		duration,
		date
	});

	const newExercise = await exercise.save();
	const user = await User.findById(userId);

	res.json({
		username: user.username,
		description: newExercise.description,
		duration: newExercise.duration,
		date: newExercise.date.toDateString(),
		_id: userId
	});
});

// get exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
	const userId = req.params._id;

	let { from, to, limit } = req.query;

	console.log(from);
	console.log(to);
	console.log(limit);

	let dateFilter = {};

	if (from) { dateFilter.$gte = new Date(from) };
	if (to) { dateFilter.$lte = new Date(to) };
	if (!limit) { limit = 500 };

	let filter = {};

	filter.userId = userId;
	if (from || to) {
		filter.date = dateFilter;
	}

	const user = await User.findById(userId);
	const exercises = await Exercise.find(filter).limit(limit);

	const count = exercises.length;

	res.json({
		_id: userId,
		username: user.username,
		count,
		log: exercises.map(e => {
			return {
				description: e.description,
				duration: e.duration,
				date: e.date.toDateString()
			}
		})
	});
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

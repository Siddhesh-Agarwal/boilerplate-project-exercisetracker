const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

let users = [];
let exercises = [];

app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists.' });
  }

  const newUser = {
    username: username,
    _id: uuidv4()
  };

  users.push(newUser);
  res.json(newUser);
});


// GET a list of all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// POST new exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  const user = users.find(u => u._id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required.' });
  }

  const exercise = {
    description: description,
    duration: parseInt(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString()
  };

  exercises.push({ userId: userId, ...exercise });

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: userId
  });
});

// GET full exercise log for a user
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const user = users.find(u => u._id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  let userExercises = exercises.filter(e => e.userId === userId);

  if (from) {
    const fromDate = new Date(from);
    userExercises = userExercises.filter(e => new Date(e.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    userExercises = userExercises.filter(e => new Date(e.date) <= toDate);
  }

  if (limit) {
    userExercises = userExercises.slice(0, parseInt(limit));
  }

  res.json({
    _id: userId,
    username: user.username,
    count: userExercises.length,
    log: userExercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date
    }))
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
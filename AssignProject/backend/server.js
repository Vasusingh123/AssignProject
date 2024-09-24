const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());


const mongoURI = 'mongodb+srv://rohan:12361236@coordinatedata.cceav.mongodb.net/';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('Error: ', err));
  

const CarMovementSchema = new mongoose.Schema({
  coordinates: { type: Array, required: true },
  timestamp: { type: Date, default: Date.now },
});

const CarMovement = mongoose.model('CarMovement', CarMovementSchema);

// Route to handle saving coordinates
app.post('/save-coordinates', async (req, res) => {
  try {
    console.log("working");
    const newMovement = new CarMovement(req.body);
    await newMovement.save();
    res.status(200).send('Coordinates saved successfully');
  } catch (err) {
    res.status(500).send('Error saving coordinates');
  }
});


app.get('/timestamps', async (req, res) => {
  try {
    const timestamps = await CarMovement.aggregate([
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, 
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json(timestamps.map(t => t._id));
  } catch (err) {
    res.status(500).send('Error fetching timestamps');
  }
});
app.get('/coordinates', async (req, res) => {
  const { date } = req.query;
  try {
    const coordinates = await CarMovement.find({
      timestamp: {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lt: new Date(`${date}T23:59:59.999Z`)
      }
    }).sort({ timestamp: 1 });

    res.status(200).json(coordinates);
  } catch (err) {
    res.status(500).send('Error fetching coordinates');
  }
});


app.listen(5000, () => {
  console.log('Server running on port 5000');
});

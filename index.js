require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Solution for generating a random string in js referenced from:
// https://stackoverflow.com/a/1349426/5472560
function makeShortUrl(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}


const shortenedUrlSchema = new mongoose.Schema({
  original: {
    type: String,
    required: true
  },
  shortened: {
    type: String,
    required: true,
    unique: true,
    minLength: 10,
    maxLength: 10,
    default: () => makeShortUrl(10)
  }
});

const ShortenedUrl = mongoose.model('Url', shortenedUrlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function (req, res) {
  const url = new ShortenedUrl({original: req.body.url});
  url.save(function(err, data) {
    if (err) {
      console.log(err);
      res.json({
        error: "Failed to create url",
        message: JSON.stringiy(err)
      });
    } else {
      res.json({
        original_url: req.body.url,
        short_url: data.shortened
      });
    }
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

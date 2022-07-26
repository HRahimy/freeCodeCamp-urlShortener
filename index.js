require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dns = require("node-dns");

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
  if (!req.body.url) {
    res.json({error: 'invalid url'});
    return;
  }
  let urlObject;
  try {
    urlObject = new URL(req.body.url);
  } catch (_) {
    res.json({error: 'invalid url'});
    return;
  }

  // Use of `dns.lookup` referenced and adapted from:
  // https://stackoverflow.com/a/59346937/5472560
  dns.lookup(urlObject.hostname, function(dnsErr, address, family) {
    if (dnsErr) {
      console.log(dnsErr);
      res.json({error: 'invalid url'});
      return;
    }
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
});

app.get('/api/shorturl/:shorturl', function(req, res) {
  ShortenedUrl.findOne({shortened: req.params.shorturl}, function(err, data) {
    if (err) {
      console.log(err);
      res.json({
        error: 'Could not find that url'
      });
    } else {
      res.redirect(data.original);
    }
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

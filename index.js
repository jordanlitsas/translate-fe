'use strict';

require('dotenv').config();
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json());

  app.use(express.static(__dirname + '/public'));


// Sets server port and logs message on success
const listener = app.listen(process.env.PORT || 3000, () => console.log('Server is live at ' + listener.address().port));
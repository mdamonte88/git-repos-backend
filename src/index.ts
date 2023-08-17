"use strict";

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import logger from 'morgan';

var indexRouter = require('./routes/index');
var repositoriesRouter = require('./routes/repositories');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(logger("dev"));

app.use('/', indexRouter);
app.use('/repos', repositoriesRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = app;

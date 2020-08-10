const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const methodOverride = require('method-override');


const app = express();

app.use(bodyParser.json());

app.use(methodOverride('_method'));

app.set('view engine','ejs');

app.get('/',(req,res)=>{
    res.render('index');
});

const port = 5000;

app.listen(port,()=> console.log(`Serveur demarrer sur le port : ${port}`));
//Initialisation des dependances
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose'); 
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

const app = express();

app.use(bodyParser.json());

app.use(methodOverride('_method'));

app.set('view engine','ejs');

// URL Mongo

const mongoUri = 'mongodb+srv://l1rmC89feM7yufZL:l1rmC89feM7yufZL@cluster0.wfyio.gcp.mongodb.net/tp-image?retryWrites=true&w=majority';

// Connection a la DB mongo

const conn = mongoose.createConnection(mongoUri);

let gfs;

conn.once('open',()=>{
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

//configuration de GridFS

const storage = new GridFsStorage({
    url: mongoUri,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });

  //Middleware
// GET Load Index
app.get('/',(req,res)=>{
   // res.render('index');
   gfs.files.find().toArray((err, files)=> {
       if(!files || files.length === 0){
           res.render('index',{files: false});
       } else{
           files.map(file=> {
               if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
                   file.isImage = true;
               } else{
                   file.isImage = false;
               }
           });
           res.render('index',{files: files});

       }
   });
    
});

    // POST Image Ajout d'une nouvelle image
app.post('/upload',upload.single('file'), (req,res)=>{
    
    res.redirect('/');

});
 // Affichage des images
app.get('/image/:filename', (req, res)=>{
    gfs.files.findOne({ filename: req.params.filename },(err, file) =>{
        
        if(file.contentType ===  'image/jpeg' || file.contentType === 'image/png'){
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res)
        }
    });
});
// Route delete
app.delete('/files/:id', (req, res)=>{
    gfs.remove({_id: req.params.id, root: 'uploads'}, (err, gridStore)=>{
        if(err){
            return res.status(404).json({err: err});
        }
        res.redirect('/');
    });
});

const port = 5000;

app.listen(port,()=> console.log(`Serveur demarrer sur le port : ${port}`));

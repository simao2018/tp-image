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

// Method Override me permet ici de palier au fait que les Methode PUT & DELETE ne soient pas géré par les formulaires HTML
app.use(methodOverride('_method')); 

// EJS est un moteur de template

app.set('view engine','ejs');

// URL Mongo

const mongoUri = 'mongodb+srv://l1rmC89feM7yufZL:l1rmC89feM7yufZL@cluster0.wfyio.gcp.mongodb.net/tp-image?retryWrites=true&w=majority';

// Connection a la DB mongo

const conn = mongoose.createConnection(mongoUri);


let gfs;

// Je recupere la collection 'uploads'
conn.once('open',()=>{
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

//configuration de GridFS
// GridFS me permet de recuperer le fichier que l'utilisateur chargera
const storage = new GridFsStorage({
    url: mongoUri,
    file: (req, file) => {

      return new Promise((resolve, reject) => { // ici je retourne un objet de type Promise à l'interieur duquel j'effectue des traitements
        crypto.randomBytes(16, (err, buf) => { // J'effectue un cryptage du nom du fichier qui sera chargé par l'utilisateur
          if (err) {
            return reject(err); // en cas d'erreur je signifie à l'objet l'erreur
          }
          const filename = buf.toString('hex') + path.extname(file.originalname); // je retourne dans la constante filename la valeur de cryptage et celle de l'extension du fichier
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          }; // Ici on stocke dans l'objet fileinfo les proprietés filename, et la collection a l'interieur de laquelle elles sy trouvent
          resolve(fileInfo); // l'objet fileinfo sera retourné a l'issue du traitement
        });
      });
    }
  });
  const upload = multer({ storage });  // je passe en parametre à multer le fichier finale qu'il devra uploader

  //Middleware
// GET Load Index
app.get('/',(req,res)=>{ 
   // res.render('index');
   gfs.files.find().toArray((err, files)=> { // j'effectue une recherche complete dans ma bd pour recuperer tout les fichiers
       if(!files || files.length === 0){ // si il ny a aucun fichier on retourne au template false
           res.render('index',{files: false});
       } else{
           files.map(file=> { // ici on verifie si les fichiers chargés sont de types images
               if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
                   file.isImage = true;
               } else{
                   file.isImage = false;
               }
           });
           res.render('index',{files: files}); // on retourne les fichiers sous formes d'objet au template

       }
   });
    
});

    // POST Image Ajout d'une nouvelle image
app.post('/upload',upload.single('file'), (req,res)=>{ // on utilise la methode single de multer pour ajouter le fichier a notre collection
    
    res.redirect('/'); // on retourne sur la page d'accueil

});

 // Affichage des images individuellement dans l'url qui me permettait d'effectuer les tests
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
    gfs.remove({_id: req.params.id, root: 'uploads'}, (err, gridStore)=>{ // ici on supprime le fichier recu en parametre
        if(err){
            return res.status(404).json({err: err});
        }
        res.redirect('/');
    });
});

const port = 5000;

app.listen(port,()=> console.log(`Serveur demarrer sur le port : ${port}`));

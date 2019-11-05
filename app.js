const express = require('express');
const basicAuth = require('basic-auth');
const https = require('https');
const cors = require('cors');

//var privateKey = fs.readFileSync('keys/major.key','utf8');
//var certificate = fs.readFileSync('certs/ssl_cert.crt', 'utf8');

//var cred = {key: privateKey, cert: certificate};
const face_detection = require('./beta.js');
const app = express();
//const httpsServer = https.createServer(cred, app)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/api/v1/test', /*auth.auth,*/ face_detection.test);
app.get('/api/v1/cred', auth, face_detection.credTest);
app.post('/api/v1/face', auth, face_detection.run);

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.status(err.status || 500);
  res.render('error');
});

//httpsServer.listen(49555);
console.log('serving on 4955')
//console.log(app)
app.listen(4955)
//module.exports = app;

function auth(req, res, next) {
  const user = basicAuth(req)


  if (!user || !user.name || !user.pass){
    return res.status(400).send('unauthorized');
  }
  else if ( user.name == 'jason' && user.pass == 'iNeedCoffee2day'){
    return next()
  }
  return res.status(400).send('unauthorized');

}
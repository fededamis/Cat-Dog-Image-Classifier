const express = require('express');
const server = express();
const tf = require('@tensorflow/tfjs-node');
const request = require('request');
const { promisify } = require('util');
const fs = require('fs');
const sharp = require("sharp"); 
const cors = require('cors');
const path = require('path');

sharp.cache(false);
server.use(cors());

// Make all the files in 'public' available
server.use(express.static(path.join(__dirname, 'public')));
// Parse URL-encoded bodies (as sent by HTML forms)
server.use(express.urlencoded({limit: '5mb'}));
// Parse JSON bodies (as sent by API clients)
server.use(express.json({limit: '5mb'}));
 
var model = null; 
(async () => { 
    var modelPath = tf.io.fileSystem("./public/graph_model/model.json");   
    model = await tf.loadGraphModel(modelPath);
})();    
    
const extendedPromisify = (fn) => {
    return (...args) => {
        return new Promise((resolve, reject) => {
        function customCallback(err, ...results) {

            if (err) 
                return reject(err)
          
            return resolve(results.length === 1 ? results[0] : results) 
        }
        args.push(customCallback)
        fn.call(this, ...args)
        })
    }
}

async function downloadImage (url, path) {
    return new Promise((resolve, reject) => {
        request(url).pipe(fs.createWriteStream(path)
            .on('finish', () => resolve())
            .on('error', () => reject())
        );        
    });
}

server.get("/", (req, res) => {   
    res.sendFile(__dirname  + '/public/index.html');
 });

server.post("/predict", async (request, response) => {  
    
    var imgBase64 = request.body.image;   
    var imgBuffer = Buffer.from(imgBase64, 'base64');
    imgBuffer = await sharp(imgBuffer).toFormat('jpg').toBuffer();          
    var imgArray =  new Uint8Array(imgBuffer);

    //Al setear un startScope y un endScope todos los tensores se liberan de memoria 
    //al finalizar el bloque entre start-endScope
    tf.engine().startScope();  
  
    //Preprocessing antes de ingresar input al modelo
    var imgTensor = tf.node.decodeJpeg(imgArray)
        .resizeNearestNeighbor([224, 224])
        .toFloat();

    //Normalizo valores entre 0 y 1
    var inputMin = imgTensor.min();
    var inputMax = imgTensor.max();
    imgTensor = imgTensor.sub(inputMin).div(inputMax.sub(inputMin));
    
    imgTensor = imgTensor.expandDims();         

    var prediction = await model.predict(imgTensor).data();
    var predictedValue = prediction[0].toString();
    console.log("PredictedValue: " + predictedValue);
  
    //Limpio variables    
    imgBuffer = null;
    imgArray = null;
    tf.dispose(imgTensor);
    tf.dispose(prediction);   
    console.log(tf.memory()); 
  
    tf.engine().endScope();

    response.json({"predictedValue": predictedValue});
   
});

var port = process.env.PORT || 3000;

const listener = server.listen(port, () => {
    console.log("Server listening at port " + port);
});      
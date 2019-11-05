const faceapi = require('face-api.js')
const fs = require('fs')
require('@tensorflow/tfjs-node')
const path = require('path')
const canvas = require('canvas')

const Canvas = canvas.Canvas
const Image =  canvas.Image
const ImageData = canvas.ImageData
const loadImage = canvas.loadImage
/*
const leonard = 'https://vignette.wikia.nocookie.net/bigbangtheory/images/e/ea/64.jpg'
const penny = 'https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Penny_bigbangtheory.jpg/250px-Penny_bigbangtheory.jpg'
const groupPhoto1 = 'https://rodstaf.com/misc/group1.jpeg' //xavierGroup //'https://ichef.bbci.co.uk/news/660/cpsprodpb/28F3/production/_103138401_gettyimages-89569689.jpg'
const groupPhoto2 = 'https://rodstaf.com/misc/group2.jpeg' //SanaaGroup //'https://i0.wp.com/metro.co.uk/wp-content/uploads/2019/01/sei_46502613-628c.jpg?quality=90&strip=all&zoom=1&resize=644%2C394&ssl=1'
const xavier = 'https://rodstaf.com/misc/xavier.jpeg'
const sanaa = 'https://rodstaf.com/misc/sanaa.jpeg'
*/

let REFERENCE_IMAGE = ''
let QUERY_IMAGE = ''

faceapi.env.monkeyPatch({ Canvas, Image, ImageData, loadImage });
const baseDir = path.resolve(__dirname, './out')

function saveFile(fileName, buf) {
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir)
  }
  fs.writeFileSync(path.resolve(baseDir, fileName), buf)
}

function test( req, res) { return res.json('I see you have entered my space')}
function credTest( req, res) { return res.json('Creds looking good muchacho')}

async function run(req, res) {
  const obj = req.body;
  console.log(obj)
  if (!obj || obj == {} || !obj.reference_Url || !obj.query_Url) return res.status(400).send('invalid params');

  // url check to make sure they are valid. eg: no spaces, etc
  REFERENCE_IMAGE = obj.reference_url
  QUERY_IMAGE = obj.query_url
  //load a reference photo & compare to a query single face photo
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./weights')
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./weights')
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./weights')
  console.log('loaded models')

  const reference = await loadImage(REFERENCE_IMAGE)
  const query = await loadImage(QUERY_IMAGE)

  const reference_photo = await faceapi
    .detectAllFaces(reference)
    .withFaceLandmarks()
    .withFaceDescriptors()

  if (!reference_photo.length) {
    //return 'no faces detected in reference image'
    console.log('no reference faces')
    return res.send({result: -2, message:'no faces detected in reference image'})
  }

  console.log('finished reference photo')
  let draw = faceapi.createCanvasFromMedia(reference)
  faceapi.draw.drawDetections(draw, reference_photo)
  saveFile('reference.jpg', draw.toBuffer('image/jpeg'))

  const faceMatcher = new faceapi.FaceMatcher(reference_photo)

  const face_to_detect =  await faceapi.detectSingleFace(query)
    .withFaceLandmarks()
    .withFaceDescriptor()

  console.log('finished query photo')
  if (face_to_detect) {
    //console.log(JSON.stringify(singleResult, null, 2))
    const bestMatch = faceMatcher.findBestMatch(face_to_detect.descriptor)
    draw = faceapi.createCanvasFromMedia(query)
    faceapi.draw.drawDetections(draw, face_to_detect)
    saveFile('face_to_match.jpg', draw.toBuffer('image/jpeg'))
    const feedback = bestMatch.toString().split(' ')
    let confidence = parseInt(feedback[2].slice(0, -1))
    console.log(feedback)
    console.log(confidence)
    //if level of confidence is <45 result = 0
    if (feedback[0] === 'person' && confidence > 0.45  ) { //&& feedback[1].indexOf(conidence) > 0.44 {
      return res.send({result:1, confidence , message: 'query image is present in reference photo'})
    }
    console.log('no match with query face')
    return res.send({result:0, message: 'query image was not found in reference photo'})

  }
  console.log('no query face')
  return res.send({result:-1, message: 'no face was detected in query image'})

}
module.exports = {run, credTest, test}

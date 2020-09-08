
// setup express server
const express  = require('express')
const aws      = require('aws-sdk')
const fs       = require('fs')
const app      = express()


// load aws config
aws.config.loadFromPath(__dirname + '/config/aws-config.json')

// load and override endpoints (if config file exists)
let configFile = null
try {
  configFile = fs.readFileSync(__dirname + '/config/aws-override.json','utf8')
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('No local AWS endpoint config found, using dafault routing to AWS')
  } else {
    throw (err)
  }
}

// if found, parse override config
if (configFile) {
  overrides = JSON.parse(configFile)

  console.log('Overriding AWS SQS endpoint to:', overrides.sqs_endpoint)
  console.log('Overriding AWS SNS endpoint to:', overrides.sns_endpoint)

  aws.config.sqs = { 'endpoint': overrides.sqs_endpoint }
  aws.config.sns = { 'endpoint': overrides.sns_endpoint }
  aws.config.dynamodb = { 'endpoint': overrides.sns_endpoint }
}


// this is the main object for holding all the UI data rendered in ejs templates
// date for the various UI menu items is held in the 'data' array.
//
// menuitem is used to hold the currently active / selected menu items to be displayed,
// when index.ejs is loaded, it invokes a javascript function to enable the required div section using
// this variable.
//
// the def_* variables are used to hold default / prepop values for the various input boxes

const ui = {
  menuitem: 1,
  data: [],
  def_snsname: '',
  def_snsarn: '',
  def_sqsname: '',
  def_sqsurl: '',
  def_sqsar: '',
  def_subarn: '',
  def_msghandle: ''
}


const snsController = require('./controllers/snsController')
const sqsController = require('./controllers/sqsController')
const { createServer } = require('./lib/backend')

snsController(aws, app, ui)
sqsController(aws, app, ui)
createServer(aws, app, ui)

// server listen port - can be overriden by an environment variable
const port = process.env.PORT || 3000

// configure assets and views
app.use('/assets', express.static(__dirname+'/public'))
app.set('views', __dirname+'/views')
app.set('view engine', 'ejs')


// login and serve up index
app.get('/', function (req, res) {
  res.setHeader('Content-Type', 'text/html')
  res.render('./index', {ui: ui})
})


// Start server.
app.listen(port)
console.log('AWS SNS SQS test server listening on port', port)





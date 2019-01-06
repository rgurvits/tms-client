var rp = require('promise-request-retry');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const winston = require('winston');
const crypto = require('crypto');
var randomstring = require('randomstring');
var utils = require('./lib/utils.js');
 

var config = JSON.parse(fs.readFileSync('config.json','utf8'));
var report_body = JSON.parse(fs.readFileSync('./bodys/telemetry.json','utf8'));  

var log_level =  config.log_level;  
var agentsArray = [];

const logger = winston.createLogger({
  transports: [
  //  new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/combined.log', level: log_level }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
});


var send_report = async function(sub_domain, auth, report_body) {
    var options = {
            method: 'POST',
            uri: `https://ch-${sub_domain}/analytics/telemetry`,
            headers : {'X-Auth': auth},
            json: true, // Automatically stringifies the body to JSON
            retry : 5,
            family: 4,
            verbose_logging : false,
            resolveWithFullResponse: true,
            body: report_body
            };
       
        // send prevention
    let response = await rp(options);
    response.statusCode === 200 ? logger.debug('Report Sent: ' + new Date().toISOString()  + "\
     " + response.statusCode) : logger.error('Report Failed : \
        ' + new Date().toISOString() + " " + response.statusCode);
};

async function testScenario(sub_domain, agentsArray){
    for (var j =0 ; j< agentsArray.length; j++)
    {
        send_report(sub_domain, agentsArray[j], report_body);   
    }
}


// go over all tennats
let tenants;
var firstKey = Object.keys(config.environments)[0];
process.argv[2] == undefined ? tenants = config.environments[firstKey] : tenants = config.environments[process.argv[2]];
tenants.forEach(function(tenant) {
     // load agents auth
    var agentsArray = utils.loadAgents(tenant.agentWH);
    // generate hashes    
    var arrayHashes = utils.generateHashes(config.num_preventions);  
    
    testScenario(tenant.subdomain,agentsArray);
});








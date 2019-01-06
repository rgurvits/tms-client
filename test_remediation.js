var rp = require('promise-request-retry');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const winston = require('winston');
const crypto = require('crypto');
var randomstring = require('randomstring');
var utils = require('./lib/utils.js');
 

var config = JSON.parse(fs.readFileSync('config.json','utf8'));
var remediation_body = JSON.parse(fs.readFileSync('./bodys/remediation.json','utf8'));  
var loaded_prevention_body = fs.readFileSync('./bodys/prevention.json','utf8');  

var log_level =  config.log_level;  
var agentsArray = [];

const logger = winston.createLogger({
  transports: [
  //  new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/combined.log', level: log_level }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
});


var send_prevention_quarantined = async function(sub_domain, auth, prevention_key, prevention_body, remediation_body) {
    prevention_body.body.preventionKey = prevention_key;
    var prevention = {
            method: 'POST',
            uri: `https://ch-${sub_domain}/operations/reports/preventions`,
            headers : {'X-Auth': auth},
            json: true, // Automatically stringifies the body to JSON
            retry : 5,
            family: 4,
            verbose_logging : false,
            resolveWithFullResponse: true,
            body: prevention_body
            };
       
        // send prevention
    let response_prevention = await rp(prevention);
    response_prevention.statusCode === 200 ? logger.debug('Prevention Sent: ' + new Date().toISOString() +  " \
        " + prevention_key + " " + response_prevention.statusCode) : logger.error('Prevention Failed : \
        ' + new Date().toISOString() +  " " + prevention_key + " " + response_prevention.statusCode);

    remediation_body.messages[0].body.mode = 7; 
    
    remediation_body.messages[0].body.preventionKey = prevention_key;
    var remediation = {
            method: 'POST',
            uri: `https://ch-${sub_domain}/operations/reports/periodic`,
            headers : {'X-Auth': auth},
            json: true, // Automatically stringifies the body to JSON
            retry : 5,
            family: 4,
            verbose_logging : false,
            resolveWithFullResponse: true,
            body: remediation_body
            };
    let response_qr_pending = await rp(remediation);
        response_qr_pending.statusCode === 200 ? logger.debug('Quarantine Pending Sent: ' + new Date().toISOString() +  " \
        " + prevention_key + " " + response_qr_pending.statusCode) : logger.error('Quarantine Pending Failed : \
        ' + new Date().toISOString() +  " " + prevention_key + " " + response_qr_pending.statusCode);

  // send Remediation event Done
    remediation_body.messages[0].body.preventionKey = prevention_key;
    remediation_body.messages[0].body.mode = 1;   //    if (response.statusCode === 200)
    let response_qr_done = await rp(remediation);
     response_qr_done.statusCode === 200 ? logger.debug('Quarantined Sent: ' + new Date().toISOString() +  " \
        " + prevention_key + " " + response_qr_done.statusCode) : logger.error('Quarantined Failed : \
        ' + new Date().toISOString() +  " " + prevention_key + " " + response_qr_done.statusCode);
};

async function testScenario(sub_domain, agentsArray, arrayHashes){
    for (var j =0 ; j< agentsArray.length; j++)
    {
        for (var i = 0 ; i<arrayHashes.length; i++)
        {
            var prevention_key = uuidv4(); 
            var prevention_body = JSON.parse(JSON.stringify(JSON.parse(loaded_prevention_body)).split('$HASH').join(arrayHashes[i])); 
            send_prevention_quarantined(sub_domain, agentsArray[j],prevention_key, prevention_body, remediation_body);   
        }
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
    
    testScenario(tenant.subdomain,agentsArray, arrayHashes);
});








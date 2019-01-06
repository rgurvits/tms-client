const fs = require('fs');
const uuidv4 = require('uuid/v4');
const winston = require('winston');
const crypto = require('crypto');
var randomstring = require('randomstring');
 

var config = JSON.parse(fs.readFileSync('./config.json','utf8'));



module.exports = {
    loadAgents: function (agents_dir)
        {
            if (!fs.existsSync(agents_dir)) {
                console.log(`Directory not exist: ${agents_dir},  register agents first ` );
            return;            
            }
            agentsArray = [];
            fs.readdirSync(agents_dir).forEach(file => {
                agentsArray.push(fs.readFileSync(agents_dir + '/'+ file,'utf8'));
                });
                return agentsArray;
        },
    generateHashes: function(num_preventions){
        var arrayHashes = [];
        for (var j=0; j<num_preventions; j++)
        {
            var hash = crypto.createHmac('sha256', new Date().toISOString()).update(randomstring.generate()).digest('hex');
             arrayHashes.push(hash);
        }
        return arrayHashes;
    }
};


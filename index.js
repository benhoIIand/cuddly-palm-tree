var series = require('es6-promise-series');
var fs = require('fs');
var glob = require('glob');
var request = require('request');
var exec = require('ssh-exec');
var wol = require('node-wol');

var CONVERTER_FILE = 'C:/mp4_converter/manual.py';
var SSH_CREDENTIALS = 'admin@nas';
var PC_MAC_ADDRESS = '50-E5-49-EF-98-39';
var PROCESSING_FOLDER = 'C:/Users/ben/Projects/cuddly-palm-tree/temp/ready';
var DEST_FOLDER = 'C:/Users/ben/Projects/cuddly-palm-tree/temp/done';
var WEBHOOK_URL = 'https://hooks.slack.com/services/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';

getFilesToProcess()
    .then(files => series(files.map(processFile)))
    .then(console.log)
    .catch(console.error);

function getFilesToProcess() {
    return new Promise((resolve, reject) => {
        glob(`${PROCESSING_FOLDER}/**/*`, (error, files) => {
            if (error) {
                reject(error);
            } else {
                resolve(files);
            }
        })
    });
}

function processFile(file) {
    var command = `python ${CONVERTER_FILE} -a -i "${file}" -m "${DEST_FOLDER}"`;

    return new Promise((resolve, reject) => {
        console.info('Waking up PC');

        wol.wake(PC_MAC_ADDRESS, function(error) {
            if (error) {
                reject(error);
            } else {
                console.info(`Attempting to transcode ${file}`);
                console.info('Command:', command);

                setTimeout(() => {
                    resolve(file)
                }, 5000);

                exec(command, SSH_CREDENTIALS, function() {
                    resolve(file);
                });
            }
        });
    });
}

function sendNotification(text) {
    request.post(WEBHOOK_URL, {
        json: {
            text
        }
    }, (error, response, body) => {
        if (error) {
            throw Error(error);
        }
    });
}

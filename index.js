const glob = require('glob');
const request = require('request');
const wol = require('node-wol');

const SERVER_HOST = 'http://192.168.0.2:3210';
const PC_MAC_ADDRESS = '50-E5-49-EF-98-39';
const ROOT_DIR = 'C:/Users/ben/Projects/cuddly-palm-tree';
const PROCESSING_FOLDER = `${ROOT_DIR}/temp/ready`;
const DEST_FOLDER = `${ROOT_DIR}/temp/done`;

getFilesToProcess()
    .then(sendProcessRequest)
    .then(response => {
        const queueId = response.body.id;
        console.info('Queue ID:', queueId);

        return getQueueStatus(queueId);
    })
    .catch(error => {
        throw new Error(error);
    });

function getQueueStatus(id) {
    return new Promise((resolve, reject) => {
        const poll = setInterval(() => {
            request.get(`${SERVER_HOST}/queue/${id}`, (error, response, body) => {
                if (error) {
                    reject(error);
                }

                console.log(body);

                if (body.completed) {
                    clearInterval(poll);
                    resolve();
                }
            });
        }, 3000);
    });
}

function wakeUpServer(file) {
    return new Promise((resolve, reject) => {
        console.info('Waking up PC');

        wol.wake(PC_MAC_ADDRESS, function(error) {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

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

function sendProcessRequest(files) {
    return new Promise((resolve, reject) => {
        request.post(`${SERVER_HOST}/process`, {
            json: {
                files: files.map(x => x.replace(ROOT_DIR, ''))
            }
        }, (error, response, body) => {
            if (error) {
                reject(error);
            }

            resolve(response);
        })
    });
}

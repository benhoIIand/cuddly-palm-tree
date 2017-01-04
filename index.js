const glob = require('glob');
const request = require('request');
const wol = require('node-wol');

const SERVER_HOST = 'http://192.168.0.2:3210';
const PC_MAC_ADDRESS = '50-E5-49-EF-98-39';
const ROOT_DIR = 'P:';
const PROCESSING_FOLDER = `${ROOT_DIR}/Converting/TV/`;
const DEST_FOLDER = `${ROOT_DIR}/Indexing/`;

wakeUpPC()
    .then(getFilesToProcess)
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

function wakeUpPC() {
    return new Promise((resolve, reject) => {
        console.info('Waking up PC');

        wol.wake(PC_MAC_ADDRESS, {
            address: '192.168.0.2',
        }, function(error) {
            if (error) {
                reject(error);
            } else {
                console.info('PC is waking up...');

                let tries = 0;
                
                function checkIfAwake() {
                    request.get(`${SERVER_HOST}`, (error, response, body) => {
                        if (error) {
                            reject(error);
                        }

                        tries++;

                        console.log('Tries', tries);
                        console.log('Status Code:', response.statusCode);

                        if (tries > 5) {
                            reject('PC failed to wake up');
                            return;
                        }

                        if (response.statusCode === 200) {
                            resolve();
                            return;
                        }

                        setTimeout(checkIfAwake, tries * 4000);
                    });
                }

                checkIfAwake();
            }
        });
    });
}

function getFilesToProcess() {
    return new Promise((resolve, reject) => {
        glob(`${PROCESSING_FOLDER}/**/*.@(mkv|mp4|avi)`, { nodir: true }, (error, files) => {
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

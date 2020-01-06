const {
    Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

const streams = require('stream');
const fs = require('fs');
const axios = require("axios");
const httpAdapter = require('axios/lib/adapters/http');
const mscabBeginPattern = Buffer.from([0x4d, 0x53, 0x43, 0x46, 0x00, 0x00, 0x00, 0x00]);
class SoftpaqExtractTransform extends streams.Transform {
    _cabFound = 0;
    _cabPatternIndex = 0;

    _totalReadBytes = 0;

    constructor() {
        super();
    }

    _transform(chunk, encoding, callback) {
        const buffer = chunk;
        let offset = 0;

        while(offset < buffer.length)
        {
            console.log("TP-1 : ", this._cabFound, " :: ", this._totalReadBytes, process.pid);

            if (this._cabFound == 0) {
                const beginIndex = buffer.indexOf(mscabBeginPattern);
                if (beginIndex >= 0) {
                    offset = beginIndex;
                    // this._cabFound = 1;
                    this._cabPatternIndex = 0;
                    console.log("BEGIN PATTERN FOUND: ", (this._totalReadBytes + offset));
                    console.log("this._cabFound =>", this._cabFound);
                }else{
                    console.log("TP-1.5  ", beginIndex);
                    break;
                }
            }
            console.log("*********************************************************************************");
            console.log("*********************************************************************************");
            console.log("*********************************************************************************");
            console.log("*********************************************************************************");
            console.log("*********************************************************************************");
            console.log("*********************************************************************************");
            console.log("*********************************************************************************");
            console.log("*********************************************************************************");
            console.log("*********************************************************************************");
            console.log("*********************************************************************************");
        }

        console.log("Loop out");

        this._totalReadBytes += buffer.length;
        callback();
    }
}

function doit() {
    axios.get("ftp://ftp.hp.com/pub/softpaq/sp74001-74500/sp74100.exe", {
        responseType: 'stream',
        adapter: httpAdapter
    }).then(response => {
        return new Promise((resolve, reject) => {
            const fileout = fs.createWriteStream("D:\\temp\\sp74100.cab");
            response.data
                .pipe(new SoftpaqExtractTransform())
                .pipe(fileout)
                // .pipe(cabinetExtract)
                .on('error', (err) => {
                    console.log('createWriteStream error: ', err);
                    reject(err);
                })
                .on('close', () => {
                    console.log('createWriteStream close: ');
                    resolve();
                })
        });
    }).then(() => {
        console.log("COMPLETE");
    }).catch((err) => {
        console.log("ERROR: ", err);
    });
}

if (isMainThread) {
    const worker = new Worker(__filename);
    worker.on('error', (err) => {
        console.log("WORKER ERROR : ", err);
    });
    worker.on('exit', (code) => {
        console.log("THREAD EXIT : ", code);
    });
} else {
    doit();
}

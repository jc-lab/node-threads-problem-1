import { expose } from 'threads/worker';
import { Observable } from 'observable-fns';

import * as streams from 'stream';
import * as fs from "fs";

import axios from "axios";
import httpAdapter from 'axios/lib/adapters/http';

const mscabBeginPattern = Buffer.from([0x4d, 0x53, 0x43, 0x46, 0x00, 0x00, 0x00, 0x00]);
const mscabCheckPattern = [0x4d, 0x53, 0x43, 0x46, 0x00, 0x00, 0x00, 0x00, -1, -1, -1, -1, 0x00, 0x00, 0x00, 0x00, -1, -1, -1, -1, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x01, 0x00];

class SoftpaqExtractTransform extends streams.Transform {
    private _cabFound: number = 0;
    private _cabPatternIndex: number = 0;
    private _cabBuffer: Buffer | null = null;

    private _totalReadBytes: number = 0;

    private _loopCount = 0;

    constructor() {
        super();
    }

    _transform(chunk: any, encoding: string, callback: streams.TransformCallback): void {
        const buffer = chunk as Buffer;

        let offset = 0;

        while(offset < buffer.length)
        {
            this._loopCount++;
            console.log("this._loopCount = ", this._loopCount);
            if (this._cabFound == 0) {
                const beginIndex = buffer.indexOf(mscabBeginPattern);
                if (beginIndex >= 0) {
                    offset = beginIndex;
                    this._cabFound = 1;
                    this._cabPatternIndex = 0;
                }else{
                    break;
                }
            }
            console.log("********** 1111111111 **********");

            if (this._cabFound == 1) {
                let i = this._cabPatternIndex;
                let j = offset;
                let matched = true;
                for (; (i < mscabCheckPattern.length) && (j < buffer.length); i++, j++) {
                    if ((mscabCheckPattern[i] >= 0) && (mscabCheckPattern[i] != buffer[j])) {
                        matched = false;
                        j++;
                        break;
                    }
                }
                if (matched) {
                    process.exit(0);
                    console.log("MATCHED!: ", (this._totalReadBytes + offset));
                    console.log(`i == mscabCheckPattern.length : ${i} == ${mscabCheckPattern.length}`);
                    this._cabPatternIndex = i;
                    if (i == mscabCheckPattern.length) {
                        this._cabFound = 2;
                    } else {
                        const subarr = buffer.subarray(offset);
                        if (this._cabBuffer) {
                            this._cabBuffer = Buffer.concat([this._cabBuffer, subarr]);
                        } else {
                            this._cabBuffer = subarr;
                        }
                    }
                } else {
                    offset = j;
                    console.log("CANCEL MATCH: ", (this._totalReadBytes + offset));
                    this._cabFound = 0;
                }
            }

            console.log("TP-3");

            if (this._cabFound == 2) {
                if (this._cabBuffer) {
                    this.push(this._cabBuffer);
                    this._cabBuffer = null;
                }
                if (offset > 0) {
                    this.push(buffer.subarray(offset));
                } else {
                    this.push(buffer);
                }

                break;
            }
        }

        console.log("Loop out");

        this._totalReadBytes += buffer.length;
        callback();
    }
}

expose({
    doit(): Observable<number> {
        return new Observable((observer) => {
            axios.get<NodeJS.ReadableStream>("ftp://ftp.hp.com/pub/softpaq/sp74001-74500/sp74100.exe", {
                responseType: 'stream',
                adapter: httpAdapter
            }).then(response => {
                return new Promise((resolve, reject) => {
                    const fileout = fs.createWriteStream("D:\\temp\\sp74100.cab");
                    (response.data as streams.Readable)
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
                console.log("observer.complete()");
                observer.complete();
            }).catch((err) => {
                console.log("observer.error(err): ", err);
                observer.error(err);
            });
        });
    }
});


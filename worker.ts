import { expose } from 'threads/worker';
import { Observable } from 'observable-fns';

import * as streams from 'stream';
import * as fs from "fs";

import axios from "axios";
import httpAdapter from 'axios/lib/adapters/http';

const mscabBeginPattern = Buffer.from([0x4d, 0x53, 0x43, 0x46, 0x00, 0x00, 0x00, 0x00]);

class SoftpaqExtractTransform extends streams.Transform {
    private _parent: streams.Readable;

    private _cabFound: number = 0;
    private _cabPatternIndex: number = 0;

    private _totalReadBytes: number = 0;

    constructor(parent: streams.Readable) {
        super();
        this._parent = parent;
    }

    _transform(chunk: any, encoding: string, callback: streams.TransformCallback): void {
        const buffer = chunk as Buffer;
        let offset = 0;

        while(offset < buffer.length)
        {
            console.log("TP-1 : ", this._cabFound, " :: ", this._totalReadBytes, process.pid);

            if (this._cabFound == 0) {
                const beginIndex = buffer.indexOf(mscabBeginPattern);
                if (beginIndex >= 0) {
                    offset = beginIndex;
                    this._cabFound = 1;
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
                        .pipe(new SoftpaqExtractTransform((response.data as streams.Readable)))
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


import {spawn, Thread, Worker} from "threads"

setTimeout(async () => {
    const threaded = await spawn(new Worker('./worker.ts'));
    await threaded.doit();
    await Thread.terminate(threaded);
}, 100);

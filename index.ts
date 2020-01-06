import {spawn, Thread, Worker} from "threads"

(async () => {
    const threaded = await spawn(new Worker('./worker.ts'));
    await threaded.doit();
    await Thread.terminate(threaded);
})();

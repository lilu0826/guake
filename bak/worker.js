import { parentPort } from "worker_threads";

let i = 0;
setInterval(() => {
    parentPort.postMessage(`来自 worker 的消息：${i++}`);

    console.log(`来自 worker 的消息：${i++}`);
}, 1000);

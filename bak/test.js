import { PythonShell } from "python-shell";
import { v4 as uuidv4 } from "uuid";
function generateUUIDWithoutDash() {
    return uuidv4().replace(/-/g, "");
}
function getId() {
    return +new Date() + "n" + Math.ceil(1e3 * Math.random());
}
// PythonShell.run("recognize.py", null, function (err, results) {
//     if (err) throw err;
//     console.log("识别结果:", results.length);
// });

// const options = {
//   args: ['https://www.cdsjxjy.cn/prod/captcha.jpg?t=1753952063801']
// };
// PythonShell.run('recognize.py', options).then(messages => {
//     console.log('messages',messages[0]);
// });

const id = generateUUIDWithoutDash();
console.log("UUID v4:", id);
console.log("id.length", id.length);
console.log('getId()', getId());
// (async () => {
//     try {
//         while (true) {
//             console.log("开始识别");
//             await new Promise((resolve) => setTimeout(resolve, 1000));
//             break;
//         }
//     } catch (err) {
//         console.log(err);
//     }
// })();

const concurrency = 5; // 最大并发数
let activeCount = 0; // 当前并发数
const queue = []; // 请求队列
// 队列处理函数
function processQueue() {
  if (activeCount >= concurrency) return; // 并发数达到上限
  const item = queue.shift();
  if (!item) return; // 队列空
  activeCount++;
  item.task()
    .then(result => item.resolve(result))
    .catch(err => item.reject(err))
    .finally(() => {
      activeCount--;
      processQueue(); // 继续处理队列
    });
}




// 添加任务到队列
export function enqueue(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    processQueue();
  });
}

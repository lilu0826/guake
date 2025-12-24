import pkg from "axios";
import { getUserAgent } from "./randomUserAgent.js";
import { enqueue } from "./queueTask.js";
//配置axios请求实例
const { create } = pkg;
let axios = create();
axios.defaults.headers.post["Content-Type"] = "application/json;charset=UTF-8";
axios.defaults.headers["Referer"] = "https://www.cdsjxjy.cn/cdcte/";
axios.defaults.headers["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8";
axios.defaults.headers["User-Agent"] = getUserAgent();

async function writeBookComment() {
    try {
        const res = await axios.post(
            "https://api.hunyuan.cloud.tencent.com/v1/chat/completions",
            {
                messages: [
                    {
                        role: "system",
                        content: "你是一个写作助手，帮助用户写作。",
                    },
                    {
                        role: "user",
                        content: `
                            每次任选一本书写一段读书评价，评价内容要求2000字。
                            强制要求：
                            - 返回一个json，格式如下{ bookName：xxx, bookComment: xxx }
                            - 输出的json必须包含 bookName 和 bookComment 两个字段
                            - 不能有其他任何内容，请勿输出其他内容`,
                    },
                ],
                model: "hunyuan-lite",
            },
            {
                headers: {
                    Authorization:
                        "Bearer sk-S1vOklie4GCzcjbcNkNnZtKEsAokoR0DokmTlnpf6tHCE5MD",
                    "content-type": "application/json; charset=utf-8",
                },
            }
        );
        return res.data.choices[0].message.content;
    } catch (error) {
        return "好";
    }
}

async function writeWeeklyReport() {
    try {
        const res = await axios.post(
            "https://api.hunyuan.cloud.tencent.com/v1/chat/completions",
            {
                messages: [
                    {
                        role: "system",
                        content: "你是一名教师，按用户要求写一下反思周记",
                    },
                    {
                        role: "user",
                        content: `
                            帮我写一篇反思周记
                            强制要求：
                            - 返回一个json，格式如下
                            {
                                topic: "反思主题",
                                writeTime: "反思时间，格式为：2025-12-01 00:00:00,年份必须为${new Date().getFullYear()}",
                                teachProud:"教学得意之处",
                                teachSorry: "教学遗憾之处",
                                feeling:"自己想说的几句话"
                            }
                            - 不要带\`\`\`json语句块
                            - 输出的json必须包含 topic,writeTime,teachProud,teachSorry,feeling
                            - 不能有其他任何内容，请勿输出其他内容`,
                    },
                ],
                model: "hunyuan-lite",
            },
            {
                headers: {
                    Authorization:
                        "Bearer sk-S1vOklie4GCzcjbcNkNnZtKEsAokoR0DokmTlnpf6tHCE5MD",
                    "content-type": "application/json; charset=utf-8",
                },
            }
        );
        return res.data.choices[0].message.content;
    } catch (error) {
        return "好";
    }
}

async function write1(token) {
    let content = await enqueue(() => writeBookComment());
    try {
        content = JSON.parse(content.replaceAll("\n", ""));
        let count = Math.ceil(2000 / content.bookComment.length);
        content.bookComment = content.bookComment.repeat(count);
        await axios.post(
            "https://www.cdsjxjy.cn/prod/stu/book/Comment/save",
            content,
            {
                headers: {
                    token: token,
                },
            }
        );
    } catch (error) {

    }
}

async function write2(token) {
    let content = await enqueue(() => writeWeeklyReport());
    try {
        content = JSON.parse(content.replaceAll("\n", ""));
        let count = Math.ceil(2000 / content.feeling.length);
        content.feeling = content.feeling.repeat(count);
        await axios.post(
            "https://www.cdsjxjy.cn/prod/stu/reflect/weekly/save",
            {
                ...content,
            },
            {
                headers: {
                    token: token,
                },
            }
        );
    } catch (error) {

    }
}

export async function write(token) {
    for (let i = 0; i < 3; i++) {
        await write1(token);
        await write2(token);
    }
}

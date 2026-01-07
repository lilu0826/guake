import pkg from "axios";
import { getUserAgent } from "./randomUserAgent.js";
import { enqueue } from "./queueTask.js";
import { updateCredit } from "./updateCredit.js";
//配置axios请求实例
const { create } = pkg;
let axios = create();
axios.defaults.headers.post["Content-Type"] = "application/json;charset=UTF-8";
axios.defaults.headers["Referer"] = "https://www.cdsjxjy.cn/cdcte/";
axios.defaults.headers["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8";
axios.defaults.headers["User-Agent"] = getUserAgent();


function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day} 00:00:00`;
}

async function writeBookComment() {
    const books = [
        "《红楼梦》",
        "《三国演义》",
        "《水浒传》",
        "《西游记》",
        "《战争与和平》",
        "《安娜·卡列尼娜》",
        "《悲惨世界》",
        "《巴黎圣母院》",
        "《卡拉马佐夫兄弟》",
        "《罪与罚》",
        "《红与黑》",
        "《高老头》",
        "《大卫·科波菲尔》",
        "《双城记》",
        "《百年孤独》",
        "《尤利西斯》",
        "《追忆似水年华》",
        "《变形记》",
        "《局外人》",
        "《一九八四》",
        "《美丽新世界》",
        "《西绪福斯神话》",
        "《老人与海》",
        "《小王子》",
        "《了不起的盖茨比》",
        "《月亮与六便士》",
        "《麦田里的守望者》",
        "《活着》",
        "《围城》",
        "《边城》",
        "《基督山伯爵》",
        "《简·爱》",
        "《傲慢与偏见》",
        "《呼啸山庄》",
        "《唐·吉诃德》",
        "《格列佛游记》",
    ];
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
                            请任选一本书写一段读书评价，评价内容要求2000字。
                            可选书籍：${books.join(",")}
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
                                writeTime: "反思时间,直接填入当前时间：${formatDate(new Date())}",
                                teachProud:"教学得意之处(要求500字)",
                                teachSorry: "教学遗憾之处(要求500字)",
                                feeling:"自己想说的几句话(要求2000字)"
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

async function write1(token, content) {
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
    } catch (error) {}
}

async function write2(token, content) {
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
    } catch (error) {}
}

export async function write(token, username) {
    let bookContent = await enqueue(() => writeBookComment());
    let weeklyContent = await enqueue(() => writeWeeklyReport());
    for (let i = 0; i < 3; i++) {
        await write1(token, bookContent);
        await write2(token, weeklyContent);
    }
    //更新单个
    await updateCredit({ token, username });
}

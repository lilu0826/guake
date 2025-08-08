import NeDB from "nedb";
import { fileURLToPath } from "url";
import path from "path";
import pkg from "pinyin";
const { pinyin } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new NeDB({
    filename: path.join(__dirname, "../data/user.db"),
    autoload: true,
});
// 获取所有数据
export function getAllData() {
    return new Promise((resolve, reject) => {
        db.find({}, function (err, docs) {
            if (err) {
                console.error("Error finding documents:", err);
                reject(err);
            } else {
                const result = docs.sort((a, b) => pinyin.compare(a.realName, b.realName));
                resolve(result);
            }
        });
    });
}

//插入和新增数据
export function upsertUserData({ username, ...rest }) {
    // 这里的 userInfo 是一个对象，包含了要更新或添加的用户数据
    return new Promise((resolve, reject) => {
        db.update(
            { username: username },
            { $set: rest },
            { upsert: true },
            function (err, numAffected, affectedDocuments, upsert) {
                if (err) {
                    console.error("Error updating or adding user data:", err);
                    reject(err);
                } else {
                    resolve(numAffected);
                }
            }
        );
    });
}

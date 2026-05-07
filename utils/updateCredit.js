import { upsertUserData } from "./db.js";
import { createContinueEducationClient } from "./continueEducationClient.js";

export async function updateCredit({ token, username, signal }) {
    const client = createContinueEducationClient({ token, signal });
    const weeklyCredit = await client.getWeeklyCredit();
    const bookCredit = await client.getBookCredit();
    upsertUserData({
        username,
        weeklyCredit,
        bookCredit,
    });
    return { weeklyCredit,bookCredit}
}

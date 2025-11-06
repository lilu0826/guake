import UserAgent from "user-agents";
const userAgent = new UserAgent({
    deviceCategory: "desktop",
});
export function getUserAgent() {
    return userAgent.random().toString();
}
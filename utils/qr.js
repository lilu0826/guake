import QRCode from "qrcode";
import { createCanvas, loadImage } from "canvas";
import fs from "node:fs";

export async function getQr(url) {
    const canvas = createCanvas(200, 300);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 400, 500);
    ctx.font = "16px";
    ctx.fillStyle = "#ff6c03";
    const textInfo = ctx.measureText("微信扫码登录");
    ctx.fillText("微信扫码登录", (200 - textInfo.width) / 2, 80);
    return QRCode.toDataURL(url, { width: 300, margin: 0 })
        .then(loadImage)
        .then((image) => {
            ctx.drawImage(image, 29, 100, 142, 142);
            return canvas.toBuffer("image/png");
        });
}

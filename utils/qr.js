import QRCode from "qrcode";
export async function getQr(url) {
    return QRCode.toDataURL(url, { width: 300, margin: 0 })
}

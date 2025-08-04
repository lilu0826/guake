import ddddocr
import sys
import os
import requests


sys.stdout = open(os.devnull, 'w')
ocr = ddddocr.DdddOcr()
sys.stdout = sys.__stdout__  # 恢复 stdout

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Referer': 'https://www.baidu.com/',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Connection': 'keep-alive',
}

# 下载网络图片
response = requests.get(sys.argv[1], headers=headers)
img_bytes = response.content  # 二进制内容



# OCR 识别
res = ocr.classification(img_bytes)
print(res[-5:])

with open(res[-5:] + '.jpg', 'wb') as f:
    f.write(img_bytes)


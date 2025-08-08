# guake
挂课脚本

# docker运行
```bash
docker run --name=guake \
  -d \
  -p 8081:8081 \
  --restart=always \
  -v /etc/guake/data:/app/data \
  ghcr.io/lilu0826/guake:latest
```
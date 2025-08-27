# Configuración de Nginx-RTMP

Esta carpeta contiene la configuración para el servidor de streaming Nginx-RTMP.

## Desarrollo Local

Para pruebas en desarrollo, se recomienda usar Docker:

```bash
docker run -it -p 1935:1935 -p 8080:80 -v $(pwd)/conf/nginx.conf:/etc/nginx/nginx.conf tiangolo/nginx-rtmp
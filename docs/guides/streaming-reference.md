Guía de Referencia: Streaming de Video para Sports Bets
Arquitectura de Streaming
Componentes del Sistema
[OBS Studio] → [Servidor Nginx-RTMP] → [BunnyCDN] → [Reproductores de Usuario]
(Origen) (Transcodificación) (Distribución) (Frontend)
Formato de Streaming Recomendado

Protocolo primario: RTMP para ingesta desde OBS
Protocolo de distribución: HLS (HTTP Live Streaming)
Tamaño de fragmento HLS: 3 segundos (balance entre latencia y estabilidad)
Codificación de video: H.264 (compatible universalmente)
Contenedor: TS (Transport Stream) para HLS
Duración de playlist: 60 segundos (ajustable según necesidad)

Configuración Técnica
Configuración Nginx-RTMP Optimizada
nginx# Configuración optimizada para transmisiones largas (8+ horas)
worker_processes auto;
worker_rlimit_nofile 8192; # Importante para muchas conexiones

events {
worker_connections 4096;
multi_accept on;
use epoll; # Optimización para Linux
}

http {
include mime.types;
default_type application/octet-stream;

    # Optimizaciones para streaming
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Buffer sizes optimizados para streaming
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;

    # Compresión - activar solo para componentes no HLS
    gzip off;  # Desactivado para contenido HLS

    server {
        listen 80;
        server_name localhost;  # Cambiar en producción

        # CORS para reproductores de video
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;

        # Streams HLS
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /tmp;  # Directorio donde se guardan los fragmentos
            add_header Cache-Control no-cache;
            add_header 'Access-Control-Allow-Origin' '*' always;
        }

        # Estadísticas RTMP (proteger en producción)
        location /stat {
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
            # Añadir autenticación en producción
            # auth_basic "Restricted";
            # auth_basic_user_file /etc/nginx/.htpasswd;
        }

        # Control RTMP (proteger en producción)
        location /control {
            rtmp_control all;
            # Añadir autenticación en producción
            # auth_basic "Restricted";
            # auth_basic_user_file /etc/nginx/.htpasswd;
        }
    }

}

# Configuración RTMP

rtmp {
server {
listen 1935;
chunk_size 4096;

        # Publicar timeout para transmisiones largas
        idle_streams off;
        drop_idle_publisher 3600s;  # 1 hora

        # Tiempo ping para mantener conexiones activas
        ping 30s;
        ping_timeout 10s;

        # Application live para streaming principal
        application live {
            live on;
            record off;

            # Permitir metadatos
            meta copy;

            # HLS
            hls on;
            hls_path /tmp/hls;
            hls_fragment 3s;
            hls_playlist_length 60s;

            # Múltiples calidades (transcodificación)
            # Requiere compilar Nginx con módulos adicionales
            exec_push ffmpeg -i rtmp://localhost:1935/live/$name
                -c:v libx264 -c:a aac -b:v 2000k -b:a 128k -vf "scale=1280:720" -preset veryfast -f flv rtmp://localhost:1935/hls/$name_720p
                -c:v libx264 -c:a aac -b:v 1000k -b:a 96k -vf "scale=854:480" -preset veryfast -f flv rtmp://localhost:1935/hls/$name_480p
                -c:v libx264 -c:a aac -b:v 500k -b:a 64k -vf "scale=640:360" -preset veryfast -f flv rtmp://localhost:1935/hls/$name_360p;

            # Control de acceso (producción)
            # allow publish 127.0.0.1;
            # deny publish all;
            # allow play all;
        }

        # Application HLS (para transcodificación)
        application hls {
            live on;
            record off;

            # HLS
            hls on;
            hls_path /tmp/hls;
            hls_fragment 3s;
            hls_playlist_length 60s;
            hls_variant _720p BANDWIDTH=2128000,RESOLUTION=1280x720;
            hls_variant _480p BANDWIDTH=1096000,RESOLUTION=854x480;
            hls_variant _360p BANDWIDTH=564000,RESOLUTION=640x360;

            # Solo permitir publicación local
            allow publish 127.0.0.1;
            deny publish all;
            allow play all;
        }
    }

}
Configuración OBS Studio
Configuración Recomendada para Transmisión

Formato de Salida: RTMP (Custom)
URL: rtmp://[SERVIDOR-NGINX]:1935/live
Stream Key: [NOMBRE-EVENTO] (ej: gallera_evento_20250515)
Codificación de Video:

Encoder: x264
Rate Control: CBR (Constant Bitrate)
Bitrate: 2000-3000 Kbps (para 720p)
Keyframe Interval: 2 segundos
Preset: veryfast (balance rendimiento/calidad)
Profile: high
Tune: zerolatency

Resolución: 1280x720 (720p)
FPS: 30
Codificación de Audio:

Codec: AAC
Bitrate: 128 Kbps
Canales: Stereo
Sample Rate: 48 kHz

Script PowerShell para Automatizar OBS (Opcional)
powershell# Requiere OBS-WebSocket plugin

# Install-Module -Name OBS-WebSocket

$obsConnection = Connect-OBS -WebSocketURL "ws://localhost:4455" -Password "YourPassword"

# Iniciar transmisión

Start-OBSStreaming -Connection $obsConnection

# Establecer escena

Set-OBSCurrentScene -Connection $obsConnection -SceneName "Escena Principal"

# Monitorear estado

$status = Get-OBSStreamingStatus -Connection $obsConnection
if ($status.Streaming) {
Write-Output "Transmisión activa - Duración: $($status.StreamTimecode)"
}
Integración con BunnyCDN
Configuración de Pull Zone
javascript// Crear Pull Zone en BunnyCDN (via API)
const createPullZone = async () => {
const response = await fetch('https://api.bunny.net/pullzone', {
method: 'POST',
headers: {
'AccessKey': process.env.BUNNYCDN_API_KEY,
'Content-Type': 'application/json'
},
body: JSON.stringify({
Name: 'SportsBetsStreaming',
OriginUrl: 'http://your-nginx-server.com/hls',
Type: 0, // Standard pull zone
EnabledHSTS: false, // HSTS no recomendado para streaming
EnableCacheSlice: true, // Importante para HLS
EnableSmartCache: false, // Muy importante para HLS - no usar Smart Cache
CacheControlMaxAgeOverride: 5, // 5 segundos máximo para archivos .m3u8
CacheControlBrowserMaxAgeOverride: 5,
EnableCacheScoreHeader: false,
ZoneSecurityEnabled: true, // Recomendado para seguridad
ZoneSecurityIncludeHashRemoteIP: false
})
});

return await response.json();
};
Configuración de Edge Rules

Regla para archivos .m3u8:

Cache-TTL: 3 segundos
Browser Cache-TTL: 0 segundos

Regla para archivos .ts:

Cache-TTL: 604800 segundos (1 semana)
Browser Cache-TTL: 604800 segundos (1 semana)

Optimización de Costos

Configurar purga automática de contenido antiguo (>48 horas)
Limitar regiones CDN a Latinoamérica inicialmente
Monitoreo de tráfico para detectar picos inusuales

Componente React para Reproducción
jsximport React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const StreamPlayer = ({ streamUrl, autoPlay = true }) => {
const videoRef = useRef(null);
const [error, setError] = useState(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
let hls;

    const initPlayer = () => {
      if (videoRef.current) {
        const video = videoRef.current;

        // Limpiar instancia previa si existe
        if (hls) {
          hls.destroy();
        }

        // Verificar soporte HLS
        if (Hls.isSupported()) {
          setIsLoading(true);
          setError(null);

          // Crear nueva instancia HLS
          hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            manifestLoadingTimeOut: 20000, // Timeout más largo para conexiones lentas
            manifestLoadingMaxRetry: 4,
            fragLoadingTimeOut: 20000,
            fragLoadingMaxRetry: 6,
            levelLoadingTimeOut: 20000,
            levelLoadingMaxRetry: 4
          });

          // Manejo de errores
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch(data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error('Fatal network error', data);
                  setError('Error de conexión. Reintentando...');
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error('Fatal media error', data);
                  setError('Error de reproducción. Reintentando...');
                  hls.recoverMediaError();
                  break;
                default:
                  console.error('Fatal error', data);
                  setError('Error fatal. Por favor recarga la página.');
                  break;
              }
            }
          });

          // Evento de carga exitosa
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            if (autoPlay) {
              video.play().catch(e => console.error('Error al reproducir automáticamente:', e));
            }
          });

          // Cargar stream
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
        }
        // Fallback para navegadores con soporte HLS nativo (Safari)
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
          video.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
            if (autoPlay) {
              video.play().catch(e => console.error('Error al reproducir automáticamente:', e));
            }
          });

          video.addEventListener('error', () => {
            setError('Error al cargar el video. Por favor intenta de nuevo.');
          });
        }
        else {
          setError('Tu navegador no soporta la reproducción de este video.');
        }
      }
    };

    initPlayer();

    // Limpiar al desmontar
    return () => {
      if (hls) {
        hls.destroy();
      }
    };

}, [streamUrl, autoPlay]);

return (
<div className="stream-player-container relative">
{isLoading && (
<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
<div className="loading-spinner"></div>
<p className="text-white ml-3">Cargando transmisión...</p>
</div>
)}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-white text-center p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full"
        controls
        playsInline
      />
    </div>

);
};

export default StreamPlayer;
Solución de Problemas Comunes
Problemas de Latencia

Síntoma: Retraso significativo (>30s) entre transmisión y recepción
Soluciones:

Reducir tamaño de fragmentos HLS (2s en lugar de 3s)
Reducir duración de playlist (30s en lugar de 60s)
Optimizar network buffers en Nginx
Verificar configuración de ping/pong en RTMP

Pérdida de Conexión

Síntoma: OBS muestra "Desconectado" durante la transmisión
Soluciones:

Implementar sistema de reconexión automática en OBS
Utilizar conexión dual (cable + 4G) con failover
Aumentar timeouts en configuración RTMP
Configurar monitoreo de conexión con alertas

Degradación de Calidad

Síntoma: Video pixelado o congelado intermitentemente
Soluciones:

Reducir resolución o bitrate si el ancho de banda es limitado
Usar preset "faster" en lugar de "veryfast" para mejor compresión
Verificar uso de CPU en máquina de transmisión
Implementar bitrate adaptativo en OBS

Consumo Excesivo de Recursos en Servidor

Síntoma: Servidor con alta carga de CPU o memoria
Soluciones:

Deshabilitar transcodificación si no es esencial
Aumentar recursos del servidor (CPU/RAM)
Optimizar worker_processes y worker_connections
Implementar monitoreo de recursos con alertas

Optimización para Eventos de Larga Duración
Consideraciones Especiales para Transmisiones de 8+ Horas

Rotación de logs para evitar archivos enormes
Gestión de memoria con límites claros para evitar fugas
Monitoreo continuo con alertas para problemas críticos
Backup periódico de fragmentos importantes
Estrategia de reconexión automática en todos los niveles

Configuración para Alta Disponibilidad
nginx# Agregar a configuración RTMP
application live {
live on;

    # Alta disponibilidad - permitir reconexión sin interrumpir stream
    wait_key on;
    wait_video on;
    publish_notify on;
    drop_idle_publisher 3600s;

    # Mantener stream activo brevemente si publisher se desconecta
    idle_streams once;
    idle_timeout 10s;

}
Recursos y Referencias

Nginx-RTMP GitHub
HLS Specification
OBS Studio Documentación
BunnyCDN Documentación
FFmpeg Documentación

Checklist de Configuración

Instalación y configuración de Nginx con módulo RTMP
Configuración de rutas y permisos para archivos HLS
Creación de pull zone en BunnyCDN
Configuración de OBS Studio con parámetros óptimos
Implementación de monitoreo y alertas
Prueba de carga con simulación de usuarios
Documentación de procedimientos de emergencia
Configuración de respaldos automáticos

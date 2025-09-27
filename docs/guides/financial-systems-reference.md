Creación de Documentos de Referencia Especializados
Vamos a crear estos documentos de referencia uno por uno, con extremo cuidado en su contenido. Comenzaré con el documento de streaming, que es un componente crítico del proyecto.
Documento 1: Referencia de Streaming
powershell# Crear el directorio si no existe
New-Item -ItemType Directory -Path "docs/guides" -Force

# Crear el archivo de referencia de streaming

New-Item -ItemType File -Path "docs/guides/streaming-reference.md" -Force
Contenido para streaming-reference.md:
INICIO DE DOCUMENTO
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
FINAL DE DOCUMENTO

Ahora procederé a crear el segundo documento relacionado con sistemas financieros.
powershell# Crear el archivo de referencia de sistemas financieros
New-Item -ItemType File -Path "docs/guides/financial-systems-reference.md" -Force
Contenido para financial-systems-reference.md:
INICIO DE DOCUMENTO
Guía de Referencia: Sistemas Financieros para Sports Bets
Arquitectura del Sistema Financiero
Componentes Principales
[Pasarela de Pago (Kushki)] ←→ [Billetera Virtual] ←→ [Sistema de Apuestas]
↑ ↑ ↑
↓ ↓ ↓
[Auditoría y Seguridad] ←→ [Base de Datos] ←→ [Panel Administrativo]
Flujos Financieros Críticos

Carga de fondos a billetera

Usuario → Kushki → Sistema → Billetera Virtual

Apuesta entre usuarios

Usuario A Billetera → Fondos Congelados → Usuario B Billetera

Retiro de fondos

Billetera Virtual → Verificación Manual → Transferencia Bancaria

Esquema de Base de Datos
Tablas Principales
Users
sqlCREATE TABLE users (
id SERIAL PRIMARY KEY,
email VARCHAR(100) UNIQUE NOT NULL,
password_hash VARCHAR(255) NOT NULL,
full_name VARCHAR(100) NOT NULL,
phone_number VARCHAR(20),
identity_number VARCHAR(20) UNIQUE,
identity_verified BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
status VARCHAR(20) DEFAULT 'active',
last_login TIMESTAMP WITH TIME ZONE
);
Wallets
sqlCREATE TABLE wallets (
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
balance DECIMAL(12,2) DEFAULT 0.00,
frozen_balance DECIMAL(12,2) DEFAULT 0.00,
currency VARCHAR(3) DEFAULT 'USD',
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT positive_balance CHECK (balance >= 0),
CONSTRAINT positive_frozen CHECK (frozen_balance >= 0)
);

CREATE INDEX wallets_user_id_idx ON wallets(user_id);
Transactions
sqlCREATE TABLE transactions (
id SERIAL PRIMARY KEY,
wallet_id INTEGER REFERENCES wallets(id),
transaction_type VARCHAR(20) NOT NULL,
amount DECIMAL(12,2) NOT NULL,
balance_before DECIMAL(12,2) NOT NULL,
balance_after DECIMAL(12,2) NOT NULL,
reference_id VARCHAR(100),
reference_type VARCHAR(50),
description TEXT,
metadata JSONB,
status VARCHAR(20) DEFAULT 'completed',
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX transactions_wallet_id_idx ON transactions(wallet_id);
CREATE INDEX transactions_created_at_idx ON transactions(created_at);
CREATE INDEX transactions_reference_id_idx ON transactions(reference_id);
PaymentRequests
sqlCREATE TABLE payment_requests (
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id),
type VARCHAR(20) NOT NULL, -- 'deposit' o 'withdrawal'
amount DECIMAL(12,2) NOT NULL,
status VARCHAR(20) DEFAULT 'pending',
payment_method VARCHAR(50),
payment_details JSONB,
kushki_token VARCHAR(100),
transaction_id INTEGER REFERENCES transactions(id),
requester_notes TEXT,
admin_notes TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
processed_at TIMESTAMP WITH TIME ZONE,
processed_by INTEGER REFERENCES users(id)
);

CREATE INDEX payment_requests_user_id_idx ON payment_requests(user_id);
CREATE INDEX payment_requests_status_idx ON payment_requests(status);
Bets
sqlCREATE TABLE bets (
id SERIAL PRIMARY KEY,
event_id INTEGER REFERENCES events(id),
creator_id INTEGER REFERENCES users(id),
acceptor_id INTEGER REFERENCES users(id),
creator_choice VARCHAR(20) NOT NULL,
creator_amount DECIMAL(12,2) NOT NULL,
acceptor_amount DECIMAL(12,2) NOT NULL,
status VARCHAR(20) DEFAULT 'open',
result VARCHAR(20),
winner_id INTEGER REFERENCES users(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
completed_at TIMESTAMP WITH TIME ZONE,
CONSTRAINT positive_bet_amount CHECK (creator_amount > 0 AND acceptor_amount > 0)
);

CREATE INDEX bets_event_id_idx ON bets(event_id);
CREATE INDEX bets_creator_id_idx ON bets(creator_id);
CREATE INDEX bets_acceptor_id_idx ON bets(acceptor_id);
CREATE INDEX bets_status_idx ON bets(status);
AuditLogs
sqlCREATE TABLE audit_logs (
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id),
action VARCHAR(100) NOT NULL,
entity_type VARCHAR(50),
entity_id INTEGER,
details JSONB,
ip_address VARCHAR(50),
user_agent TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_action_idx ON audit_logs(action);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);
Índices Críticos para Rendimiento
sql-- Índice para búsquedas de transacciones por rango de fechas
CREATE INDEX transactions_date_range_idx ON transactions(created_at);

-- Índice para búsquedas de apuestas por estado
CREATE INDEX bets_status_event_idx ON bets(status, event_id);

-- Índice para búsquedas de transacciones por tipo
CREATE INDEX transactions_type_idx ON transactions(transaction_type);

-- Índice para búsquedas rápidas de wallet por usuario
CREATE UNIQUE INDEX wallets_user_id_unique_idx ON wallets(user_id);
Implementación de Billetera Virtual
Servicio de Billetera
javascript// services/walletService.js
const { pool } = require('../db/postgresql');
const { createAuditLog } = require('./auditService');

/\*\*

- Obtiene el balance de la billetera de un usuario
  \*/
  async function getWalletBalance(userId) {
  const client = await pool.connect();

try {
const result = await client.query(
'SELECT balance, frozen_balance FROM wallets WHERE user_id = $1',
[userId]
);

    if (result.rows.length === 0) {
      // Crear billetera si no existe
      const newWallet = await client.query(
        'INSERT INTO wallets (user_id, balance, frozen_balance) VALUES ($1, 0, 0) RETURNING *',
        [userId]
      );
      return {
        balance: parseFloat(newWallet.rows[0].balance),
        frozenBalance: parseFloat(newWallet.rows[0].frozen_balance),
        availableBalance: 0
      };
    }

    const { balance, frozen_balance } = result.rows[0];
    return {
      balance: parseFloat(balance),
      frozenBalance: parseFloat(frozen_balance),
      availableBalance: parseFloat(balance) - parseFloat(frozen_balance)
    };

} finally {
client.release();
}
}

/\*\*

- Realiza un depósito en la billetera
  \*/
  async function deposit(userId, amount, referenceId, metadata = {}) {
  const client = await pool.connect();

try {
await client.query('BEGIN');

    // Verificar si la billetera existe
    let walletId;
    const walletResult = await client.query(
      'SELECT id, balance FROM wallets WHERE user_id = $1',
      [userId]
    );

    if (walletResult.rows.length === 0) {
      // Crear billetera si no existe
      const newWallet = await client.query(
        'INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING id, balance',
        [userId, amount]
      );
      walletId = newWallet.rows[0].id;
      balanceBefore = 0;
      balanceAfter = parseFloat(amount);
    } else {
      walletId = walletResult.rows[0].id;
      balanceBefore = parseFloat(walletResult.rows[0].balance);
      balanceAfter = balanceBefore + parseFloat(amount);

      // Actualizar balance
      await client.query(
        'UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [amount, walletId]
      );
    }

    // Registrar transacción
    const transactionResult = await client.query(
      `INSERT INTO transactions
       (wallet_id, transaction_type, amount, balance_before, balance_after, reference_id, reference_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [walletId, 'deposit', amount, balanceBefore, balanceAfter, referenceId, 'payment', metadata]
    );

    // Registrar auditoría
    await createAuditLog(client, userId, 'deposit', 'wallet', walletId, {
      amount,
      referenceId,
      transactionId: transactionResult.rows[0].id
    });

    await client.query('COMMIT');

    return {
      success: true,
      transactionId: transactionResult.rows[0].id,
      newBalance: balanceAfter
    };

} catch (error) {
await client.query('ROLLBACK');
throw error;
} finally {
client.release();
}
}

/\*\*

- Congela fondos para una apuesta
  \*/
  async function freezeFunds(userId, amount, betId) {
  const client = await pool.connect();

try {
await client.query('BEGIN');

    // Verificar balance disponible
    const walletResult = await client.query(
      'SELECT id, balance, frozen_balance FROM wallets WHERE user_id = $1 FOR UPDATE',
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new Error('Wallet not found');
    }

    const walletId = walletResult.rows[0].id;
    const balance = parseFloat(walletResult.rows[0].balance);
    const frozenBalance = parseFloat(walletResult.rows[0].frozen_balance);
    const availableBalance = balance - frozenBalance;

    if (availableBalance < amount) {
      throw new Error('Insufficient funds');
    }

    // Congelar fondos
    const newFrozenBalance = frozenBalance + parseFloat(amount);
    await client.query(
      'UPDATE wallets SET frozen_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newFrozenBalance, walletId]
    );

    // Registrar transacción
    const transactionResult = await client.query(
      `INSERT INTO transactions
       (wallet_id, transaction_type, amount, balance_before, balance_after, reference_id, reference_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [walletId, 'freeze', amount, frozenBalance, newFrozenBalance, betId, 'bet', { action: 'freeze_for_bet' }]
    );

    // Registrar auditoría
    await createAuditLog(client, userId, 'freeze_funds', 'bet', betId, {
      amount,
      transactionId: transactionResult.rows[0].id
    });

    await client.query('COMMIT');

    return {
      success: true,
      transactionId: transactionResult.rows[0].id,
      newFrozenBalance,
      availableBalance: balance - newFrozenBalance
    };

} catch (error) {
await client.query('ROLLBACK');
throw error;
} finally {
client.release();
}
}

/\*\*

- Procesa el resultado de una apuesta
  \*/
  async function processBetResult(betId, winnerId) {
  const client = await pool.connect();

try {
await client.query('BEGIN');

    // Obtener detalles de la apuesta
    const betResult = await client.query(
      `SELECT id, creator_id, acceptor_id, creator_amount, acceptor_amount, status
       FROM bets WHERE id = $1 FOR UPDATE`,
      [betId]
    );

    if (betResult.rows.length === 0) {
      throw new Error('Bet not found');
    }

    const bet = betResult.rows[0];

    if (bet.status !== 'active') {
      throw new Error('Bet is not active');
    }

    if (winnerId !== bet.creator_id && winnerId !== bet.acceptor_id) {
      throw new Error('Invalid winner ID');
    }

    // Determinar ganador y perdedor
    const creatorIsWinner = winnerId === bet.creator_id;
    const winnerId = creatorIsWinner ? bet.creator_id : bet.acceptor_id;
    const loserId = creatorIsWinner ? bet.acceptor_id : bet.creator_id;
    const winAmount = creatorIsWinner ? parseFloat(bet.acceptor_amount) : parseFloat(bet.creator_amount);
    const returnAmount = creatorIsWinner ? parseFloat(bet.creator_amount) : parseFloat(bet.acceptor_amount);

    // Descongelar fondos del ganador y añadir ganancias
    await unfreezeFundsAndAddWinnings(client, winnerId, returnAmount, winAmount, betId);

    // Descongelar y restar fondos del perdedor
    await unfreezeFundsAndRemoveLoss(client, loserId, creatorIsWinner ? bet.creator_amount : bet.acceptor_amount, betId);

    // Actualizar estado de la apuesta
    await client.query(
      `UPDATE bets SET
       status = 'completed',
       result = $1,
       winner_id = $2,
       completed_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [creatorIsWinner ? 'creator_win' : 'acceptor_win', winnerId, betId]
    );

    // Registrar auditoría
    await createAuditLog(client, 'system', 'process_bet_result', 'bet', betId, {
      winnerId,
      loserId,
      creatorIsWinner
    });

    await client.query('COMMIT');

    return {
      success: true,
      betId,
      winnerId,
      loserId,
      winAmount,
      returnAmount
    };

} catch (error) {
await client.query('ROLLBACK');
throw error;
} finally {
client.release();
}
}

// Funciones auxiliares
async function unfreezeFundsAndAddWinnings(client, userId, returnAmount, winAmount, betId) {
// Implementación de descongelamiento y adición de ganancias
}

async function unfreezeFundsAndRemoveLoss(client, userId, amount, betId) {
// Implementación de descongelamiento y registro de pérdida
}

// Otros métodos de la billetera
// ...

module.exports = {
getWalletBalance,
deposit,
freezeFunds,
processBetResult,
// Exportar otros métodos...
};
Integración con Kushki
Cliente de API para Kushki
javascript// services/kushkiService.js
const axios = require('axios');

// Configuración de entorno
const KUSHKI_PUBLIC_KEY = process.env.KUSHKI_PUBLIC_KEY;
const KUSHKI_PRIVATE_KEY = process.env.KUSHKI_PRIVATE_KEY;
const KUSHKI_BASE_URL = process.env.NODE_ENV === 'production'
? 'https://api.kushkipagos.com'
: 'https://api-uat.kushkipagos.com';

/\*\*

- Tokenizar una tarjeta (frontend)
- Este código se ejecuta en el cliente
  \*/
  export async function tokenizeCard(cardDetails) {
  try {
  const response = await axios.post(`${KUSHKI_BASE_URL}/tokens`, {
  currency: 'USD',
  card: {
  name: cardDetails.name,
  number: cardDetails.number,
  expiryMonth: cardDetails.expiryMonth,
  expiryYear: cardDetails.expiryYear,
  cvc: cardDetails.cvc
  }
  }, {
  headers: { 'Public-Merchant-Id': KUSHKI_PUBLIC_KEY }
  });
      return {
        success: true,
        token: response.data.token
      };
  } catch (error) {
  console.error('Error tokenizing card:', error.response?.data || error.message);
  return {
  success: false,
  error: error.response?.data?.message || 'Error al procesar la tarjeta'
  };
  }
  }

/\*\*

- Procesar un cargo con token (backend)
  \*/
  async function processCharge(token, amount, userId, metadata = {}) {
  try {
  // Preparar montos en formato Kushki (sin impuestos para Ecuador)
  const amountObject = {
  subtotalIva: 0,
  subtotalIva0: parseFloat(amount).toFixed(2),
  ice: 0,
  iva: 0,
  currency: 'USD'
  };
      // Realizar cargo
      const response = await axios.post(`${KUSHKI_BASE_URL}/charges`, {
        token,
        amount: amountObject,
        metadata: {
          userId,
          ...metadata
        },
        fullResponse: true // Obtener respuesta completa para auditoría
      }, {
        headers: {
          'Private-Merchant-Id': KUSHKI_PRIVATE_KEY,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        transactionId: response.data.transactionId,
        ticketNumber: response.data.ticketNumber,
        approvalCode: response.data.approvalCode,
        responseCode: response.data.responseCode,
        raw: response.data
      };
  } catch (error) {
  console.error('Error processing charge:', error.response?.data || error.message);
  return {
  success: false,
  error: error.response?.data?.message || 'Error al procesar el pago',
  code: error.response?.data?.code || 'UNKNOWN_ERROR',
  raw: error.response?.data || {}
  };
  }
  }

/\*\*

- Obtener información de un cargo (backend)
  \*/
  async function getChargeInfo(transactionId) {
  try {
  const response = await axios.get(`${KUSHKI_BASE_URL}/charges/${transactionId}`, {
  headers: { 'Private-Merchant-Id': KUSHKI_PRIVATE_KEY }
  });
      return {
        success: true,
        data: response.data
      };
  } catch (error) {
  console.error('Error getting charge info:', error.response?.data || error.message);
  return {
  success: false,
  error: error.response?.data?.message || 'Error al obtener información del pago'
  };
  }
  }

/\*\*

- Anular un cargo (backend)
  \*/
  async function voidCharge(transactionId) {
  try {
  const response = await axios.delete(`${KUSHKI_BASE_URL}/charges/${transactionId}`, {
  headers: { 'Private-Merchant-Id': KUSHKI_PRIVATE_KEY }
  });
      return {
        success: true,
        data: response.data
      };
  } catch (error) {
  console.error('Error voiding charge:', error.response?.data || error.message);
  return {
  success: false,
  error: error.response?.data?.message || 'Error al anular el pago'
  };
  }
  }

module.exports = {
processCharge,
getChargeInfo,
voidCharge
};
Componente React Para Pagos
jsximport React, { useState } from 'react';
import { tokenizeCard } from '../../services/kushkiService';

const PaymentForm = ({ onSuccess, onError, amount }) => {
const [cardData, setCardData] = useState({
name: '',
number: '',
expiryMonth: '',
expiryYear: '',
cvc: ''
});
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleChange = (e) => {
const { name, value } = e.target;
setCardData(prev => ({ ...prev, [name]: value }));
};

const formatCardNumber = (value) => {
// Eliminar espacios y caracteres no numéricos
const cleaned = value.replace(/\D/g, '');

    // Limitar a 16 dígitos
    const limited = cleaned.slice(0, 16);

    // Formatear con espacios cada 4 dígitos
    const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');

    return formatted;

};

const handleCardNumberChange = (e) => {
const formatted = formatCardNumber(e.target.value);
setCardData(prev => ({ ...prev, number: formatted }));
};

const handleSubmit = async (e) => {
e.preventDefault();
setLoading(true);
setError(null);

    try {
      // Limpiar número de tarjeta para envío
      const cleanedCardData = {
        ...cardData,
        number: cardData.number.replace(/\s/g, '')
      };

      const result = await tokenizeCard(cleanedCardData);

      if (result.success) {
        // Enviar token al backend
        const response = await fetch('/api/payments/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: result.token,
            amount
          })
        });

        const data = await response.json();

        if (data.success) {
          onSuccess(data);
        } else {
          setError(data.error || 'Error al procesar el pago');
          onError(data);
        }
      } else {
        setError(result.error || 'Error al procesar la tarjeta');
        onError(result);
      }
    } catch (err) {
      setError('Error al conectar con el servidor de pagos');
      onError(err);
    } finally {
      setLoading(false);
    }

};

return (
<div className="payment-form-container">
<h3 className="text-xl font-semibold mb-4">Agregar fondos a tu billetera</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre en la tarjeta</label>
          <input
            type="text"
            name="name"
            value={cardData.name}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Número de tarjeta</label>
          <input
            type="text"
            name="number"
            value={cardData.number}
            onChange={handleCardNumberChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="0000 0000 0000 0000"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mes</label>
            <select
              name="expiryMonth"
              value={cardData.expiryMonth}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="">Mes</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month.toString().padStart(2, '0')}>
                  {month.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Año</label>
            <select
              name="expiryYear"
              value={cardData.expiryYear}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="">Año</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                <option key={year} value={year.toString().slice(-2)}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">CVC</label>
            <input
              type="text"
              name="cvc"
              value={cardData.cvc}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              maxLength="4"
              placeholder="123"
              required
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-blue-400 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </span>
            ) : (
              `Pagar $${amount.toFixed(2)}`
            )}
          </button>
        </div>
      </form>
    </div>

);
};

export default PaymentForm;
Sistema de Apuestas P2P
Servicio de Apuestas
javascript// services/betService.js
const { pool } = require('../db/postgresql');
const walletService = require('./walletService');
const { createAuditLog } = require('./auditService');

/\*\*

- Crear una propuesta de apuesta
  \*/
  async function createBetProposal(creatorId, eventId, creatorChoice, creatorAmount, acceptorAmount) {
  const client = await pool.connect();

try {
await client.query('BEGIN');

    // Verificar si el evento existe y está activo
    const eventResult = await client.query(
      'SELECT id, status FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new Error('Event not found');
    }

    if (eventResult.rows[0].status !== 'active') {
      throw new Error('Event is not active');
    }

    // Verificar que la elección es válida
    if (!['red', 'blue'].includes(creatorChoice)) {
      throw new Error('Invalid choice');
    }

    // Verificar montos válidos
    if (creatorAmount <= 0 || acceptorAmount <= 0) {
      throw new Error('Bet amounts must be greater than zero');
    }

    // Intentar congelar fondos
    const freezeResult = await walletService.freezeFunds(creatorId, creatorAmount, null);

    if (!freezeResult.success) {
      throw new Error('Could not freeze funds');
    }

    // Crear apuesta
    const betResult = await client.query(
      `INSERT INTO bets
       (event_id, creator_id, creator_choice, creator_amount, acceptor_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [eventId, creatorId, creatorChoice, creatorAmount, acceptorAmount, 'open']
    );

    const betId = betResult.rows[0].id;

    // Actualizar referencia en transacción de congelamiento
    await client.query(
      'UPDATE transactions SET reference_id = $1 WHERE id = $2',
      [betId, freezeResult.transactionId]
    );

    // Registrar auditoría
    await createAuditLog(client, creatorId, 'create_bet_proposal', 'bet', betId, {
      eventId,
      creatorChoice,
      creatorAmount,
      acceptorAmount
    });

    await client.query('COMMIT');

    return {
      success: true,
      betId,
      status: 'open'
    };

} catch (error) {
await client.query('ROLLBACK');
throw error;
} finally {
client.release();
}
}

/\*\*

- Aceptar una apuesta
  \*/
  async function acceptBet(betId, acceptorId) {
  const client = await pool.connect();

try {
await client.query('BEGIN');

    // Obtener detalles de la apuesta
    const betResult = await client.query(
      `SELECT id, event_id, creator_id, creator_choice, creator_amount, acceptor_amount, status
       FROM bets WHERE id = $1 FOR UPDATE`,
      [betId]
    );

    if (betResult.rows.length === 0) {
      throw new Error('Bet not found');
    }

    const bet = betResult.rows[0];

    // Verificar que la apuesta está abierta
    if (bet.status !== 'open') {
      throw new Error('Bet is not open');
    }

    // Verificar que no es apuesta propia
    if (bet.creator_id === acceptorId) {
      throw new Error('Cannot accept your own bet');
    }

    // Verificar que el evento sigue activo
    const eventResult = await client.query(
      'SELECT status FROM events WHERE id = $1',
      [bet.event_id]
    );

    if (eventResult.rows.length === 0 || eventResult.rows[0].status !== 'active') {
      throw new Error('Event is not active');
    }

    // Intentar congelar fondos
    const freezeResult = await walletService.freezeFunds(acceptorId, bet.acceptor_amount, betId);

    if (!freezeResult.success) {
      throw new Error('Could not freeze funds');
    }

    // Actualizar apuesta
    await client.query(
      `UPDATE bets SET
       acceptor_id = $1,
       status = $2,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [acceptorId, 'active', betId]
    );

    // Registrar auditoría
    await createAuditLog(client, acceptorId, 'accept_bet', 'bet', betId, {
      amount: bet.acceptor_amount
    });

    await client.query('COMMIT');

    return {
      success: true,
      betId,
      status: 'active'
    };

} catch (error) {
await client.query('ROLLBACK');
throw error;
} finally {
client.release();
}
}

/\*\*

- Cancelar una apuesta abierta
  \*/
  async function cancelBetProposal(betId, userId) {
  const client = await pool.connect();

try {
await client.query('BEGIN');

    // Obtener detalles de la apuesta
    const betResult = await client.query(
      `SELECT id, creator_id, creator_amount, status
       FROM bets WHERE id = $1 FOR UPDATE`,
      [betId]
    );

    if (betResult.rows.length === 0) {
      throw new Error('Bet not found');
    }

    const bet = betResult.rows[0];

    // Verificar que la apuesta está abierta
    if (bet.status !== 'open') {
      throw new Error('Can only cancel open bets');
    }

    // Verificar que es el creador
    if (bet.creator_id !== userId) {
      throw new Error('Only creator can cancel a bet');
    }

    // Descongelar fondos
    await walletService.unfreezeFunds(userId, bet.creator_amount, betId);

    // Actualizar apuesta
    await client.query(
      `UPDATE bets SET
       status = $1,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      ['cancelled', betId]
    );

    // Registrar auditoría
    await createAuditLog(client, userId, 'cancel_bet', 'bet', betId, {});

    await client.query('COMMIT');

    return {
      success: true,
      betId,
      status: 'cancelled'
    };

} catch (error) {
await client.query('ROLLBACK');
throw error;
} finally {
client.release();
}
}

/\*\*

- Obtener apuestas disponibles para un evento
  \*/
  async function getAvailableBets(eventId, userId, options = {}) {
  const {
  limit = 50,
  offset = 0,
  minAmount = 0,
  maxAmount = Number.MAX_SAFE_INTEGER,
  sortBy = 'created_at',
  sortOrder = 'DESC'
  } = options;

// Validar parámetros de ordenamiento para prevenir SQL injection
const validSortColumns = ['created_at', 'creator_amount', 'acceptor_amount'];
const validSortOrders = ['ASC', 'DESC'];

const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

try {
const result = await pool.query(
`SELECT b.id, b.event_id, b.creator_id, u.username as creator_username, 
              b.creator_choice, b.creator_amount, b.acceptor_amount, 
              b.created_at, b.updated_at
       FROM bets b
       JOIN users u ON b.creator_id = u.id
       WHERE b.event_id = $1 
         AND b.status = 'open' 
         AND b.creator_id != $2
         AND b.acceptor_amount BETWEEN $3 AND $4
       ORDER BY ${sortColumn} ${order}
       LIMIT $5 OFFSET $6`,
[eventId, userId || 0, minAmount, maxAmount, limit, offset]
);

    return result.rows;

} catch (error) {
console.error('Error fetching available bets:', error);
throw error;
}
}

// Otros métodos del servicio de apuestas
// ...

module.exports = {
createBetProposal,
acceptBet,
cancelBetProposal,
getAvailableBets,
// Exportar otros métodos...
};
Seguridad y Auditoría
Middleware de Seguridad
javascript// middleware/securityMiddleware.js
const jwt = require('jsonwebtoken');
const { createAuditLog } = require('../services/auditService');

// Verifica el token JWT
const authenticateToken = (req, res, next) => {
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];

if (!token) {
return res.status(401).json({ message: 'Acceso no autorizado' });
}

jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
if (err) {
return res.status(403).json({ message: 'Token inválido o expirado' });
}

    req.user = user;
    next();

});
};

// Registra todas las acciones financieras
const logFinancialActivity = (req, res, next) => {
const originalSend = res.send;

res.send = function(body) {
const response = typeof body === 'string' ? JSON.parse(body) : body;

    // Solo registrar si la operación fue exitosa
    if (response.success && req.user) {
      const { route, method, body: requestBody, params, user } = req;

      // Determinar tipo de actividad
      let activityType = 'unknown_financial';
      let entityType = null;
      let entityId = null;

      if (route.path.includes('/wallet')) {
        activityType = 'wallet_operation';
        entityType = 'wallet';
      } else if (route.path.includes('/bets')) {
        activityType = 'bet_operation';
        entityType = 'bet';
        entityId = params.betId || requestBody.betId;
      } else if (route.path.includes('/payments')) {
        activityType = 'payment_operation';
        entityType = 'payment';
        entityId = response.transactionId;
      }

      // Registrar en auditoría
      createAuditLog(
        user.id,
        activityType,
        entityType,
        entityId,
        {
          method,
          requestData: requestBody,
          responseData: response,
          routePath: route.path
        },
        req.ip,
        req.headers['user-agent']
      );
    }

    return originalSend.call(this, body);

};

next();
};

// Limita acciones por tiempo
const rateLimit = (maxRequests, timeWindow) => {
const requests = {};

return (req, res, next) => {
const ip = req.ip;
const userId = req.user?.id || 'anonymous';
const key = `${ip}_${userId}`;

    const now = Date.now();
    const windowStart = now - timeWindow;

    // Inicializar si no existe
    if (!requests[key]) {
      requests[key] = [];
    }

    // Limpiar solicitudes antiguas
    requests[key] = requests[key].filter(time => time > windowStart);

    // Verificar límite
    if (requests[key].length >= maxRequests) {
      return res.status(429).json({
        message: 'Demasiadas solicitudes, por favor intente más tarde',
        retryAfter: Math.ceil((requests[key][0] - windowStart) / 1000)
      });
    }

    // Agregar solicitud actual
    requests[key].push(now);

    next();

};
};

// Middleware para operaciones financieras sensibles
const secureFinancialEndpoint = [
authenticateToken,
logFinancialActivity,
rateLimit(20, 60000) // 20 solicitudes por minuto
];

module.exports = {
authenticateToken,
logFinancialActivity,
rateLimit,
secureFinancialEndpoint
};
Servicio de Auditoría
javascript// services/auditService.js
const { pool } = require('../db/postgresql');

/\*\*

- Crea un registro de auditoría
  \*/
  async function createAuditLog(client, userId, action, entityType, entityId, details, ipAddress = null, userAgent = null) {
  // Decide si usar el cliente proporcionado o crear uno nuevo
  const shouldReleaseClient = !client;
  const dbClient = client || await pool.connect();

try {
// Realizar la inserción
await dbClient.query(
`INSERT INTO audit_logs 
       (user_id, action, entity_type, entity_id, details, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
[userId, action, entityType, entityId, details, ipAddress, userAgent]
);

    return true;

} catch (error) {
console.error('Error creating audit log:', error);
// No lanzar error para no interrumpir la operación principal
return false;
} finally {
// Liberar cliente solo si lo creamos aquí
if (shouldReleaseClient && dbClient) {
dbClient.release();
}
}
}

/\*\*

- Buscar registros de auditoría
  \*/
  async function searchAuditLogs(filters = {}) {
  const {
  userId,
  action,
  entityType,
  entityId,
  startDate,
  endDate,
  limit = 100,
  offset = 0
  } = filters;

// Construir condiciones
const conditions = [];
const params = [];

if (userId) {
params.push(userId);
conditions.push(`user_id = $${params.length}`);
}

if (action) {
params.push(action);
conditions.push(`action = $${params.length}`);
}

if (entityType) {
params.push(entityType);
conditions.push(`entity_type = $${params.length}`);
}

if (entityId) {
params.push(entityId);
conditions.push(`entity_id = $${params.length}`);
}

if (startDate) {
params.push(startDate);
conditions.push(`created_at >= $${params.length}`);
}

if (endDate) {
params.push(endDate);
conditions.push(`created_at <= $${params.length}`);
}

// Armar WHERE
const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

// Agregar límite y offset
params.push(limit);
params.push(offset);

try {
const result = await pool.query(
`SELECT id, user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at
       FROM audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
params
);

    return result.rows;

} catch (error) {
console.error('Error searching audit logs:', error);
throw error;
}
}

/\*\*

- Obtener registros de auditoría para una entidad específica
  \*/
  async function getEntityAuditTrail(entityType, entityId, limit = 50) {
  try {
  const result = await pool.query(
  `SELECT a.id, a.user_id, u.username, a.action, a.details, a.created_at
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.entity_type = $1 AND a.entity_id = $2
       ORDER BY a.created_at DESC
       LIMIT $3`,
  [entityType, entityId, limit]
  );
      return result.rows;
  } catch (error) {
  console.error('Error getting entity audit trail:', error);
  throw error;
  }
  }

module.exports = {
createAuditLog,
searchAuditLogs,
getEntityAuditTrail
};
Detección de Fraudes y Patrones Sospechosos
Sistema de Alertas y Monitoreo
javascript// services/fraudDetectionService.js
const { pool } = require('../db/postgresql');
const { createAuditLog } = require('./auditService');

// Umbrales de detección
const THRESHOLDS = {
// Montos
LARGE_DEPOSIT: 500, // $500
RAPID_DEPOSITS: 3, // 3 depósitos en ventana de tiempo
RAPID_DEPOSITS_WINDOW: 60 _ 60 _ 1000, // 1 hora

// Apuestas
BET_COUNT_THRESHOLD: 15, // 15 apuestas
BET_COUNT_WINDOW: 60 _ 60 _ 1000, // 1 hora

// Ciclos
DEPOSIT_WITHDRAWAL_CYCLE: 3, // 3 ciclos
CYCLE_WINDOW: 24 _ 60 _ 60 \* 1000, // 24 horas

// IP
MULTIPLE_ACCOUNTS_IP: 3, // 3 cuentas
IP_WINDOW: 24 _ 60 _ 60 \* 1000 // 24 horas
};

/\*\*

- Detectar depósitos grandes
  \*/
  async function detectLargeDeposits() {
  try {
  const result = await pool.query(
  `SELECT t.id, t.wallet_id, t.amount, t.created_at, w.user_id, u.email, u.username
       FROM transactions t
       JOIN wallets w ON t.wallet_id = w.id
       JOIN users u ON w.user_id = u.id
       WHERE t.transaction_type = 'deposit'
       AND t.amount >= $1
       AND t.created_at > NOW() - INTERVAL '24 hours'
       ORDER BY t.amount DESC`,
  [THRESHOLDS.LARGE_DEPOSIT]
  );
      // Registrar alertas
      for (const row of result.rows) {
        await createAlert(
          'large_deposit',
          row.user_id,
          `Depósito grande: $${row.amount}`,
          {
            transactionId: row.id,
            amount: row.amount,
            walletId: row.wallet_id,
            timestamp: row.created_at
          }
        );
      }

      return result.rows;
  } catch (error) {
  console.error('Error detecting large deposits:', error);
  return [];
  }
  }

/\*\*

- Detectar depósitos rápidos
  _/
  async function detectRapidDeposits() {
  try {
  const result = await pool.query(
  `SELECT w.user_id, u.email, u.username, COUNT(_) as deposit_count,
  SUM(t.amount) as total_amount
  FROM transactions t
  JOIN wallets w ON t.wallet_id = w.id
  JOIN users u ON w.user_id = u.id
  WHERE t.transaction_type = 'deposit'
  AND t.created_at > NOW() - INTERVAL '1 hour'
  GROUP BY w.user_id, u.email, u.username
  HAVING COUNT(\*) >= $1`,
  [THRESHOLDS.RAPID_DEPOSITS]
  );
      // Registrar alertas
      for (const row of result.rows) {
        await createAlert(
          'rapid_deposits',
          row.user_id,
          `${row.deposit_count} depósitos en 1 hora ($${row.total_amount})`,
          {
            depositCount: row.deposit_count,
            totalAmount: row.total_amount
          }
        );
      }

      return result.rows;
  } catch (error) {
  console.error('Error detecting rapid deposits:', error);
  return [];
  }
  }

/\*\*

- Detectar ciclos de depósito-retiro
  \*/
  async function detectDepositWithdrawalCycles() {
  try {
  const users = await pool.query(
  `SELECT DISTINCT ON (w.user_id) w.user_id, u.email, u.username
       FROM transactions t
       JOIN wallets w ON t.wallet_id = w.id
       JOIN users u ON w.user_id = u.id
       WHERE t.created_at > NOW() - INTERVAL '24 hours'`
  );
      const cycleUsers = [];

      // Analizar patrones para cada usuario
      for (const user of users.rows) {
        const transactions = await pool.query(
          `SELECT transaction_type, amount, created_at
           FROM transactions t
           JOIN wallets w ON t.wallet_id = w.id
           WHERE w.user_id = $1
           AND t.created_at > NOW() - INTERVAL '24 hours'
           AND transaction_type IN ('deposit', 'withdrawal')
           ORDER BY created_at`,
          [user.user_id]
        );

        // Detectar ciclos
        let cycles = 0;
        let lastType = null;

        for (const tx of transactions.rows) {
          if (lastType === 'deposit' && tx.transaction_type === 'withdrawal') {
            cycles++;
          }
          lastType = tx.transaction_type;
        }

        if (cycles >= THRESHOLDS.DEPOSIT_WITHDRAWAL_CYCLE) {
          cycleUsers.push({
            ...user,
            cycles
          });

          await createAlert(
            'deposit_withdrawal_cycle',
            user.user_id,
            `${cycles} ciclos de depósito-retiro en 24 horas`,
            {
              cycles,
              transactions: transactions.rows
            }
          );
        }
      }

      return cycleUsers;
  } catch (error) {
  console.error('Error detecting deposit-withdrawal cycles:', error);
  return [];
  }
  }

/\*\*

- Detectar múltiples cuentas por IP
  \*/
  async function detectMultipleAccountsPerIP() {
  try {
  const result = await pool.query(
  `SELECT ip_address, COUNT(DISTINCT user_id) as user_count, 
              array_agg(DISTINCT user_id) as user_ids
       FROM audit_logs
       WHERE created_at > NOW() - INTERVAL '24 hours'
       AND ip_address IS NOT NULL
       GROUP BY ip_address
       HAVING COUNT(DISTINCT user_id) >= $1`,
  [THRESHOLDS.MULTIPLE_ACCOUNTS_IP]
  );
      // Registrar alertas
      for (const row of result.rows) {
        await createAlert(
          'multiple_accounts_per_ip',
          null, // No asociado a un usuario específico
          `${row.user_count} cuentas usando la misma IP: ${row.ip_address}`,
          {
            ipAddress: row.ip_address,
            userCount: row.user_count,
            userIds: row.user_ids
          }
        );
      }

      return result.rows;
  } catch (error) {
  console.error('Error detecting multiple accounts per IP:', error);
  return [];
  }
  }

/\*\*

- Crear alerta
  \*/
  async function createAlert(alertType, userId, message, details) {
  try {
  await pool.query(
  `INSERT INTO alerts 
       (alert_type, user_id, message, details, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
  [alertType, userId, message, details, 'new']
  );
      // Opcionalmente, notificar a administradores
      // sendAlertNotification(alertType, userId, message);

      return true;
  } catch (error) {
  console.error('Error creating alert:', error);
  return false;
  }
  }

/\*\*

- Ejecutar todas las detecciones
  \*/
  async function runAllDetections() {
  try {
  const largeDeposits = await detectLargeDeposits();
  const rapidDeposits = await detectRapidDeposits();
  const depositWithdrawalCycles = await detectDepositWithdrawalCycles();
  const multipleAccountsPerIP = await detectMultipleAccountsPerIP();
      return {
        largeDeposits,
        rapidDeposits,
        depositWithdrawalCycles,
        multipleAccountsPerIP,
        total: largeDeposits.length + rapidDeposits.length +
               depositWithdrawalCycles.length + multipleAccountsPerIP.length
      };
  } catch (error) {
  console.error('Error running fraud detections:', error);
  return {
  error: error.message,
  total: 0
  };
  }
  }

module.exports = {
detectLargeDeposits,
detectRapidDeposits,
detectDepositWithdrawalCycles,
detectMultipleAccountsPerIP,
runAllDetections
};
Checklist de Implementación
Requisitos Mínimos de Seguridad

Implementar autenticación robusta con JWT
Validar y sanitizar todas las entradas de usuario
Implementar transacciones atómicas para operaciones financieras
Configurar logs de auditoría detallados
Implementar límites de tasa para APIs sensibles
Establecer monitoreo y alertas para patrones sospechosos
Configurar backups automáticos de la base de datos
Implementar timeout de sesiones
Cifrar datos sensibles en reposo y en tránsito

Validaciones Cruciales

Verificar saldo disponible antes de cada apuesta
Validar estado de evento antes de permitir apuestas
Implementar controles de concurrencia para evitar condiciones de carrera
Verificar identidad de usuarios para depósitos/retiros grandes
Validar que transacciones no resulten en saldos negativos
Implementar límites de monto para nuevos usuarios
Verificar coherencia de datos de apuestas antes de procesarlas

Recursos y Referencias

Documentación de Kushki
PostgreSQL Documentación
JWT.io
OWASP Cheat Sheet: Authentication
OWASP Top Ten

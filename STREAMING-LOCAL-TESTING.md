# 🎥 Guía Completa: Testing de Streaming Local - GalloBets

## 🎯 OBJETIVO
Configurar y probar el sistema completo de streaming **en tu laptop actual** usando el Node Media Server ya implementado, sin necesidad de VPS externo.

---

## ✅ PREREQUISITOS VERIFICADOS

### **Sistema Actual:**
- ✅ Backend funcionando en puerto 3001
- ✅ Frontend funcionando en puerto 5174
- ✅ RTMPService ya implementado (archivo: `backend/src/services/rtmpService.ts`)
- ✅ Base de datos PostgreSQL (Neon.tech) funcionando

---

## 🚀 FASE 1: CONFIGURACIÓN RTMP SERVER LOCAL

### **Paso 1.1: Instalar Node Media Server**
```bash
cd backend
npm install node-media-server --save
```

### **Paso 1.2: Crear servidor RTMP local**
Crear archivo: `backend/src/services/localRTMPServer.ts`

```typescript
import NodeMediaServer from 'node-media-server';
import path from 'path';
import fs from 'fs';

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8080,
    allow_origin: '*',
    mediaroot: './media'
  },
  relay: {
    ffmpeg: '/usr/local/bin/ffmpeg', // Ajustar según tu sistema
    tasks: []
  }
};

class LocalRTMPServer {
  private nms: NodeMediaServer;
  private isRunning: boolean = false;

  constructor() {
    this.nms = new NodeMediaServer(config);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.nms.on('preConnect', (id, args) => {
      console.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
    });

    this.nms.on('postConnect', (id, args) => {
      console.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
    });

    this.nms.on('doneConnect', (id, args) => {
      console.log('[NodeEvent on doneConnect]', `id=${id} args=${JSON.stringify(args)}`);
    });

    this.nms.on('prePublish', (id, StreamPath, args) => {
      console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      // Aquí puedes agregar autenticación de stream keys
    });

    this.nms.on('postPublish', (id, StreamPath, args) => {
      console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
    });

    this.nms.on('donePublish', (id, StreamPath, args) => {
      console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
    });
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Crear directorio de media si no existe
        const mediaDir = path.join(process.cwd(), 'media');
        if (!fs.existsSync(mediaDir)) {
          fs.mkdirSync(mediaDir, { recursive: true });
        }

        this.nms.run();
        this.isRunning = true;
        console.log('🎥 Local RTMP Server started on rtmp://localhost:1935');
        console.log('📺 HLS accessible on http://localhost:8080');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  stop(): void {
    if (this.isRunning) {
      this.nms.stop();
      this.isRunning = false;
      console.log('🛑 Local RTMP Server stopped');
    }
  }

  getStats() {
    return this.nms.getSession();
  }
}

export const localRTMPServer = new LocalRTMPServer();
```

### **Paso 1.3: Integrar en el backend principal**
Modificar `backend/src/index.ts` para iniciar el RTMP server:

```typescript
// Agregar al final del archivo, después de la configuración del servidor Express
import { localRTMPServer } from './services/localRTMPServer';

// Iniciar RTMP server
localRTMPServer.start().then(() => {
  console.log('✅ Local RTMP server initialized');
}).catch(err => {
  console.error('❌ Failed to start RTMP server:', err);
});

// Cleanup on exit
process.on('SIGINT', () => {
  localRTMPServer.stop();
  process.exit();
});
```

---

## 🚀 FASE 2: INSTALACIÓN Y CONFIGURACIÓN OBS STUDIO

### **Paso 2.1: Descargar OBS Studio**
```bash
# Ubuntu/Debian:
sudo apt install obs-studio

# macOS:
brew install --cask obs

# Windows:
# Descargar desde https://obsproject.com/
```

### **Paso 2.2: Configuración inicial OBS**

#### **2.2.1: Configurar Video:**
1. Abrir OBS Studio
2. `Settings → Video`
   - **Base Resolution**: 1920x1080
   - **Output Resolution**: 1280x720 (720p para testing)
   - **Downscale Filter**: Bicubic
   - **Common FPS**: 30

#### **2.2.2: Configurar Streaming:**
1. `Settings → Stream`
   - **Service**: Custom...
   - **Server**: `rtmp://localhost:1935/live`
   - **Stream Key**: `test_stream_001` (o cualquier clave de prueba)

#### **2.2.3: Configurar Output:**
1. `Settings → Output`
   - **Output Mode**: Simple
   - **Video Bitrate**: 2500 Kbps
   - **Encoder**: Software (x264)
   - **Audio Bitrate**: 160

### **Paso 2.3: Configurar fuentes de video**

#### **Opción A: Webcam**
1. `+ Sources → Video Capture Device`
2. Seleccionar tu webcam
3. Configurar resolución y FPS

#### **Opción B: Screen Capture**
1. `+ Sources → Display Capture`
2. Seleccionar pantalla a capturar

#### **Opción C: Video de prueba**
1. `+ Sources → Media Source`
2. Seleccionar un archivo de video para streaming de prueba

---

## 🚀 FASE 3: CONFIGURACIÓN FRONTEND PARA HLS

### **Paso 3.1: Instalar dependencias de video**
```bash
cd frontend
npm install video.js videojs-contrib-hls hls.js
npm install --save-dev @types/video.js
```

### **Paso 3.2: Crear componente de streaming**
Crear archivo: `frontend/src/components/streaming/LocalStreamPlayer.tsx`

```typescript
import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface LocalStreamPlayerProps {
  streamKey: string;
  autoplay?: boolean;
  controls?: boolean;
}

const LocalStreamPlayer: React.FC<LocalStreamPlayerProps> = ({
  streamKey,
  autoplay = true,
  controls = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // URL del stream HLS local
    const hlsUrl = `http://localhost:8080/live/${streamKey}/index.m3u8`;

    const options = {
      autoplay: autoplay,
      controls: controls,
      responsive: true,
      fluid: true,
      sources: [{
        src: hlsUrl,
        type: 'application/x-mpegURL'
      }],
      html5: {
        hls: {
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
          overrideNative: true
        }
      }
    };

    // Inicializar Video.js
    playerRef.current = videojs(videoRef.current, options);

    // Event listeners
    playerRef.current.on('play', () => {
      setIsPlaying(true);
      setError(null);
    });

    playerRef.current.on('pause', () => {
      setIsPlaying(false);
    });

    playerRef.current.on('error', (e: any) => {
      console.error('Video player error:', e);
      setError('Error loading stream. Make sure OBS is streaming to the correct URL.');
      setIsPlaying(false);
    });

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [streamKey, autoplay, controls]);

  const refreshStream = () => {
    if (playerRef.current) {
      playerRef.current.src({
        src: `http://localhost:8080/live/${streamKey}/index.m3u8`,
        type: 'application/x-mpegURL'
      });
      playerRef.current.play();
    }
  };

  return (
    <div className="local-stream-player bg-black rounded-lg overflow-hidden">
      <div className="relative">
        <video
          ref={videoRef}
          className="video-js vjs-default-skin w-full"
          data-setup="{}"
        />
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white p-4">
              <div className="text-red-400 mb-2">⚠️ Stream Error</div>
              <div className="text-sm mb-4">{error}</div>
              <button 
                onClick={refreshStream}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {!isPlaying && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-center">
              <div className="text-2xl mb-2">📡</div>
              <div>Waiting for stream...</div>
              <div className="text-sm text-gray-300 mt-2">
                Stream Key: {streamKey}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-gray-800 text-white text-sm">
        <div className="flex justify-between items-center">
          <div>
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              isPlaying ? 'bg-red-500' : 'bg-gray-500'
            }`}></span>
            {isPlaying ? 'LIVE' : 'OFFLINE'}
          </div>
          <div className="text-gray-300">
            Stream: {streamKey}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalStreamPlayer;
```

### **Paso 3.3: Crear página de testing**
Crear archivo: `frontend/src/pages/StreamingTest.tsx`

```typescript
import React, { useState } from 'react';
import LocalStreamPlayer from '../components/streaming/LocalStreamPlayer';

const StreamingTest: React.FC = () => {
  const [streamKey, setStreamKey] = useState('test_stream_001');
  const [customKey, setCustomKey] = useState('');

  const testStreams = [
    'test_stream_001',
    'demo_galleros_2024',
    'live_event_test',
    'quality_test_stream'
  ];

  const handleCustomKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customKey.trim()) {
      setStreamKey(customKey.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4 text-center">
            🎥 GalloBets - Local Streaming Test
          </h1>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <h3 className="font-semibold text-blue-900">Setup Instructions:</h3>
            <ol className="list-decimal list-inside text-blue-800 mt-2 space-y-1">
              <li>Start backend server: <code>npm run dev</code></li>
              <li>Open OBS Studio</li>
              <li>Configure stream to: <code>rtmp://localhost:1935/live</code></li>
              <li>Use stream key: <code>{streamKey}</code></li>
              <li>Click "Start Streaming" in OBS</li>
              <li>Stream should appear below within 10-15 seconds</li>
            </ol>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stream Player */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Live Stream Player</h2>
              <LocalStreamPlayer streamKey={streamKey} />
            </div>
          </div>

          {/* Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
              <h3 className="text-lg font-semibold mb-4">Stream Controls</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Test Stream Keys:
                </label>
                <div className="space-y-2">
                  {testStreams.map((key) => (
                    <button
                      key={key}
                      onClick={() => setStreamKey(key)}
                      className={`w-full text-left px-3 py-2 rounded border ${
                        streamKey === key
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <form onSubmit={handleCustomKeySubmit}>
                  <label className="block text-sm font-medium mb-2">
                    Custom Stream Key:
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      placeholder="Enter custom key..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Use
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* OBS Configuration */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-4">OBS Configuration</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="font-medium">Service:</label>
                  <div className="bg-gray-100 p-2 rounded font-mono">Custom...</div>
                </div>
                <div>
                  <label className="font-medium">Server:</label>
                  <div className="bg-gray-100 p-2 rounded font-mono">
                    rtmp://localhost:1935/live
                  </div>
                </div>
                <div>
                  <label className="font-medium">Stream Key:</label>
                  <div className="bg-gray-100 p-2 rounded font-mono">
                    {streamKey}
                  </div>
                </div>
                <div>
                  <label className="font-medium">Recommended Bitrate:</label>
                  <div className="bg-gray-100 p-2 rounded">2500 Kbps (720p)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Dashboard */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-green-600 text-2xl mb-2">🟢</div>
              <div className="text-green-800 font-semibold">Backend</div>
              <div className="text-green-600 text-sm">Port 3001</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-green-600 text-2xl mb-2">🟢</div>
              <div className="text-green-800 font-semibold">Frontend</div>
              <div className="text-green-600 text-sm">Port 5174</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-blue-600 text-2xl mb-2">📡</div>
              <div className="text-blue-800 font-semibold">RTMP Server</div>
              <div className="text-blue-600 text-sm">Port 1935</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <div className="text-purple-600 text-2xl mb-2">📺</div>
              <div className="text-purple-800 font-semibold">HLS Output</div>
              <div className="text-purple-600 text-sm">Port 8080</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingTest;
```

---

## 🚀 FASE 4: CONFIGURACIÓN FINAL Y TESTING

### **Paso 4.1: Agregar ruta en el frontend**
Modificar `frontend/src/App.tsx` (o el archivo de rutas):

```typescript
import StreamingTest from './pages/StreamingTest';

// Agregar ruta:
<Route path="/streaming-test" element={<StreamingTest />} />
```

### **Paso 4.2: Verificar puertos disponibles**
```bash
# Verificar que los puertos estén libres:
netstat -tulpn | grep -E "(1935|8080)"

# Si algún puerto está ocupado, terminar el proceso:
sudo fuser -k 1935/tcp
sudo fuser -k 8080/tcp
```

### **Paso 4.3: Iniciar servicios en orden**
```bash
# Terminal 1: Backend (incluye RTMP server)
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend  
npm run dev

# Verificar logs que confirmen:
# ✅ Backend running on port 3001
# ✅ Local RTMP server initialized
# ✅ Frontend running on port 5174
```

---

## 🎯 PROCESO DE TESTING COMPLETO

### **Test 1: Verificación de servicios**
1. Abrir: `http://localhost:5174/streaming-test`
2. Verificar que aparezca la interfaz de testing
3. Confirmar estado de servicios (todos en verde)

### **Test 2: Configuración OBS**
1. Abrir OBS Studio
2. `Settings → Stream`:
   - Service: **Custom...**
   - Server: **rtmp://localhost:1935/live**  
   - Stream Key: **test_stream_001**
3. Agregar fuente de video (webcam o pantalla)
4. Click **"Start Streaming"**

### **Test 3: Verificación de stream**
1. En OBS: Confirmar que aparezca "LIVE" en verde
2. En el navegador: El player debería mostrar el video en ~10-15 segundos
3. Verificar calidad de video y audio
4. Probar pausing/playing del stream

### **Test 4: Testing de calidad**
```bash
# Verificar archivos HLS generados:
ls -la backend/media/live/test_stream_001/

# Debería mostrar archivos .ts y .m3u8
```

### **Test 5: Multiple stream keys**
1. Cambiar stream key en OBS a `demo_galleros_2024`
2. Reiniciar stream en OBS
3. En frontend: cambiar a la misma key
4. Verificar que funcione con diferentes keys

---

## 🔧 TROUBLESHOOTING COMÚN

### **Problema: Stream no aparece**
```bash
# Verificar logs del backend
tail -f backend/logs/app.log

# Verificar estado RTMP server
curl http://localhost:8080/api/server

# Verificar archivos HLS
ls backend/media/live/[tu_stream_key]/
```

### **Problema: OBS no puede conectar**
1. Verificar firewall local
2. Confirmar puerto 1935 disponible: `netstat -tulpn | grep 1935`
3. Probar con: `rtmp://127.0.0.1:1935/live`

### **Problema: Video cortado/buffering**
1. Reducir bitrate en OBS a 1500 Kbps
2. Cambiar resolución a 480p
3. Verificar CPU usage durante streaming

### **Problema: No audio**
1. Verificar configuración de audio en OBS
2. Agregar "Audio Output Capture" source
3. Confirmar niveles de audio en OBS

---

## 🎉 RESULTADOS ESPERADOS

### **Al completar exitosamente:**
- ✅ Stream local funcionando en `http://localhost:5174/streaming-test`
- ✅ OBS conectado y transmitiendo  
- ✅ Video en vivo visible en el navegador
- ✅ Latencia < 10-15 segundos
- ✅ Calidad 720p @ 2500 kbps
- ✅ Sistema completo probado localmente

### **Métricas de éxito:**
- **Latencia**: < 15 segundos (normal para HLS)
- **Calidad**: 720p sin cortes
- **CPU Usage**: < 50% durante streaming  
- **Reliability**: Stream estable por > 5 minutos

---

## 🚀 PRÓXIMOS PASOS (POST-TESTING)

1. **Integrar con base de datos**: Conectar streams con events table
2. **Agregar autenticación**: Verificar stream keys contra BD
3. **Analytics en vivo**: Tracking de viewers y métricas
4. **Multiple viewers**: Probar con múltiples navegadores
5. **Mobile testing**: Verificar reproducción en móviles

---

## 🎮 FASE 5: FLUJO COMPLETO DEL OPERADOR

### **🎯 OBJETIVO FASE 5**
Simular el workflow completo: **Admin/Operador** crea evento → peleas → gestiona transmisión en vivo

### **Prerequisitos Fase 5:**
- ✅ Streaming técnico funcionando (Fases 1-4)
- ✅ Admin interface accesible en `/admin`
- ✅ Usuario con rol `admin` o `operator`

---

## 🚀 PASO 5.1: CREAR EVENTO DESDE ADMIN

### **5.1.1: Acceder al Admin Dashboard**
```bash
# Asegurar que backend y frontend están corriendo
cd backend && npm run dev  # Puerto 3001
cd frontend && npm run dev # Puerto 5174
```

### **5.1.2: Login y Navegación**
1. Abrir: `http://localhost:5174/login`
2. Login con usuario `admin` o `operator`
3. Navegar a: `http://localhost:5174/admin/events`
4. Click **"+ Crear Evento"**

### **5.1.3: Configurar Evento de Prueba**
```json
{
  "name": "Gallera Test Event 2024",
  "scheduledDate": "2024-09-16T19:00:00", 
  "venueId": "[seleccionar_venue_existente]",
  "operatorId": "[tu_user_id]",
  "description": "Evento de prueba para testing streaming",
  "status": "scheduled"
}
```

### **5.1.4: Verificar Evento Creado**
- ✅ Evento aparece en lista con status `scheduled`
- ✅ Datos correctos: fecha, venue, operador
- ✅ Botón **"Gestionar"** disponible

---

## 🚀 PASO 5.2: CREAR PELEAS (ROOSTER FIGHTS)

### **5.2.1: Acceder a Gestión de Evento**
1. En `/admin/events`, click **"Gestionar"** en tu evento
2. Se abre modal **"Gestión Completa del Evento"**
3. Navegar a tab **"Peleas"**

### **5.2.2: Crear Primera Pelea**
Click **"+ Crear Pelea"** y configurar:
```json
{
  "number": 1,
  "redCorner": "Gallo Rojo Campeón",
  "blueCorner": "Gallo Azul Retador", 
  "weight": 2.5,
  "status": "upcoming",
  "notes": "Pelea estelar - testing streaming"
}
```

### **5.2.3: Crear Múltiples Peleas**
Repetir para crear al menos 3 peleas:
```json
[
  {
    "number": 1,
    "redCorner": "Gallo Rojo Campeón",
    "blueCorner": "Gallo Azul Retador",
    "weight": 2.5,
    "status": "upcoming"
  },
  {
    "number": 2, 
    "redCorner": "Tornado Negro",
    "blueCorner": "Relámpago Dorado",
    "weight": 2.8,
    "status": "upcoming"
  },
  {
    "number": 3,
    "redCorner": "Furia Salvaje",
    "blueCorner": "Martillo Feroz",
    "weight": 3.0,
    "status": "upcoming"
  }
]
```

### **5.2.4: Verificar Peleas Creadas**
- ✅ 3 peleas en estado `upcoming`
- ✅ Orden numérico correcto (1, 2, 3)
- ✅ Detalles completos de cada pelea

---

## 🚀 PASO 5.3: ACTIVAR EVENTO Y PREPARAR TRANSMISIÓN

### **5.3.1: Cambiar Estado Evento**
1. En modal de gestión, tab **"General"**
2. Click **"Activar Evento"** 
3. Status cambia: `scheduled` → `in-progress`
4. Se genera **stream_key** automáticamente

### **5.3.2: Configurar OBS para Evento**
```bash
# OBS Settings → Stream:
Service: Custom...
Server: rtmp://localhost:1935/live  
Stream Key: [copiar_del_evento_activo]
# Ejemplo: gallera_test_event_2024_001
```

### **5.3.3: Verificar Preparación**
- ✅ Stream key generado y visible
- ✅ Evento en estado `in-progress`
- ✅ OBS configurado con stream key correcto

---

## 🚀 PASO 5.4: GESTIÓN WORKFLOW: PELEAS → TRANSMISIÓN

### **5.4.1: Preparar Primera Pelea**
1. En tab **"Peleas"**, seleccionar **Pelea #1**
2. Click **"Cambiar Estado"** → `betting`
3. Confirmar: Pelea acepta apuestas
4. **NO iniciar stream aún**

### **5.4.2: Iniciar Transmisión**
1. En OBS Studio: Click **"Start Streaming"**
2. Verificar: OBS muestra estado "LIVE"
3. En admin: tab **"Streaming"**
4. Verificar: Stream status = `live`

### **5.4.3: Cambiar Pelea a Estado Live**
1. En tab **"Peleas"**, Pelea #1
2. Click **"Cambiar Estado"** → `live`
3. **RESULTADO**: Pelea live + Stream live simultáneo

### **5.4.4: Simular Progreso de Pelea**
```json
// Secuencia de estados por pelea:
"upcoming" → "betting" → "live" → "completed"

// Timeline ejemplo:
00:00 - Pelea #1: betting (2 minutos)
02:00 - Pelea #1: live (5 minutos)
07:00 - Pelea #1: completed + resultado
07:30 - Pelea #2: betting (2 minutos)
09:30 - Pelea #2: live (5 minutos)
14:30 - Pelea #2: completed + resultado
// ... continuar con Pelea #3
```

---

## 🚀 PASO 5.5: WORKFLOW COMPLETO DE TRANSMISIÓN

### **5.5.1: Ciclo Completo Por Pelea**

#### **🔄 Para cada pelea (repetir 3 veces):**

**A. Preparación (30 segundos):**
1. Seleccionar próxima pelea
2. Cambiar estado: `upcoming` → `betting`
3. Anunciar en stream: "Aceptando apuestas"

**B. Periodo de Apuestas (2 minutos):**
1. Mantener estado `betting`
2. Stream continúa - mostrar información pelea
3. Simular: usuarios haciendo apuestas

**C. Pelea en Vivo (5 minutos):**
1. Cambiar estado: `betting` → `live`
2. Stream principal: mostrar "pelea" en vivo
3. Simular: acción de gallos peleando

**D. Finalización (30 segundos):**
1. Cambiar estado: `live` → `completed`
2. Agregar resultado: `red`, `blue`, o `draw`
3. Anunciar ganador en stream

### **5.5.2: Transición Entre Peleas**
```json
// Entre pelea N y pelea N+1:
{
  "current_fight_end": "Pelea #N completed con resultado",
  "transition_period": "1-2 minutos de análisis/entrevistas", 
  "next_fight_prep": "Preparar Pelea #N+1 para betting",
  "stream_continuity": "Stream NUNCA se detiene entre peleas"
}
```

### **5.5.3: Finalización Completa**
1. Todas las peleas en estado `completed`
2. Click **"Finalizar Evento"**
3. Estado evento: `in-progress` → `completed`
4. En OBS: **"Stop Streaming"**

---

## 🚀 PASO 5.6: MONITOREO Y ANALYTICS EN VIVO

### **5.6.1: Panel de Control en Tiempo Real**
Durante el evento, monitorear en tab **"Analytics"**:
```json
{
  "stream_status": "live | offline | error",
  "current_viewers": "número_actual",
  "peak_viewers": "máximo_alcanzado",
  "fight_status": "betting | live | completed",
  "total_bets": "cantidad_apuestas_activas",
  "stream_quality": "720p @ 2500kbps",
  "uptime": "tiempo_total_transmitiendo"
}
```

### **5.6.2: Verificación Multinavegador**
1. Abrir stream en múltiples navegadores
2. Verificar sincronización de estados
3. Confirmar: cambios se reflejan en tiempo real

### **5.6.3: Testing de Interrupción**
```bash
# Testing de recuperación:
1. Detener OBS por 30 segundos
2. Reiniciar stream con misma key
3. Verificar: reconexión automática
4. Confirmar: viewers se reconectan
```

---

## 🎯 PASO 5.7: CRITERIOS DE ÉXITO WORKFLOW COMPLETO

### **✅ Checklist de Validación:**

#### **Gestión de Eventos:**
- [ ] Evento creado desde admin con datos completos
- [ ] 3+ peleas creadas en orden secuencial
- [ ] Estado evento: `scheduled` → `in-progress` → `completed`
- [ ] Stream key generado automáticamente

#### **Workflow de Peleas:**
- [ ] Estados correctos: `upcoming` → `betting` → `live` → `completed`
- [ ] Transiciones fluidas entre peleas
- [ ] Resultados asignados correctamente
- [ ] Timeline realista de duración

#### **Transmisión Técnica:**
- [ ] OBS conecta y mantiene stream estable
- [ ] Calidad: 720p, latencia <15 segundos
- [ ] Stream nunca se interrumpe entre peleas
- [ ] Reconexión automática funciona

#### **Monitoreo Admin:**
- [ ] Analytics en tiempo real funcionando
- [ ] Estados se sincronizan entre admin y stream
- [ ] Multiple viewers simultáneos soportados
- [ ] Control completo desde interface admin

#### **Experiencia Operador:**
- [ ] Workflow intuitivo y sin complejidad técnica
- [ ] Controles claros para gestión de estado
- [ ] Información crítica visible en todo momento
- [ ] Capacidad de recuperarse de errores

---

## 🚨 TROUBLESHOOTING DEL WORKFLOW

### **Problema: Estado de pelea no cambia**
```bash
# Verificar API endpoint:
curl -X PATCH http://localhost:3001/api/fights/[fight_id]/status \
  -H "Authorization: Bearer [tu_token]" \
  -d '{"status": "live"}'

# Verificar logs backend:
tail -f backend/logs/app.log
```

### **Problema: Stream key no se genera**
```sql
-- Verificar en base de datos:
SELECT id, name, status, stream_key 
FROM events 
WHERE status = 'in-progress';

-- Si NULL, generar manualmente:
UPDATE events 
SET stream_key = 'gallera_test_event_2024_001' 
WHERE id = '[event_id]';
```

### **Problema: Admin interface no responde**
```bash
# Verificar SSE connections:
curl -H "Authorization: Bearer [token]" \
  http://localhost:3001/api/sse/admin/system-status

# Verificar WebSocket connections:
# Abrir browser dev tools → Network → WS
```

---

## 🎉 RESULTADOS ESPERADOS - WORKFLOW COMPLETO

### **Al completar Fase 5 exitosamente:**
- ✅ **Evento completo simulado**: 3 peleas con estados reales
- ✅ **Transmisión profesional**: Stream continuo de 20+ minutos 
- ✅ **Control operativo**: Gestión fluida desde admin interface
- ✅ **Analytics en vivo**: Monitoreo completo de métricas
- ✅ **Experiencia realista**: Simula evento real de gallera

### **Métricas de éxito del workflow:**
- **Duración total**: 20-30 minutos de evento completo
- **Transiciones**: <5 segundos entre estados de pelea
- **Estabilidad stream**: 0 desconexiones durante evento
- **Usabilidad admin**: Operador gestiona sin dificultad técnica
- **Sincronización**: Estados admin ↔ stream perfectamente alineados

---

**🎯 TIEMPO ESTIMADO SETUP TÉCNICO: 2-3 horas (Fases 1-4)**
**🎯 TIEMPO ESTIMADO WORKFLOW COMPLETO: 1-2 horas (Fase 5)**
**🎯 DIFICULTAD TOTAL: Avanzada (streaming + workflow + admin)**
**🎯 RESULTADO FINAL: Sistema completo de transmisión de eventos con gestión operativa profesional**
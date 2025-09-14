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

**🎯 TIEMPO ESTIMADO DE SETUP: 2-3 horas**
**🎯 DIFICULTAD: Intermedia (requiere instalación OBS)**
**🎯 RESULTADO: Sistema de streaming completamente funcional en laptop local**
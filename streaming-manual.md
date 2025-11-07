# Manual de Streaming para Operadores - GALLEROS.NET

## Introducción

Este manual te guiará paso a paso sobre cómo llevar a cabo un evento de streaming de peleas de gallos desde el principio hasta el final. Sigue estas instrucciones detalladamente para asegurar que el evento se realice sin problemas.

## Descripción de Páginas y Funcionalidades

### Página Principal de Eventos: `/admin/events`

Esta es la página principal para gestionar todos tus eventos. Aquí puedes ver, crear y gestionar eventos de forma rápida o detallada.

**Elementos de la página principal:**
- **Cabecera**: Botón para crear nuevos eventos y estado del sistema
- **Filtros**: Seleccionar eventos de hoy, esta semana o todos; filtrar por estado
- **Eventos de Hoy**: Lista de eventos del día con controles rápidos
- **Controles Rápidos**: Activar, iniciar/detener stream, finalizar evento, gestionar, eliminar
- **Historial de Eventos**: Lista completa de eventos pasados

**Botones y su función:**
- **Crear Evento** (botón verde): Lleva a la página de creación de eventos
- **Activar** (botón verde): Cambia estado a "en progreso"
- **Iniciar/Detener Stream** (botones rojos): Controlan la transmisión
- **Finalizar** (botón azul): Completa el evento
- **Gestionar** (botón gris): Abre modal con controles detallados
- **Eliminar** (icono de basura): Elimina el evento

### Modal de Gestión de Eventos

Se abre al hacer clic en "Gestionar" en cualquier evento. Tiene 5 pestañas con diferentes funcionalidades:

**Pestaña "Info General":**
- Muestra información básica del evento
- Permite actualizar la información del evento
- Muestra estadísticas básicas
- **Botón "Editar"**: Abre modal para editar nombre, fecha y operador del evento. 
  *Nota: Este botón anteriormente no funcionaba, pero ahora está completamente operativo y permite editar todos los detalles del evento.*

**Pestaña "Peleas":**
- **Controles de Streaming**: Iniciar y detener transmisión
- **Estado del Stream**: Indicador visual del estado actual
- **Botones de Control**: Iniciar/Detener stream con indicadores visuales
- **Gestión de Peleas**: Crear, editar y administrar peleas del evento
- **Botón "Nueva Pelea"**: Abre modal para crear peleas

**Pestaña "Apuestas Vivo":**
- Muestra métricas de apuestas en tiempo real
- Monitorea participación de usuarios

**Pestaña "Streaming":**
- Contiene mensaje de redirección a la pestaña de Peleas

**Pestaña "Problemas":**
- Herramientas para reportar y gestionar incidencias técnicas

### Página de Creación de Eventos: `/admin/events/create`

Formulario para crear nuevos eventos.

**Elementos del formulario:**
- **Nombre del Evento**: Campo de texto para el título del evento
- **Venue**: Selector para elegir el lugar donde se realizará el evento
- **Fecha y Hora Programada**: Selector para programar el evento
- **Operador**: Selector para asignar operador (predeterminado al usuario actual)
- **Botones**: Guardar evento o cancelar

### Página de Streaming: `/admin/streaming`

Panel de control general para streams (usado principalmente por administradores).

**Elementos:**
- **Controles de Evento**: Selección de evento y detalles del stream
- **Indicadores de Estado**: Visualización del estado SSE y conexión
- **Reproductor HLS**: Vista previa del stream
- **Métricas de Usuarios**: Contador de viewers en tiempo real

## Requisitos Previos

- Computadora con acceso a internet
- Cuenta de operador activa en GALEROS.NET
- OBS Studio instalado (puedes descargarlo desde https://obsproject.com/)
- Sistema de captura de video de buena calidad
- Conexión a internet estable con al menos 5 Mbps de subida
- Servidor de streaming RTMP corriendo (ver instrucciones adicionales más abajo)

## Configuración de Red y Firewall

### Puertos Requeridos
| Puerto | Protocolo | Uso | Requerido Para |
|--------|-----------|-----|----------------|
| 1935 | TCP | RTMP | Streaming desde OBS |
| 8000 | TCP | HTTP/HLS | Reproducción para usuarios |
| 3001 | TCP | HTTP/API | Backend API |
| 5432 | TCP | PostgreSQL | Database (interno) |

### Configurar Firewall (Ubuntu/Debian)
```bash
# Habilitar firewall
sudo ufw enable

# Abrir puertos requeridos
sudo ufw allow 1935/tcp  # RTMP
sudo ufw allow 8000/tcp  # HLS
sudo ufw allow 3001/tcp  # API
sudo ufw allow 22/tcp    # SSH

# Verificar reglas
sudo ufw status
```

### Verificar Puertos Abiertos
```bash
# Test RTMP (desde otra máquina)
telnet YOUR-SERVER-IP 1935

# Test HLS
curl http://YOUR-SERVER-IP:8000/stat

# Test API
curl http://YOUR-SERVER-IP:3001/api/health
```

### Requisitos de Ancho de Banda
- **Mínimo**: 5 Mbps subida (720p @ 2500 kbps)
- **Recomendado**: 10 Mbps subida (estabilidad)
- **Test velocidad**: https://speedtest.net

### Solución de Problemas de Red
**Problema: OBS no conecta**
1. Verificar firewall: `sudo ufw status`
2. Test puerto: `telnet SERVER-IP 1935`
3. Verificar rtmp-server corriendo: `ps aux | grep rtmp`

**Problema: HLS no funciona**
1. Test puerto 8000: `curl http://SERVER-IP:8000/stat`
2. Verificar logs rtmp-server
3. Confirmar ffmpeg instalado: `ffmpeg -version`

## Parte 1: Preparación del Evento (Día anterior o el mismo día)

### Paso 1: Iniciar sesión en GALEROS.NET
1. Abre tu navegador web favorito
2. Ve a la página de GALEROS.NET
3. Ingresa tus credenciales de operador
4. Asegúrate de que estás en el panel de operador

### Paso 2: Crear el evento
1. Haz clic en "Eventos" en el menú lateral
2. Haz clic en "Crear Nuevo Evento"
3. Completa los siguientes campos:
   - **Nombre del evento**: Escribe el nombre, por ejemplo "Pelea de Gallos - Viernes 6 Oct"
   - **Venue**: Selecciona el lugar donde se realizará la pelea
   - **Fecha y hora programada**: Selecciona cuándo comenzará el evento
4. Haz clic en "Crear Evento"

### Paso 3: Verificar que el evento se creó correctamente
- El evento debe aparecer en la lista de eventos
- El estado debe ser "scheduled" (programado)

## Parte 2: Preparación del Streaming (Antes de comenzar)

### Paso 4: Configurar el streaming
1. Ve a la página de "Streaming" en el panel de administración
2. Selecciona el evento que creaste
3. El sistema mostrará una clave de streaming (stream key)
4. Anota esta clave, la necesitarás en OBS Studio

### Paso 5: Configurar OBS Studio
1. Abre OBS Studio en tu computadora
2. Ve a "Configuración" (Settings)
3. Ve a la pestaña "Stream" (Transmitir)
4. En "Service", selecciona "Custom..."
5. En "Server", escribe: `rtmp://YOUR-DOMAIN.com:1935/live`
   - **Desarrollo (localhost)**: `rtmp://localhost:1935/live`
   - **Producción**: `rtmp://gallobets.com:1935/live` (usar tu dominio real)

### Diferencia entre Desarrollo y Producción

**Entorno de Desarrollo (Localhost)**:
- RTMP: `rtmp://localhost:1935/live`
- HLS: `http://localhost:8000/live/STREAM-KEY.m3u8`
- Solo funciona en la misma máquina

**Entorno de Producción**:
- RTMP: `rtmp://YOUR-DOMAIN.com:1935/live`
- HLS: `http://YOUR-DOMAIN.com:8000/live/STREAM-KEY.m3u8`
- Accesible desde cualquier ubicación
- Requiere dominio o IP pública

## Gestión de Stream Keys

### ¿Dónde Encontrar tu Stream Key?

1. Iniciar sesión como admin/operador
2. Ir a /admin/events
3. Click en 'Gestionar' en el evento
4. Tab 'Info General'
5. Sección 'Stream Key' (campo de texto)

### Generar una Nueva Stream Key

1. Si el campo 'Stream Key' está vacío: Click 'Generate Key'
2. Key generada automáticamente (formato: random-hash)
3. Click 'Copy' para copiar al portapapeles

### Usar la Key en OBS Studio

1. Abrir OBS Studio → Settings → Stream
2. Pegar stream key en campo 'Stream Key'
3. Ejemplo: `a7f3e9c2d1b4f8e6a9c3d7e1f2b5c8a4`

### Seguridad de Stream Keys

⚠️ **Importante:**
- NO compartir stream key públicamente
- Regenerar key si se compromete
- Cada evento puede tener key diferente
- Keys expiran 24h después del evento
6. En "Stream Key", escribe la clave que obtuviste en el paso anterior
7. Haz clic en "OK"

### Paso 6: Configurar la calidad de video (Opcional pero recomendado)
1. En OBS Studio, ve a "Configuración" (Settings)
2. Ve a la pestaña "Output" (Salida)
3. Ajusta los siguientes valores:
   - **Bitrate**: 2500 para 720p (si tu internet es bueno)
   - **Keyframe Interval**: 2 segundos
   - **CPU Usage Preset**: veryfast
4. En la pestaña "Video":
   - **Base Resolution**: 1920x1080
   - **Output Resolution**: 1280x720
   - **FPS**: 30

## Parte 3: Durante el Evento

### Paso 7: Activar el evento
1. En el panel de GALEROS.NET, ve a la lista de eventos
2. Encuentra tu evento y haz clic en "Editar"
3. Cambia el estado de "scheduled" a "in-progress" (en progreso)
4. Haz clic en "Guardar"

### Paso 8: Iniciar la transmisión
1. En OBS Studio, haz clic en "Start Streaming" (Iniciar transmisión)
2. Espera a que aparezca el mensaje "✅ Live" en la parte inferior
3. Verifica en el panel de GALEROS.NET que el streaming esté activo

### Paso 9: Crear las peleas
1. Ve a la sección de "Peleas" dentro del evento
2. Haz clic en "Crear Pelea" para cada combate
3. Completa los siguientes campos para cada pelea:
   - **Número de pelea**: 1, 2, 3, etc.
   - **Gallo Rojo**: Nombre del gallo en la esquina roja
   - **Gallo Azul**: Nombre del gallo en la esquina azul
   - **Peso**: Peso en libras o kilos según sea el caso
   - **Notas**: Información adicional si es necesario
4. Crea todas las peleas que se realizarán en el evento

### Paso 10: Administrar las apuestas
1. Para abrir la ventana de apuestas de una pelea:
   - Ve a la lista de peleas
   - Haz clic en la pelea específica
   - Haz clic en "Abrir Apuestas"
2. Los usuarios ahora pueden hacer apuestas en la pelea
3. Para cerrar las apuestas antes de que empiece la pelea, haz clic en "Cerrar Apuestas"

### Paso 11: Iniciar cada pelea
1. Cuando estén listos para comenzar una pelea:
   - Haz clic en la pelea en la lista
   - Cambia el estado de "betting" (apuestas) a "live" (en vivo)
   - Las apuestas se cerrarán automáticamente
2. La pelea ahora está en vivo y visible para los suscriptores

### Paso 12: Finalizar cada pelea
1. Después de que termine la pelea:
   - Haz clic en la pelea
   - Registra el resultado (Rojo ganó, Azul ganó o Empate)
   - Cambia el estado a "completed" (completado)
2. El sistema procesará automáticamente las apuestas y distribuirá los premios

## Parte 4: Finalización del Evento

### Paso 13: Finalizar el evento
1. Cuando todas las peleas hayan terminado:
   - Ve a la lista de eventos
   - Haz clic en tu evento
   - Haz clic en "Completar Evento"
2. Confirma que deseas completar el evento

### Paso 14: Detener la transmisión
1. En OBS Studio:
   - Haz clic en "Stop Streaming" (Detener transmisión)
   - Espera a que se cierre correctamente
2. Verifica en el panel de GALEROS.NET que la transmisión haya terminado

### Paso 15: Revisar el evento
1. Revisa la lista de peleas para asegurarte que todas estén marcadas como "completed"
2. Verifica que todas las apuestas hayan sido procesadas correctamente
3. Revisa las métricas del evento para ver cuántos usuarios estuvieron viendo

## Solución de Problemas Comunes

### Problema: OBS no se conecta al streaming
- Verifica que el servidor RTMP esté activo
- Asegúrate de que escribiste correctamente la URL del servidor:
  - **Desarrollo**: `rtmp://localhost:1935/live`
  - **Producción**: `rtmp://YOUR-DOMAIN.com:1935/live`
- Verifica que la clave de streaming sea correcta

### Problema: No puedo crear peleas
- Asegúrate de que el evento esté activo (estado "in-progress")
- Verifica que hayas completado todos los campos obligatorios

### Problema: Los usuarios no pueden ver el streaming
- Verifica que el evento esté en estado "in-progress"
- Asegúrate de que hayas iniciado la transmisión en OBS Studio
- Verifica que el stream key sea correcto

### Problema: No puedo abrir apuestas
- Asegúrate de que la pelea esté en estado "upcoming" (próxima)
- Verifica que el evento esté activo

### Problema: El botón "Editar" no funciona
- *Nota: Este problema ha sido resuelto en la última actualización. El botón "Editar" en el modal de gestión de eventos ahora funciona correctamente y permite editar el nombre, fecha y operador del evento.*

## Iniciar el Servidor de Streaming (Para administradores)

Antes de comenzar cualquier evento de streaming, el servidor RTMP debe estar corriendo. Esta tarea normalmente la realiza el administrador del sistema.

### Para administradores:

1. Abre una terminal en el servidor
2. Navega al directorio raíz del proyecto GALEROS.NET
3. Ejecuta el siguiente comando:
   ```
   node rtmp-server.js
   ```
4. Verifica que veas mensajes como:
   - "🚀 Starting GALEROS.NET RTMP Server..."
   - "📡 RTMP: rtmp://localhost:1935/live"
   - "🌐 HTTP: http://localhost:8000"
5. El servidor debe mantenerse corriendo durante todo el evento

### Nota importante:
- Si estás probando localmente, asegúrate de que el servidor esté corriendo en la misma máquina
- El puerto 1935 (RTMP) y 8000 (HTTP) deben estar disponibles
- Necesitas tener `node-media-server` instalado como dependencia

## Panel de Administración de Streaming

La página `/admin/streaming` es una herramienta de monitoreo y control general del sistema de streaming. Esta página se utiliza para:

1. **Monitoreo global**: Ver el estado de todos los streams activos
2. **Control general**: Iniciar o detener streams independientemente de los eventos
3. **Métricas de rendimiento**: Ver cantidad de espectadores en tiempo real
4. **Diagnóstico**: Verificar que el servidor RTMP está funcionando correctamente

### Cómo acceder:
1. Inicia sesión en tu cuenta de administrador u operador
2. Haz clic en "Streaming" en el menú lateral izquierdo
3. Aquí podrás ver el panel de control de streaming

### Nota: 
La mayoría de las operaciones de streaming se realizan directamente desde la página de cada evento, pero esta página proporciona una visión general del sistema para administradores y operadores.

## Gestión de Pausas de Transmisión (Intermedios)

Durante un evento de peleas de gallos, es común tener periodos de intermedio entre peleas o por razones técnicas. Estas pausas deben manejarse correctamente para brindar una experiencia profesional a los espectadores.

### Cómo Manejar Pausas de Transmisión

**⚠️ IMPORTANTE**: Las pausas de transmisión se manejan EN OBS, NO en la plataforma web.

1. **Durante el intermedio**:
   - NO detengas la transmisión en OBS Studio
   - Cambia a una escena "Intermedio" o "Pausa" con contenido informativo
   - El stream sigue activo (RTMP sigue conectado)
   - Los usuarios continúan conectados al canal

2. **No cambiar estados de peleas**:
   - NO cambies el estado de las peleas durante la pausa
   - Mantén el estado actual de la pelea en "completed" o "upcoming"
   - La próxima pelea se mantendrá en "upcoming" hasta que esté lista

3. **Reanudar el evento**:
   - Al finalizar la pausa, cambia nuevamente a la escena principal
   - Asegúrate que el audio esté correctamente configurado
   - El stream continua sin interrupción para los usuarios

### Beneficios
- Los espectadores no pierden la conexión al stream
- No hay interrupciones en la experiencia de visualización
- Mantenimiento de viewers durante los descansos
- Profesionalismo en la transmisión del evento

---

## Gestión de Pausas de Transmisión (Intermedios)

Durante un evento de peleas de gallos, es común tener periodos de intermedio entre peleas o por razones técnicas. Estas pausas deben manejarse correctamente para brindar una experiencia profesional a los espectadores.

### Cómo Manejar Pausas de Transmisión

**⚠️ IMPORTANTE**: Las pausas de transmisión se manejan EN OBS, NO en la plataforma web.

1. **Durante el intermedio**:
   - NO detengas la transmisión en OBS Studio
   - Cambia a una escena "Intermedio" o "Pausa" con contenido informativo
   - El stream sigue activo (RTMP sigue conectado)
   - Los usuarios continúan conectados al canal

2. **No cambiar estados de peleas**:
   - NO cambies el estado de las peleas durante la pausa
   - Mantén el estado actual de la pelea (no cambies estados de pelea)
   - La próxima pelea se mantendrá en "upcoming" hasta que esté lista

3. **Reanudar el evento**:
   - Al finalizar la pausa, cambia nuevamente a la escena principal
   - Asegúrate que el audio esté correctamente configurado
   - El stream continua sin interrupción para los usuarios

### Beneficios
- Los espectadores no pierden la conexión al stream
- No hay interrupciones en la experiencia de visualización
- Mantenimiento de viewers durante los descansos
- Profesionalismo en la transmisión del evento

---

## Ciclo de Vida Completo de una Pelea

Una pelea de gallos sigue un ciclo de vida estructurado que se traduce en operaciones de estado específicas. El sistema implementa un modelo de máquina de estados con transiciones válidas.

### Las 4 Fases del Ciclo de Vida

**Fase 1: Abrir Ventana de Apuestas (upcoming → betting)**
- **Acción de operador**: "Abrir Apuestas"
- **API Endpoint**: `PATCH /api/fights/:id/status`
- **Payload**: `{ status: "betting" }`
- **SSE broadcast**: `event: "betting_window_opened"`
- **Dashboard changes**: Botón de apuestas se activa, temporizador de 3 minutos comienza
- **Side effects**: Usuarios pueden hacer apuestas PAGO/DOY, todas las apuestas previas para esta pelea se cancelan

**Fase 2: Iniciar Pelea (betting → live)**
- **Acción de operador**: "Iniciar Pelea"
- **API Endpoint**: `PATCH /api/fights/:id/status`
- **Payload**: `{ status: "live" }`
- **SSE broadcast**: `event: "fight_started"`
- **Dashboard changes**: Botón de apuestas se desactiva, timer se detiene
- **Side effects**: Ventana de apuestas se cierra automáticamente, todas las apuestas pendientes se cancelan, pelea comienza en vivo

**Fase 3: Registrar Resultado (durante estado 'live')**
- **Acción de operador**: "Registrar Resultado"
- **API Endpoint**: `PATCH /api/fights/:id`
- **Payload**: `{ result: "red"|"blue"|"draw", status: "live" }`
- **SSE broadcast**: `event: "fight_result_recorded"`
- **Dashboard changes**: Indicador de resultado aparece
- **Side effects**: Se registra el ganador/perdedor de la pelea, apuestas esperan a que se complete la pelea

**Fase 4: Cerrar Pelea (live → completed)**
- **Acción de operador**: "Completar Pelea"
- **API Endpoint**: `PATCH /api/fights/:id/status`
- **Payload**: `{ status: "completed" }`
- **SSE broadcast**: `event: "fight_completed"`
- **Dashboard changes**: Pelea marcada como completada, resultados visibles
- **Side effects**: Sistema liquida apuestas automáticamente, ganadores reciben pagos, perdedores pierden su apuesta

---

## Tabla de Referencia Rápida

| Acción Operador | Status Anterior | Status Nuevo | API Endpoint | SSE Event Triggered |
|-----------------|----------------|--------------|--------------|----------------------|
| Abrir Apuestas | upcoming | betting | PATCH /api/fights/:id/status | betting_window_opened |
| Iniciar Pelea | betting | live | PATCH /api/fights/:id/status | fight_started |
| Registrar Resultado | live | live | PATCH /api/fights/:id | fight_result_recorded |
| Completar Pelea | live | completed | PATCH /api/fights/:id/status | fight_completed |

---

## Errores Comunes y Soluciones

### Error 1: "Cannot transition to 'live' - invalid state"
- **Causa**: La pelea no está en estado 'betting' o ya está en estado 'live'/'completed'
- **Solución**: Verificar que la pelea esté en estado 'betting' antes de intentar iniciarla
- **Comprobación**: Asegurarse de que las apuestas hayan estado abiertas antes de iniciar la pelea

### Error 2: "Betting window closed"
- **Causa**: El usuario intenta apostar cuando la pelea no está en estado 'betting'
- **Solución**: Verificar que la pelea esté en estado 'betting' antes de aceptar apuestas
- **Comprobación**: Asegurarse de que la pelea haya sido abierta para apuestas antes de que los usuarios intenten apostar

### Error 3: "Cannot complete fight without result"
- **Causa**: Se intenta completar la pelea sin haber registrado un resultado
- **Solución**: Registrar resultado (ganador/perdedor) antes de completar pelea
- **Comprobación**: Asegurarse de que la propiedad 'result' se haya establecido antes de cambiar status a 'completed'

### Error 4: "Fight not found"
- **Causa**: El fightId en la solicitud no es válido o no existe
- **Solución**: Validar que el fightId exista y pertenezca al evento actual
- **Comprobación**: Verificar que la pelea esté asociada al evento correcto

---

## Contacto de Soporte

Si tienes problemas que no puedes resolver con este manual, puedes contactar al soporte técnico:

- En el panel de GALEROS.NET, haz clic en "Soporte"
- Describe tu problema detalladamente
- Adjunta capturas de pantalla si es posible

---

**¡Gracias por usar GALEROS.NET! Tu trabajo como operador es fundamental para el éxito de nuestros eventos.**
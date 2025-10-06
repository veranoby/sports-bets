# Manual de Streaming para Operadores - GalloBets

## Introducción

Este manual te guiará paso a paso sobre cómo llevar a cabo un evento de streaming de peleas de gallos desde el principio hasta el final. Sigue estas instrucciones detalladamente para asegurar que el evento se realice sin problemas.

## Requisitos Previos

- Computadora con acceso a internet
- Cuenta de operador activa en GalloBets
- OBS Studio instalado (puedes descargarlo desde https://obsproject.com/)
- Sistema de captura de video de buena calidad
- Conexión a internet estable con al menos 5 Mbps de subida
- Servidor de streaming RTMP corriendo (ver instrucciones adicionales más abajo)

## Parte 1: Preparación del Evento (Día anterior o el mismo día)

### Paso 1: Iniciar sesión en GalloBets
1. Abre tu navegador web favorito
2. Ve a la página de GalloBets
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
5. En "Server", escribe: `rtmp://localhost:1935/live`
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
1. En el panel de GalloBets, ve a la lista de eventos
2. Encuentra tu evento y haz clic en "Editar"
3. Cambia el estado de "scheduled" a "in-progress" (en progreso)
4. Haz clic en "Guardar"

### Paso 8: Iniciar la transmisión
1. En OBS Studio, haz clic en "Start Streaming" (Iniciar transmisión)
2. Espera a que aparezca el mensaje "✅ Live" en la parte inferior
3. Verifica en el panel de GalloBets que el streaming esté activo

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
2. Verifica en el panel de GalloBets que la transmisión haya terminado

### Paso 15: Revisar el evento
1. Revisa la lista de peleas para asegurarte que todas estén marcadas como "completed"
2. Verifica que todas las apuestas hayan sido procesadas correctamente
3. Revisa las métricas del evento para ver cuántos usuarios estuvieron viendo

## Solución de Problemas Comunes

### Problema: OBS no se conecta al streaming
- Verifica que el servidor RTMP esté activo
- Asegúrate de que escribiste correctamente la URL: `rtmp://localhost:1935/live`
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

## Iniciar el Servidor de Streaming (Para administradores)

Antes de comenzar cualquier evento de streaming, el servidor RTMP debe estar corriendo. Esta tarea normalmente la realiza el administrador del sistema.

### Para administradores:

1. Abre una terminal en el servidor
2. Navega al directorio raíz del proyecto GalloBets
3. Ejecuta el siguiente comando:
   ```
   node rtmp-server.js
   ```
4. Verifica que veas mensajes como:
   - "🚀 Starting GalloBets RTMP Server..."
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

## Contacto de Soporte

Si tienes problemas que no puedes resolver con este manual, puedes contactar al soporte técnico:

- En el panel de GalloBets, haz clic en "Soporte"
- Describe tu problema detalladamente
- Adjunta capturas de pantalla si es posible

---

**¡Gracias por usar GalloBets! Tu trabajo como operador es fundamental para el éxito de nuestros eventos.**
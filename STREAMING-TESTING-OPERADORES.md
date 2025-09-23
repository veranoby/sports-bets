# 📺 GUÍA DE PRUEBA DE STREAMING - GALLOBETS
## Para Operadores y Personal No Técnico

---

## 🎯 OBJETIVO
Probar el sistema de transmisión en vivo de GalloBets en tu computadora local, simulando un evento real de gallera con peleas y transmisión.

---

## ✅ REQUISITOS PREVIOS

### **Lo que necesitas tener instalado:**
1. **OBS Studio** - Software gratuito de transmisión
   - Descargar de: https://obsproject.com/
   - Seleccionar versión para tu sistema (Windows/Mac/Linux)

2. **Navegador web moderno**
   - Chrome, Firefox o Edge actualizado

3. **Sistema GalloBets funcionando**
   - El equipo técnico debe confirmar que está activo
   - Debes tener usuario con rol Admin u Operador

---

## 📝 PASO 1: VERIFICAR QUE EL SISTEMA ESTÁ ACTIVO

### **1.1 Confirmar con el equipo técnico:**
Antes de empezar, pregunta al desarrollador:
- "¿Está el backend corriendo en puerto 3001?"
- "¿Está el frontend corriendo en puerto 5174?"
- "¿Está el servidor RTMP activo?"

### **1.2 Acceder al sistema:**
1. Abre tu navegador
2. Ve a: `http://localhost:5174`
3. Inicia sesión con tu usuario Admin u Operador

---

## 🎥 PASO 2: CONFIGURAR OBS STUDIO

### **2.1 Abrir OBS Studio**
1. Abre el programa OBS Studio
2. Si es primera vez, aparecerá un asistente - puedes cancelarlo

### **2.2 Configurar la transmisión:**

#### **Haz clic en "Ajustes" (Settings)**

1. **Ve a la sección "Emisión" (Stream):**
   - Servicio: Selecciona **"Personalizado..."** (Custom)
   - Servidor: Escribe exactamente: `rtmp://localhost:1935/live`
   - Clave de emisión: Escribe: `test_stream_001`

2. **Ve a la sección "Vídeo":**
   - Resolución base: **1920x1080**
   - Resolución de salida: **1280x720**
   - FPS: **30**

3. **Ve a la sección "Salida" (Output):**
   - Modo: **Simple**
   - Tasa de bits de vídeo: **2500**
   - Codificador: **Software (x264)**

4. **Haz clic en "Aplicar" y luego "Aceptar"**

### **2.3 Agregar fuente de video:**

En la ventana principal de OBS:

1. **En el panel "Fuentes" (Sources), haz clic en el botón "+"**

2. **Selecciona una opción:**
   - **"Captura de pantalla"** - Para mostrar tu pantalla
   - **"Dispositivo de captura de vídeo"** - Para usar tu cámara web
   - **"Fuente multimedia"** - Para transmitir un video pregrabado

3. **Dale un nombre y haz clic en "Aceptar"**

4. **Configura según tu elección y haz clic en "Aceptar"**

---

## 🏁 PASO 3: CREAR UN EVENTO DE PRUEBA

### **3.1 Acceder al panel de administración:**
1. En el navegador, ve a: `http://localhost:5174/admin`
2. En el menú lateral, haz clic en **"Eventos"**

### **3.2 Crear nuevo evento:**
1. Haz clic en el botón **"+ Crear Evento"**
2. Llena los campos:
   - **Nombre**: "Evento de Prueba Streaming"
   - **Fecha**: Selecciona hoy
   - **Hora**: Selecciona la hora actual
   - **Lugar**: Selecciona cualquier gallera disponible
   - **Descripción**: "Prueba del sistema de transmisión"
3. Haz clic en **"Guardar"**

### **3.3 Agregar peleas al evento:**
1. En la lista de eventos, encuentra tu "Evento de Prueba"
2. Haz clic en **"Gestionar"**
3. Ve a la pestaña **"Peleas"**
4. Haz clic en **"+ Agregar Pelea"**
5. Crea al menos 3 peleas de prueba:
   - **Pelea 1**: "Gallo Rojo" vs "Gallo Azul"
   - **Pelea 2**: "Tornado" vs "Relámpago"
   - **Pelea 3**: "Furia" vs "Martillo"

---

## 📡 PASO 4: INICIAR LA TRANSMISIÓN

### **4.1 Activar el evento:**
1. En la gestión del evento, cambia el estado a **"En Progreso"**
2. El sistema generará automáticamente una clave de transmisión
3. **COPIA ESTA CLAVE** (ejemplo: `evento_prueba_2024_001`)

### **4.2 Actualizar OBS con la clave correcta:**
1. En OBS, ve a **Ajustes → Emisión**
2. Cambia la "Clave de emisión" por la que copiaste
3. Haz clic en **"Aplicar"** y **"Aceptar"**

### **4.3 Comenzar a transmitir:**
1. En OBS, haz clic en el botón **"Iniciar transmisión"**
2. Deberías ver "EN VIVO" en la parte inferior de OBS

---

## 👁️ PASO 5: VER LA TRANSMISIÓN

### **5.1 Abrir la página de prueba:**
1. En tu navegador, abre una nueva pestaña
2. Ve a: `http://localhost:5174/streaming-test`

### **5.2 Verificar la transmisión:**
1. En el campo "Stream Key", ingresa la clave que usaste
2. El video debería aparecer en 10-15 segundos
3. Verifica que se ve y escucha correctamente

---

## 🎮 PASO 6: GESTIONAR LAS PELEAS

### **6.1 Workflow de cada pelea:**

Para cada pelea, sigue estos pasos:

#### **A. Abrir apuestas (2 minutos):**
1. En gestión del evento, selecciona la pelea
2. Cambia estado a **"Aceptando Apuestas"**
3. Espera 2 minutos para que "usuarios hagan apuestas"

#### **B. Iniciar pelea (5 minutos):**
1. Cambia estado a **"En Vivo"**
2. La transmisión muestra la "pelea en curso"
3. Mantén por 5 minutos aproximadamente

#### **C. Finalizar pelea:**
1. Cambia estado a **"Finalizada"**
2. Selecciona el ganador (Rojo, Azul o Empate)
3. Prepara la siguiente pelea

### **6.2 Repetir para todas las peleas:**
- Completa las 3 peleas siguiendo el mismo proceso
- Entre peleas, mantén la transmisión activa
- Puedes hablar o mostrar contenido entre peleas

---

## ✅ PASO 7: FINALIZAR EL EVENTO

### **7.1 Completar el evento:**
1. Cuando todas las peleas estén finalizadas
2. En gestión del evento, cambia estado a **"Completado"**

### **7.2 Detener la transmisión:**
1. En OBS, haz clic en **"Detener transmisión"**
2. Cierra OBS Studio

### **7.3 Verificar resultados:**
1. En el panel de admin, revisa que:
   - El evento está marcado como completado
   - Todas las peleas tienen resultados
   - No hay errores en el sistema

---

## ❓ PROBLEMAS COMUNES Y SOLUCIONES

### **No aparece el video:**
- Verifica que OBS esté transmitiendo (debe decir "EN VIVO")
- Confirma que la clave de transmisión es correcta
- Espera 15-20 segundos para que cargue
- Recarga la página del navegador

### **OBS no puede conectar:**
- Verifica que escribiste bien el servidor: `rtmp://localhost:1935/live`
- Confirma con el equipo técnico que el servidor RTMP está activo
- Reinicia OBS y vuelve a intentar

### **El video se corta o congela:**
- Reduce la calidad en OBS (baja a 1500 en lugar de 2500)
- Cierra otros programas que uses mucha memoria
- Verifica tu conexión a internet

### **No se escucha audio:**
- En OBS, verifica que las barras de audio se muevan
- Revisa que tu micrófono esté seleccionado en "Fuentes de audio"
- Sube el volumen en el mezclador de audio de OBS

---

## 📊 VERIFICACIÓN FINAL

### **Lista de verificación - Todo funcionó si:**
- ✅ Creaste un evento con 3 peleas
- ✅ OBS transmitió durante todo el evento
- ✅ El video se vio en la página de prueba
- ✅ Cambiaste los estados de las peleas correctamente
- ✅ El evento se completó sin errores

### **Métricas de éxito:**
- **Duración total**: 20-30 minutos
- **Calidad de video**: Clara y sin cortes
- **Audio**: Claro y sincronizado
- **Gestión**: Fluida y sin complicaciones

---

## 📞 NECESITAS AYUDA?

### **Contacta al equipo técnico si:**
- El sistema no está activo
- OBS no puede conectar
- Aparecen errores en el navegador
- No puedes crear eventos o peleas

### **Información útil para reportar problemas:**
- ¿En qué paso estás?
- ¿Qué mensaje de error ves?
- ¿Qué intentaste hacer?
- Captura de pantalla del problema

---

## 🎉 ¡FELICIDADES!

Si completaste todos los pasos, has probado exitosamente:
- ✅ El sistema de transmisión en vivo
- ✅ La gestión de eventos y peleas
- ✅ El workflow completo de un operador
- ✅ La integración con OBS Studio

**¡El sistema está listo para transmitir eventos reales!**

---

**Tiempo estimado**: 45-60 minutos
**Dificultad**: Media
**Soporte**: Equipo técnico disponible
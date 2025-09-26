# 📺 GUÍA RÁPIDA DE PRUEBA DE STREAMING - GALLOBETS
## Para Operadores y Personal No Técnico

---

## 🎯 OBJETIVO
Esta guía te ayudará a probar el sistema de transmisión en vivo de GalloBets. Simularás un evento real de peleas de gallos usando tu computadora.

---

## ✅ ANTES DE EMPEZAR (REQUISITOS)

### **Necesitas tener instalado:**
1. **OBS Studio** - Es un programa gratis para transmitir videos en vivo.
   - Descárgalo de: https://obsproject.com/
   - Elige la versión para tu computadora (Windows, Mac o Linux).

2. **Un navegador de internet moderno**
   - Como Chrome, Firefox o Edge (asegúrate de que esté actualizado).

3. **El sistema GalloBets funcionando**
   - El equipo técnico debe confirmar que el sistema está encendido y listo.
   - Debes tener una cuenta de usuario con permisos de Administrador u Operador.

---

## 📝 PASO 1: VERIFICAR QUE EL SISTEMA ESTÁ LISTO

### **1.1 Pregunta al equipo técnico:**
Antes de empezar, confirma con el desarrollador:
- "¿El sistema principal (backend) está funcionando en el puerto 3001?"
- "¿La parte visual (frontend) está funcionando en el puerto 5173?"
- "¿El servidor de video (RTMP) está activo?"

### **1.2 Entra al sistema:**
1. Abre tu navegador de internet.
2. Ve a esta dirección: `http://localhost:5173`
3. Inicia sesión con tu usuario de Administrador u Operador.

---

## 🎥 PASO 2: PREPARAR OBS STUDIO (PROGRAMA DE TRANSMISIÓN)

### **2.1 Abre OBS Studio**
1. Inicia el programa OBS Studio.
2. Si es la primera vez que lo abres, puede que aparezca un asistente. Puedes cerrarlo.

### **2.2 Configura la transmisión en OBS:**

#### **Haz clic en "Ajustes" (Settings) en OBS.**

1. **Ve a la sección "Emisión" (Stream):**
   - En "Servicio": Elige **"Personalizado..."** (Custom).
   - En "Servidor": Escribe exactamente: `rtmp://localhost:1935/live`
   - En "Clave de emisión": Escribe: `test_stream_001` (Esta clave la cambiarás después).

2. **Ve a la sección "Vídeo":**
   - "Resolución base": **1920x1080**
   - "Resolución de salida": **1280x720**
   - "FPS" (cuadros por segundo): **30**

3. **Ve a la sección "Salida" (Output):**
   - "Modo de Salida": **Simple**
   - "Tasa de bits de vídeo": **2500**
   - "Codificador": **Software (x264)**

4. **Haz clic en "Aplicar" y luego en "Aceptar".**

### **2.3 Agrega lo que quieres transmitir (fuente de video):**

En la ventana principal de OBS:

1. **En el cuadro "Fuentes" (Sources), haz clic en el botón "+".**

2. **Elige una opción:**
   - **"Captura de pantalla"**: Para mostrar lo que ves en tu monitor.
   - **"Dispositivo de captura de vídeo"**: Para usar tu cámara web.
   - **"Fuente multimedia"**: Para transmitir un video que ya tengas guardado.

3. **Ponle un nombre a la fuente y haz clic en "Aceptar".**

4. **Configura la fuente según lo que elegiste y haz clic en "Aceptar".**

---

## 🏁 PASO 3: CREAR UN EVENTO DE PRUEBA EN EL SISTEMA

### **3.1 Entra al panel de administración:**
1. En tu navegador, ve a: `http://localhost:5173/admin`
2. En el menú de la izquierda, haz clic en **"Eventos"**.

### **3.2 Crea un evento nuevo:**
1. Haz clic en el botón **"+ Crear Evento"**.
2. Rellena los datos:
   - **Nombre**: "Evento de Prueba Streaming"
   - **Fecha**: Elige la fecha de hoy.
   - **Hora**: Elige la hora actual.
   - **Lugar**: Selecciona cualquier gallera de la lista.
   - **Descripción**: "Prueba del sistema de transmisión en vivo."
3. Haz clic en **"Guardar"**.

### **3.3 Agrega peleas a tu evento:**
1. Busca tu "Evento de Prueba Streaming" en la lista.
2. Haz clic en **"Gestionar"**.
3. Ve a la pestaña **"Peleas"**.
4. Haz clic en **"+ Agregar Pelea"**.
5. Crea al menos 3 peleas de prueba con nombres como:
   - **Pelea 1**: "Gallo Rojo" vs "Gallo Azul"
   - **Pelea 2**: "Tornado" vs "Relámpago"
   - **Pelea 3**: "Furia" vs "Martillo"

---

## 📡 PASO 4: EMPEZAR A TRANSMITIR EN VIVO

### **4.1 Activa el evento en el sistema:**
1. En la pantalla de gestión del evento, cambia el estado a **"En Progreso"**.
2. El sistema te dará una CLAVE DE TRANSMISIÓN única para este evento.
3. **COPIA ESTA CLAVE** (por ejemplo: `evento_prueba_2024_001`).

### **4.2 Actualiza OBS con la clave correcta:**
1. En OBS, ve a **Ajustes → Emisión**.
2. Cambia la "Clave de emisión" por la que acabas de copiar del sistema.
3. Haz clic en **"Aplicar"** y luego en **"Aceptar"**.

### **4.3 Inicia la transmisión desde OBS:**
1. En OBS, haz clic en el botón **"Iniciar transmisión"**.
2. Abajo en OBS, deberías ver que dice "EN VIVO".

---

## 👁️ PASO 5: VER LA TRANSMISIÓN EN EL NAVEGADOR

### **5.1 Abre la página de prueba:**
1. En tu navegador, abre una nueva pestaña.
2. Ve a: `http://localhost:5173/streaming-test`

### **5.2 Confirma que ves la transmisión:**
1. En el campo "Stream Key", escribe la clave que estás usando para transmitir.
2. El video debería aparecer en unos 10 a 15 segundos.
3. Verifica que la imagen y el sonido se ven y escuchan bien.

---

## 🎮 PASO 6: GESTIONAR LAS PELEAS EN VIVO

### **6.1 Sigue estos pasos para cada pelea:**

#### **A. Abrir apuestas (espera 2 minutos):**
1. En la gestión del evento, selecciona la pelea actual.
2. Cambia su estado a **"Aceptando Apuestas"**.
3. Espera unos 2 minutos para simular que los usuarios hacen sus apuestas.

#### **B. Iniciar pelea (espera 5 minutos):**
1. Cambia el estado de la pelea a **"En Vivo"**.
2. La transmisión debe mostrar la "pelea en curso".
3. Mantén este estado por unos 5 minutos.

#### **C. Finalizar pelea:**
1. Cambia el estado de la pelea a **"Finalizada"**.
2. Elige al ganador (Gallo Rojo, Gallo Azul o Empate).
3. Prepara la siguiente pelea.

### **6.2 Repite para todas las peleas:**
- Haz lo mismo para las 3 peleas de tu evento.
- Mantén la transmisión activa entre cada pelea.
- Puedes hablar o mostrar algo diferente en OBS mientras esperas.

---

## ✅ PASO 7: TERMINAR EL EVENTO

### **7.1 Completa el evento en el sistema:**
1. Cuando todas las peleas hayan terminado.
2. En la gestión del evento, cambia el estado general a **"Completado"**.

### **7.2 Detén la transmisión:**
1. En OBS, haz clic en **"Detener transmisión"**.
2. Cierra el programa OBS Studio.

### **7.3 Revisa los resultados:**
1. En el panel de administración, verifica que:
   - El evento aparece como "Completado".
   - Todas las peleas tienen un resultado.
   - No hay errores visibles en el sistema.

---

## ❓ PROBLEMAS COMUNES Y CÓMO SOLUCIONARLOS

### **No veo el video en el navegador:**
- Asegúrate de que OBS esté transmitiendo (debe decir "EN VIVO" abajo).
- Confirma que la clave de transmisión que pusiste en el navegador es la misma que en OBS.
- Espera unos 15-20 segundos para que el video cargue.
- Intenta recargar la página del navegador.

### **OBS no puede conectar al servidor:**
- Revisa que escribiste bien la dirección del servidor en OBS: `rtmp://localhost:1935/live`.
- Pregunta al equipo técnico si el servidor de video (RTMP) está activo.
- Cierra OBS y ábrelo de nuevo, luego intenta transmitir.

### **El video se corta o se congela:**
- En OBS, baja la calidad de video (por ejemplo, cambia 2500 a 1500 en "Tasa de bits de vídeo").
- Cierra otros programas que estén usando mucha memoria en tu computadora.
- Revisa que tu conexión a internet esté funcionando bien.

### **No escucho el audio:**
- En OBS, fíjate si las barras de audio se mueven (indica que hay sonido).
- Revisa que tu micrófono o fuente de audio esté bien seleccionada en el panel "Fuentes".
- Sube el volumen en el mezclador de audio de OBS.

---

## ✅ LISTA DE VERIFICACIÓN PARA OPERADORES

### **Confirma que cada punto se cumple para un test exitoso:**

- [ ] **Acceso al Sistema:** Pudiste iniciar sesión en `http://localhost:5173` con tu usuario Admin u Operador.
- [ ] **Configuración OBS:** Configuraste OBS Studio con el servidor `rtmp://localhost:1935/live` y la clave de emisión correcta.
- [ ] **Creación de Evento:** Creaste un evento de prueba con al menos 3 peleas.
- [ ] **Inicio de Transmisión:** Iniciaste la transmisión desde OBS Studio y viste el indicador "EN VIVO".
- [ ] **Visualización del Stream:** Pudiste ver el video en vivo en `http://localhost:5173/streaming-test` (o en el panel de administración si ya está integrado).
- [ ] **Gestión de Peleas:** Cambiaste los estados de las peleas (abrir apuestas, en vivo, finalizada) y se reflejaron correctamente.
- [ ] **Finalización del Evento:** Completaste el evento y detuviste la transmisión.
- [ ] **Calidad del Stream:** El video y audio del stream fueron claros y sin interrupciones.
- [ ] **No Errores:** No encontraste errores críticos en el navegador o en el sistema.

### **Si todo lo anterior es ✅, ¡felicidades! El sistema de streaming está funcionando correctamente.**

---

## 📞 ¿NECESITAS AYUDA?

### **Contacta al equipo técnico si:**
- El sistema no se enciende o no funciona.
- OBS no puede conectar al servidor de transmisión.
- Ves mensajes de error en el navegador.
- No puedes crear eventos o peleas.

### **Para reportar un problema, incluye esta información:**
- ¿En qué paso de la guía estás?
- ¿Qué mensaje de error exacto ves?
- ¿Qué intentaste hacer antes de que fallara?
- Si puedes, envía una captura de pantalla del problema.

---

## 🎉 ¡FELICIDADES!

Si seguiste todos los pasos, has probado con éxito:
- ✅ El sistema de transmisión de video en vivo.
- ✅ La gestión de eventos y peleas.
- ✅ El proceso completo de un operador.
- ✅ La conexión con OBS Studio.

**¡El sistema está listo para transmitir eventos reales!**

---

**Tiempo estimado de la prueba**: 45-60 minutos
**Dificultad**: Media
**Soporte**: El equipo técnico está disponible para ayudarte.

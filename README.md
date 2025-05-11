# Sports Bets

Plataforma de transmisión en vivo y apuestas peer-to-peer para eventos deportivos, especializada inicialmente en peleas de gallos.

## Estructura del Proyecto

- `/frontend` - Aplicación React para usuarios apostadores y visualización de eventos
- `/backend` - API REST Node.js/Express y lógica de negocio
- `/shared` - Código compartido entre frontend y backend
- `/infrastructure` - Configuración de Nginx-RTMP y scripts de despliegue
- `/docs` - Documentación del proyecto

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- MongoDB 6+ (opcional para fases posteriores)
- OBS Studio (para pruebas de transmisión)

## Configuración de Desarrollo

1. Clonar el repositorio
git clone https://github.com/veranoby/sports-bets.git
cd sports-bets

2. Instalar dependencias
cd frontend && npm install
cd ../backend && npm install

3. Configurar variables de entorno
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

4. Iniciar servicios en modo desarrollo
Terminal 1 - Frontend
cd frontend && npm run dev
Terminal 2 - Backend
cd backend && npm run dev

## Licencia

Privada - Todos los derechos reservados
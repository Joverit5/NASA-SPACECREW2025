# 🚀 SPACECREW2025 – Multiplayer Survival Habitat Game  

![Tonoteam Banner](https://via.placeholder.com/1200x400.png?text=Tonoteam+Game+Banner)

[![GitHub license](https://img.shields.io/github/license/Joverit5/NASA-SPACECREW2025)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Joverit5/NASA-SPACECREW2025/ci.yml?branch=main)](https://github.com/Joverit5/NASA-SPACECREW2025/actions)
[![GitHub issues](https://img.shields.io/github/issues/Joverit5/NASA-SPACECREW2025)](https://github.com/Joverit5/NASA-SPACECREW2025/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/Joverit5/NASA-SPACECREW2025)](https://github.com/Joverit5/NASA-SPACECREW2025/pulls)
[![Contributors](https://img.shields.io/github/contributors/Joverit5/NASA-SPACECREW2025)](https://github.com/Joverit5/NASA-SPACECREW2025/graphs/contributors)
[![Stars](https://img.shields.io/github/stars/Joverit5/NASA-SPACECREW2025?style=social)](https://github.com/Joverit5/NASA-SPACECREW2025/stargazers)

## 🌌 Descripción  
**SPACECREW2025** es un juego multijugador online en el que hasta **5 tripulantes** cooperan para sobrevivir dentro de un hábitat espacial.  
El equipo debe **gestionar recursos, asignar roles y comunicarse** eficazmente para superar niveles progresivamente más difíciles.  
Cada nivel otorga **monedas** que permiten mejorar las instalaciones (granjas, minas, talleres de rovers) y ampliar el hábitat con nuevas funcionalidades.

## 🧩 Características Clave (MVP)  
- **Cooperativo en tiempo real:** Hasta 5 jugadores por sesión.  
- **Gestión de recursos:** Construir y mejorar áreas del hábitat.  
- **Eventos aleatorios:** Cada partida es distinta.  
- **Moneda interna:** Subir de categoría espacios y expandir el hábitat.  

## 🎯 Objetivo del MVP  
Desarrollar un prototipo funcional que permita:  
- Crear/entrar en una sala de juego.  
- Asignar roles básicos a cada tripulante.  
- Interactuar con recursos del hábitat (ejemplo: recolectar o reparar).  
- Sincronizar acciones en tiempo real entre jugadores.

## 🛠️ Stack Tecnológico Sugerido  
| Capa | Tecnología |
|------|-------------|
| **Frontend** | [Next.js](https://nextjs.org/) + [React](https://reactjs.org/) + [Tailwind CSS](https://tailwindcss.com/) |
| **Backend** | [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) + [Socket.IO](https://socket.io/) |
| **Base de Datos** | [PostgreSQL](https://www.postgresql.org/) o [Redis](https://redis.io/) (para estado en tiempo real) |
| **Autenticación** | [NextAuth.js](https://next-auth.js.org/) |
| **Despliegue** | [Vercel](https://vercel.com/) (Frontend) + [Render](https://render.com/) / [Railway](https://railway.app/) (Backend) |

## 📂 Estructura del Proyecto  
```bash
spacecrew/
├─ frontend/          # App web Next.js
│  ├─ components/
│  ├─ pages/
│  └─ styles/
├─ backend/           # API y WebSocket server
│  ├─ src/
│  ├─ routes/
│  └─ sockets/
└─ README.md
```
🚀 Instalación y Uso (MVP)

Clona el proyecto y ejecuta cada parte:

# Clonar repositorio
git clone https://github.com/tuusuario/tonoteam.git
cd tonoteam

# Instalar frontend
cd frontend
npm install
npm run dev

# En otra terminal instalar backend
cd ../backend
npm install
npm run dev


Por defecto:

Frontend: http://localhost:3000

Backend: http://localhost:4000

🤝 Contribución

¡Queremos crecer el proyecto!

Si tienes experiencia en desarrollo de juegos web, UI/UX, backend escalable o diseño de niveles, eres bienvenido/a.

Abre un issue o envía un pull request.

+ Buscamos colaboradores con:
+ - Experiencia en websockets/multijugador
+ - Diseño de sistemas de juego y balanceo
+ - Artistas UI/UX (ilustraciones, sprites)

📜 Licencia

Este proyecto se distribuye bajo la licencia MIT.

<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>
<!--

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]


<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Joverit5/NASA-SPATIUM">
    <img src="images/astronomy.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">SPATIUM</h3>

  <p align="center">
    A multiplayer real-time strategy game where players cooperate to manage resources, overcome random events, and build a thriving space colony. Players can create or join game rooms, interact with resources, and experience real-time synchronization of game events.
    <br />
    <a href="https://github.com/Joverit5/NASA-SPATIUM.git"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://spatium-ruby.vercel.app/">View Demo</a>  
    ·
   <a href="https://github.com/Joverit5/NASA-SPATIUM/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
   <a href="https://github.com/Joverit5/NASA-SPATIUM/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>

  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
        <li><a href="#key-features">Key Features</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

![Product Name Screen Shot][product-screenshot]

SPATIUM is a multiplayer real-time strategy game where players cooperate to manage resources, overcome random events, and build a thriving space colony. The game features an in-game currency system and aims to provide a challenging and engaging cooperative experience.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![Tailwind CSS][Tailwind]][Tailwind-url]
* [![Radix UI][Radix]][Radix-url]
* [![Node.js][Node.js]][Node-url]
* [![Express][Express.js]][Express-url]
* [![Socket.io][Socket.io]][Socket-url]
* [![PostgreSQL][PostgreSQL]][PostgreSQL-url]
* [![Redis][Redis]][Redis-url]

<!-- Project Presentation -->
## Project Presentation

* [![YouTube][youtube-shield]][youtube-url]
  
<!-- KEY FEATURES -->
## Key Features

- **Multiplayer Cooperation:** Collaborate with other players to achieve common goals.
- **Resource Management:** Strategically manage resources to expand your colony.
- **Random Events:** Adapt to unexpected challenges and opportunities.
- **In-Game Currency:** Earn and spend currency to enhance your colony.
- **Real-Time Synchronization:** Experience seamless, real-time updates of game events.
- **Dynamic Game Rooms:** Create and join game rooms with ease.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Prerequisites

* Node.js (v18 or higher)
* npm (or yarn/pnpm)
* PostgreSQL (Installation and setup)
* Redis (Installation and setup)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd SPATIUM
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. Start the backend server:
   ```bash
   cd backend
   npm run dev
   cd ..
   ```

5. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

After starting the development server, open your browser and navigate to `http://localhost:3000`. From there, you can:

- Create a new game session or join an existing one from the lobby.
- Enter your player name and the session code (if joining).
- Collaborate with other players to manage resources and overcome challenges.
- Adapt to random events that affect your colony.
- Use the in-game currency system to enhance your colony.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- PROJECT STRUCTURE -->
## Project Structure

```
SPATIUM/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       └── ...
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── public/
│   │   └── ...
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── pages/
│   │   │   │   ├── lobby/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── room/[id]/
│   │   │   │       └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── button.tsx
│   │   │   │   └── ...
│   │   ├── lib/
│   │   │   └── types.ts
│   │   └── globals.css
├── README.md
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- CONTRIBUTING -->
## Contributing

**Contributions are welcome!** Please feel free to submit a Pull Request.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors:

<a href="https://github.com/Joverit5/NASA-SPATIUM/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Joverit5/NASA-SPATIUM" alt="contrib.rocks image" />
</a>



<!-- LICENSE -->
## License

This project is licensed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

- José Gonzalez - joseortiz@utb.edu.co
- Fabian Quintero - parejaf@utb.edu.co
- Santiago Quintero - squintero@utb.edu.co
- Eduardo Negrin - enegrin@utb.edu.co
- Isabella Arrieta - arrietai@utb.edu.co

Project Link: [https://spatium-ruby.vercel.app/](https://spatium-ruby.vercel.app/)

Youtube Link: [https://www.youtube.com/watch?v=mjrdVayyf58](https://www.youtube.com/watch?v=mjrdVayyf58)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

We would like to express our gratitude to:

* **NASA Space Apps Challenge 2025** - For providing the platform and inspiration to create this project.
* **Semillero de Astronomía y Ciencia de Datos de la UTB** - For their continuous support and encouragement in our astronomical and data science endeavors.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/Joverit5/NASA-SPATIUM.svg?style=for-the-badge
[contributors-url]: https://github.com/Joverit5/NASA-SPATIUM/graphs/contributors

[forks-shield]: https://img.shields.io/github/forks/Joverit5/NASA-SPATIUM.svg?style=for-the-badge
[forks-url]: https://github.com/Joverit5/NASA-SPATIUM/network/members

[stars-shield]: https://img.shields.io/github/stars/Joverit5/NASA-SPATIUM.svg?style=for-the-badge
[stars-url]: https://github.com/Joverit5/NASA-SPATIUM/stargazers

[issues-shield]: https://img.shields.io/github/issues/Joverit5/NASA-SPATIUM.svg?style=for-the-badge
[issues-url]: https://github.com/Joverit5/NASA-SPATIUM/issues

[license-shield]: https://img.shields.io/github/license/Joverit5/NASA-SPATIUM.svg?style=for-the-badge
[license-url]: https://github.com/Joverit5/NASA-SPATIUM//blob/master/LICENSE.txt

[product-screenshot]: images/screenshot.png

[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/

[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/

[TypeScript]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/

[Tailwind]: https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/

[Radix]: https://img.shields.io/badge/Radix%20UI-161618?style=for-the-badge&logo=radix-ui&logoColor=white
[Radix-url]: https://www.radix-ui.com/

[Node.js]: https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/

[Express.js]: https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/

[Socket.io]: https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white
[Socket-url]: https://socket.io/

[PostgreSQL]: https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/

[Redis]: https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white
[Redis-url]: https://redis.io/

[youtube-shield]: https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube
[youtube-url]: https://youtu.be/4QGIdWIk018

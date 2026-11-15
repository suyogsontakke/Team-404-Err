<div align="center">
  <img src="https://i.postimg.cc/gjFbvw2F/image.png" alt="EARTH TRACE Logo" width="440" />
  <h1>EARTH TRACE — Space-Tech Earth Intelligence Platform</h1>
  <p>
    <strong>NASA Space Apps Challenge 2026 · Team 404 Err</strong>
  </p>
  <p>
    <em>Challenge: "Be An Earth System Trend Detective" & Resilience Module: "The 72-Hour Blindspot"</em>
  </p>
  
  <!-- GitHub badges -->
  <p>
    <a href="https://github.com/suyogsontakke/earth-trace/releases"><img src="https://img.shields.io/github/v/release/suyogsontakke/earth-trace?label=Release&style=flat-square" alt="Latest release"/></a>
    <a href="https://github.com/suyogsontakke/earth-trace/stargazers"><img src="https://img.shields.io/github/stars/suyogsontakke/earth-trace?style=flat-square" alt="Stars"/></a>
    <a href="https://github.com/suyogsontakke/earth-trace/blob/main/LICENSE"><img src="https://img.shields.io/github/license/suyogsontakke/earth-trace?style=flat-square&color=blue" alt="License"/></a>
    <img src="https://img.shields.io/badge/NASA_Space_Apps-2026-brightgreen.svg?style=flat-square" alt="NASA Space Apps 2026"/>
    <img src="https://img.shields.io/badge/Stack-React_%7C_Vite_%7C_TypeScript_%7C_Three.js-blueviolet?style=flat-square" alt="Tech Stack"/>
  </p>
  
  <strong>Live Demo: <a href="https://earth-trace-nsa.vercel.app/">EARTH TRACE LIVE</a></strong> · 
  <strong>Android APK: <a href="android/EarthTrace.apk">Download APK</a></strong>
</div>

---

## 📱 Live Demo & Screenshots

* **Live Platform URL**: [EARTH TRACE Live Deployment](https://earth-trace-nsa.vercel.app/)
* **Android APK**: [Download EarthTrace.apk](android/EarthTrace.apk)

### Screenshot Gallery

<div align="center">
  <p><em>Overview Cockpit & 3D Earth Observatory</em></p>
  <img src="https://i.postimg.cc/W1HpfwN0/image.png" alt="EARTH TRACE Overview" width="800"/> 
  
</div>

<div align="center">
  <p><em>Overview Cockpit & 3D Earth Observatory On A Android Screen</em></p>
  <img src="https://i.postimg.cc/h45CvJtM/image.png" alt="EARTH TRACE Overview" width="200"/> 
  
</div>

---

---

## 📖 Table of Contents

<details><summary>Table of Contents</summary>

* [🚀 About This Project & Problem Statement](#-about-this-project--problem-statement)
* [👥 Team Details (Team 404 Err)](#-team-details-team-404-err)
* [🛠️ Solution Overview & Architecture](#️-solution-overview--architecture)
  * [Core Modules](#core-modules)
  * [Technology Stack](#technology-stack)
* [📱 Live Demo & Screenshots](#-live-demo--screenshots)
* [🧰 Installation & Setup Guide](#-installation--setup-guide)
  * [Prerequisites](#prerequisites)
  * [Clone & Install](#clone--install)
  * [Environment Configuration](#environment-configuration)
  * [Run Locally & Build](#run-locally--build)
* [🤖 AI Usage Disclosure](#-ai-usage-disclosure)
* [📄 License & Acknowledgements](#-license--acknowledgements)

</details>

---

## 🚀 About This Project & Problem Statement

**EARTH TRACE** is a professional scientific geospatial intelligence platform developed by **Team 404 Err** for the **NASA International Space Apps Challenge 2026**. 

### The Challenge: Be An Earth System Trend Detective
Understanding our changing planet requires going beyond superficial dashboards to uncover rigorous statistical relationships between Earth-system indicators. EARTH TRACE connects directly to verified satellite observations (**NASA POWER Daily Point API** and **MERRA-2 Global Reanalysis**) to analyze fine particulate matter ($\text{PM}_{2.5}$), aerosol optical depth ($\text{AOD}$), planetary boundary layer dynamics, surface temperatures, and precipitation scavenging.

### The 72-Hour Blindspot Challenge
During sudden environmental disruptions or severe weather events, raw satellite telemetry often suffers from 0 to 72 hours of data latency, orbit gaps, or cloud obscuration. EARTH TRACE implements a disciplined **72-Hour Blindspot Simulation Engine** that:
1. **Calculates Data Completeness**: Dynamically measures temporal and spatial sensor coverage.
2. **Assigns Confidence Tiers**: Distinguishes verified telemetry from unverified estimates.
3. **Communicates Uncertainty**: Explicitly informs operators of observation gaps without panicking.
4. **Identifies Critical Information Needs**: Specifies exactly what ground-truth sensor updates are required.
5. **Prioritizes Observation Regions**: Directs attention to high-vulnerability basins requiring immediate re-tasking.

---

## 👥 Team Details (Team 404 Err)

| Full Name | GitHub Username | Role & Primary Contribution |
| :--- | :--- | :--- |
| **Suyog Sontakke** | [`@suyogsontakke`](https://github.com/suyogsontakke) | **Lead Systems Architect** — NASA POWER / MERRA-2 ingestion pipeline, full-stack core, and backend telemetry proxy. |
| **Sudhanshu Dangre** | [Add GitHub Username] | **Atmospheric Data Scientist** — Mann-Kendall rank correlation test, tied-group variance corrections, and Sen’s slope estimator. |
| **Chitrasen Gautam** | [Add GitHub Username] | **Climate AI & Risk Analyst** — 72-Hour Blindspot decision matrix, GDACS/INFORM multi-hazard integration, and zero-hallucination AI synthesis. |
| **Nishant Gaikwad** | [Add GitHub Username] | **3D Geospatial & Telemetry Lead** — Three.js orbital observatory, CALIOP vertical atmospheric curtain shaders, and LiDAR point cloud meshes. |
| **Shrey Patle** | [Add GitHub Username] | **Environmental Systems Engineer** — Planetary boundary layer simulation, environmental spectral layer deck, and report exports. |

*(Note: All code commits are authored exclusively by registered team members using their respective Git accounts.)*

---

## 🛠️ Solution Overview & Architecture

### Core Modules

1. **Earth Explorer (`/earth-explorer`)**: Interactive 2D/3D world visualization for sampling surface temperatures, precipitation, soil moisture, and microclimates.
2. **Environmental Layer Explorer (`/variable-explorer`)**: Multi-layer spectral inspector for Surface Temperature, Precipitation, NDVI, Soil Moisture, Ocean Temp, $\text{PM}_{2.5}$, and Aerosol Optical Depth.
3. **Trend Detective (`/trend-detective`)**: Non-parametric Mann-Kendall rank correlation test with tied variance corrections, Sen’s median slope estimator, and OLS trajectory calculations.
4. **Global Disaster Watch (`/disaster-watch`)**: Worldwide environmental risk monitoring integrating GDACS multi-hazard alerts, INFORM Risk Index, EM-DAT disaster history, and NASA FIRMS fire telemetry.
5. **72-Hour Blindspot Simulator (`/blindspot`)**: Disciplined latency decision engine simulating 0h to 72h observation dropouts, calculating data completeness and confidence tiers.
6. **AI Earth Intelligence (`/ai-insights`)**: Grounded Gemini AI assistant translating statistical p-values, trends, country risk profiles, and data gaps into plain-language scientific explanations.
7. **Location Comparison (`/comparison`)**: Side-by-side comparative diagnostics across global monitoring stations.
8. **Reports & Analytics (`/reports`)**: Publication-ready technical memorandums, PDF formats, high-resolution chart graphics, and RFC-4180 CSV dataset exports.
9. **Team Members Directory (`/members`)**: Dedicated roster showcasing Team 404 Err member portraits, roles, status indicators, and direct Instagram handles.



**Architecture flow:** Users interact with the React interface; visualization and analysis modules present Earth data and calculate trends or observation confidence. Requests for external environmental data, disaster feeds, and Gemini AI assistance pass through the Express `/api/*` layer. The app supports Vite middleware during development, production static serving, and Android APK packaging.

### Technology Stack

The following logos highlight the principal technologies used by EARTH TRACE. They are displayed as a compact, dark-background logo strip, followed by the full stack grouped by responsibility.

<div align="center">
  <p>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" width="46" height="46" />&nbsp;&nbsp;
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" alt="Vite" width="46" height="46" />&nbsp;&nbsp;
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" alt="TypeScript" width="46" height="46" />&nbsp;&nbsp;
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" alt="Tailwind CSS" width="46" height="46" />&nbsp;&nbsp;
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/threejs/threejs-original.svg" alt="Three.js" width="46" height="46" />&nbsp;&nbsp;
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" alt="Node.js" width="46" height="46" />&nbsp;&nbsp;
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" alt="Express" width="46" height="46" />
  </p>
  <sub>React · Vite · TypeScript · Tailwind CSS · Three.js · Node.js · Express</sub>
</div>

| Area | Technologies & Services | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, React Router DOM | Component-based application, development/build tooling, type safety, and client-side navigation. |
| **Styling & Motion** | Tailwind CSS v4, Framer Motion | Responsive interface styling and UI animations. |
| **Maps & 3D** | Leaflet, React Leaflet, Three.js, WebGL | Interactive maps, spatial layers, and the 3D Earth Observatory. |
| **Charts & Analytics** | Recharts, custom SVG renderers | Data visualizations and statistical graphics. |
| **Scientific Data** | NASA POWER Daily Point API, NASA MERRA-2, GDACS, INFORM Risk Index | Earth-system observations, disaster alerts, and risk information. |
| **AI** | `@google/genai` TypeScript SDK, Gemini models | Grounded natural-language explanations of trends, risk profiles, and data gaps. |
| **Backend** | Node.js, Express | `/api/*` endpoints, external-service integration, and application serving. |
| **Mobile** | Android APK packaging | Distribution of the Earth TRACE mobile application. |

*The logo strip is illustrative of the core development stack; external scientific data providers and APIs are listed in the table above.*

## 🧰 Installation & Setup Guide

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* npm or bun package manager

### Clone & Install
```bash
git clone https://github.com/suyogsontakke/earth-trace.git
cd earth-trace
npm install
```

### Environment Configuration
Copy `.env.example` to `.env` and configure optional API keys (Note: the application includes robust static fallbacks if backend proxy keys are absent):
```bash
cp .env.example .env
```
*Never commit your actual API keys or secrets to version control.*

### Run Locally & Build
```bash
# Start development server on port 3000
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run TypeScript type check
npm run lint
```

---

## 🤖 AI Usage Disclosure

In accordance with NASA Space Apps Challenge transparency guidelines, we disclose the use of generative AI assistance during the development of EARTH TRACE:
- **Tools Used**: Google AI Studio, Gemini API, and ChatGPT.
- **Areas of Assistance**: Brainstorming system architecture, refining non-parametric statistical formulas (Mann-Kendall variance corrections), generating initial UI component layouts in Tailwind CSS, and structuring the README documentation.
- **Human Engineering & Validation**: All scientific calculations, NASA API integrations, Three.js 3D shaders, statistical validation logic, and final code reviews were authored, tested, and validated by human team members. AI tools served solely as coding and brainstorming assistants and are not git contributors.

---

## 📄 License & Acknowledgements

Distributed under the **Apache-2.0 License**. See `LICENSE` for more information.

* **NASA Langley Research Center** for the POWER Project and MERRA-2 reanalysis data.
* **NASA International Space Apps Challenge 2026** organizers and evaluators.
* **Open Source Community** (React, Three.js, Tailwind CSS, Leaflet).

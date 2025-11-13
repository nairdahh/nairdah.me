---
name: Anchorr
tools: [Self-Hosted, Jellyfin, Media Server, Discord]
image: https://raw.githubusercontent.com/nairdahh/Anchorr/refs/heads/main/assets/logo-text.png
description: Discord bot for requesting movies/TV and receiving notifications when items are added to your media server.
---

<h2 style="text-align:center; font-weight: bold;"><span class="project-title">Anchorr</span></h2>
  <br>

  <p align="center">
  <img src="https://raw.githubusercontent.com/nairdahh/Anchorr/refs/heads/main/assets/logo-text.png"/>
  
<br>
Anchorr - a small Discord bot that lets you request movies/TV via Jellyseerr and receives Jellyfin "item added" notifications in Discord.  
Use slash commands to search/request (TMDB and OMDB-backed) and get pretty embeds when content shows up on your server.
  <br>

### Features:

- `/search <title>` — search TMDB and show details in an embed; from the embed you can Request.
- `/request <title>` — send a request immediately to Jellyseerr.
- Receives Jellyfin-style webhooks and posts Add notifications into a configured Discord channel (embed with director, short summary, runtime, rating, and quick buttons).
- Optional OMDb lookup for IMDb rating / director / actors.

### Prerequisites

Before you begin, ensure you have the following:

- A running **Jellyfin** server.
- A running **Jellyseerr** instance.
- A **Discord account** and a server where you have administrative privileges.
- API keys from:
  - **The Movie Database (TMDB)**
  - **OMDb API** (Optional, but recommended for richer data)
- **Node.js** (version 18.x or later).
- **Docker** and **Docker Compose** (if you choose the Docker installation method).
  <br>

### Setup Guide

For full setup instructions, please visit the GitHub page bellow.

<p align="center"><a class="github-button img-bright" href="https://github.com/" data-color-scheme="no-preference: light; light: light; dark: dark;" data-size="large" aria-label="View Anchorr on GitHub">View on GitHub</a></p>

<p align="center"><a href="https://ko-fi.com/nairdah" class="img-href img-bright"><img src="https://ko-fi.com/img/githubbutton_sm.svg" /></a></p>

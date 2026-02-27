# Investment Game

A multiplayer web based decision making game that illustrates how individual investment decisions can affect collective outcomes. Built for the Centre for Teaching Excellence take home assessment.

## Application Description

This is a 2 to 4 player investment game where each player receives a $100 budget to allocate between two assets. Asset A is the riskless one, it just returns whatever you put in. Asset B is the interesting one, all players' contributions get pooled together, the pool is increased by 50%, and then the total is divided equally among all players regardless of how much each person put in.

### How to Play

First you create a game and choose how many players (2 to 4). You will get a 5 character game code that you share with others. Each player joins using that code from their own device or browser. Then everyone allocates their $100 between Asset A and Asset B using whole numbers. Once all players have submitted, the game calculates and displays the final payouts for everyone.

### Assumptions

Players invest whole dollar amounts only, no decimals allowed. The total allocation per player must be exactly $100. Game state is held in server memory which is fine for a demo but will not persist across server restarts. Games get automatically cleaned up after 1 hour of inactivity. Players can also join directly from the lobby page, they do not have to go back to the home screen.

## Tech Stack

Built with Next.js 16 (App Router) and TypeScript for the framework, Tailwind CSS v4 for styling, an in memory Map on the server via API routes for state management, and deployed on Vercel free tier.

## Getting Started (Local Development)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The application is deployed on Vercel:

**Live URL:** _(to be updated after deployment)_

---

## Written Answers (Question 2)

### 1. Learning Design

The idea is pretty simple. Instead of just telling students "hey, collective investment works differently from individual", I let them actually feel it. When you put money into Asset B and then see how everyone else's choices affected your own payout, that moment of "oh wait, Barry put nothing in and still got the same share as me" hits way harder than any textbook explanation. The side by side results make the free rider problem click instantly.

### 2. Deployment Approach

Since this is a classroom tool and not something handling passwords or payment info, I would keep the security practical and not overdo it.

1. HTTPS is the first thing. Vercel gives us that out of the box, so all the traffic between students' browsers and the server is encrypted.
2. Input validation on both client and server side, because you never trust what comes from the browser. Player names get trimmed and length checked, investment amounts are verified as integers that add up to 100.
3. Rate limiting on the API endpoints so nobody can spam the server with requests.
4. Content Security Policy headers to prevent any XSS issues.

Honestly for this kind of app the attack surface is quite small. We are not storing any personal data, no login system, no sensitive information. The game codes are temporary and sessions expire after an hour. So the main things to worry about are just someone trying to send garbage inputs or overload the server, and the above covers that well enough.

### 3. Scaling and Multiple Sessions

Right now the game state sits in server memory which works fine for a demo, but obviously that will not survive a server restart and you cannot scale horizontally with that approach.

What I would do for production is move the game state to Redis. It is fast enough for this kind of realtime use case, and since each game is basically just a small JSON object keyed by the game code, Redis handles that beautifully. This way if one server goes down, another can pick up the same game state no problem. You can also run multiple server instances behind a load balancer without worrying about which server holds which game.

For the realtime updates, right now I am polling every 2 seconds which is a bit wasteful. I would switch to WebSockets so the server can just push updates to players the moment something happens. Someone joins, someone submits their investment, and everyone sees it right away. Much snappier experience and less load on the server.

Each game session already has a unique code and they do not interfere with each other. In Redis I would set a TTL on each game key so stale sessions clean themselves up automatically. And for reliability, making the submission endpoint idempotent means even if a student's network hiccups and the request goes twice, it will not mess up the game state.

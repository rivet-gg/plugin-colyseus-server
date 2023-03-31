# Rivet Colyseus Plugin

Plugin to Colyseus for easy development with Rivet.

## Coming from Colyseus Arena?

Colyseus Arena was shut down March 31st, 2023. This plugin helps make the migration to Rivet seamless.

## FAQ

**What about `initializeExpress`?**

We support deploying static files with [Rivet CDN](https://docs.rivet.gg/cdn/introduction).

If you need to run a custom API server, take a look at [Fly.io](https://docs.rivet.gg/cdn/introduction) or [Railway](https://railway.app/).

**Why not use the existing [MatchMakerDriver](https://github.com/colyseus/colyseus/blob/afb44c3d4f8100465becd81d1cb995c6d773b6d8/packages/core/src/matchmaker/driver/interfaces.ts#L29)?**

The provided `MatchMakerDriver` interface by Colyseus is too rigid to use in conjunction with Rivet. Under the hood, Colyseus will use `LocalDriver` for the matchmaker.

We hope to eventually merge a more flexible matchmaking interface in to Colyseus in order to cleanly interface with the Rivet matchmaker.

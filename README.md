# 🔩 Rivet Colyseus Plugin

Plugin to Colyseus for easy development with Rivet.

## 🪦 Coming from Colyseus Arena?

Colyseus Arena was shut down March 31st, 2023. This plugin helps make the migration games to Rivet quickly and easily.

## Example

See a more detailed example [here](https://github.com/rivet-gg/plugin-colyseus-examples).

```typescript
import { listen } from "../src/index";

export default listen({
	async initializeGameServer(gameServer) {
		gameServer.define("chat", ChatRoom).enableRealtimeListing();
	},
});
```

## Running Example Server

The example server is used for manual testing for development. For more comprehensive examples, check out the [Colyseus examples repo](https://github.com/rivet-gg/plugin-colyseus-examples).

Project setup:

1. Create a game on the [Rivet Developer Dashboard](https://hub.rivet.gg/developer/dashboard)
1. Install the [Rivet CLI](https://github.com/rivet-gg/cli)
1. Run `rivet init --recommend` to link your game

Running example server:

1. Run the server in one terminal: `yarn run example`
1. Run the client example client [here](https://github.com/rivet-gg/plugin-colyseus-javascript)

## FAQ

**What happened to `initializeExpress`?**

Rivet game servers run only game code and nothing else. We support deploying static content with [Rivet CDN](https://docs.rivet.gg/cdn/introduction).

If you need to run a custom API server, take a look at [Fly.io](https://docs.rivet.gg/cdn/introduction) or [Railway](https://railway.app/).

**Why not use the existing [MatchMakerDriver](https://github.com/colyseus/colyseus/blob/afb44c3d4f8100465becd81d1cb995c6d773b6d8/packages/core/src/matchmaker/driver/interfaces.ts#L29)?**

The provided `MatchMakerDriver` interface by Colyseus is too rigid to use in conjunction with Rivet. Under the hood, Colyseus will use `LocalDriver` for the matchmaker.

We hope to eventually merge a more flexible matchmaking interface in to Colyseus in order to cleanly interface with the Rivet matchmaker.

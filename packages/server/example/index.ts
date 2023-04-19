import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

import { listen } from "../src/index";
import { DummyRoom } from "./DummyRoom";
import { RelayRoom, LobbyRoom } from "@colyseus/core";

export default listen({
	getId() {
		return "My Rivet Game";
	},

	async initializeGameServer(gameServer) {
		console.log("Initialize game server here");

		gameServer.define("lobby", LobbyRoom);

		gameServer.define("relay", RelayRoom);

		gameServer
			.define("dummy", DummyRoom)
			// demonstrating public events.
			.on("create", (room) => console.log("room created!", room.roomId))
			.on("join", (room, client) =>
				console.log("client", client.sessionId, "joined", room.roomId),
			)
			.on("leave", (room, client) =>
				console.log("client", client.sessionId, "left", room.roomId),
			)
			.on("dispose", (room) =>
				console.log("room disposed!", room.roomId),
			);
	},

	async beforeListen() {
		console.log("Handle before listen here");
	},
});

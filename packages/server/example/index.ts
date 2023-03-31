import { listen } from "../src/index";

export default listen({
	getId() {
		return "My Rivet Game";
	},

	async initializeGameServer(gameServer) {
		console.log("Initialize game server here");
	},

	async beforeListen() {
		console.log("Handle before listen here");
	},
});

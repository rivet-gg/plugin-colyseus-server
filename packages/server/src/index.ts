import { Server, ServerOptions, Transport } from "@colyseus/core";
import { RivetClient } from "@rivet-gg/api";
import { uWebSocketsTransport } from "@rivet-gg/plugin-colyseus-uwebsockets-transport";

/*
 * Transport that interfaces with the Rivet Matchmaker. Only Rivet-compatible transports should should be used.
 */
export interface RivetTransport extends Transport {
	rivet: RivetClient;
}

/*
 * Configuration options intended to be a subset of options for @colyseus/arena for simple migration.
 */
export interface RivetOptions {
	options?: ServerOptions;
	displayLogs?: boolean;
	rivetClient?: RivetClient;
	getId?: () => string;
	initializeTransport?: (options: { rivet: RivetClient }) => RivetTransport;
	initializeGameServer?: (app: Server) => Promise<void>;
	beforeListen?: () => Promise<void>;
}

export async function listen(
	options: RivetOptions,
	port: number = parseInt(process.env.PORT) || 2567,
) {
	let rivet =
		options.rivetClient ??
		new RivetClient({ token: process.env.RIVET_LOBBY_TOKEN });

	const serverOptions = options.options ?? {};
	options.displayLogs = options.displayLogs ?? true;

	let transport =
		options.initializeTransport?.({ rivet }) ??
		createDefaultTransport(rivet);

	const gameServer = new Server({
		...serverOptions,
		transport,
	});
	await options.initializeGameServer?.(gameServer);
	await options.beforeListen?.();

	gameServer.listen(port);

	const appId = options.getId?.() || "[ Colyseus ]";
	if (appId) {
		log(options, `🔩  ${appId}`);
	}

	log(options, `⚔️  Listening on ws://localhost:${port}`);

	log(options, "[Rivet] Token:", process.env.RIVET_LOBBY_TOKEN);

	// Notify Rivet that server can start accepting players
	await rivet.matchmaker.lobbies.ready();
	log(options, "[Rivet] Lobby ready");

	return gameServer;
}

function log(options: RivetOptions, ...text: string[]) {
	if (options.displayLogs) {
		console.log(...text);
	}
}

function createDefaultTransport(rivet: RivetClient): RivetTransport {
	return new uWebSocketsTransport({ rivet });
}

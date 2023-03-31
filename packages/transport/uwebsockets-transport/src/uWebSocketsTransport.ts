import http from "http";
import querystring from "querystring";
import uWebSockets from "uWebSockets.js";
import { RivetClient } from "@rivet-gg/api";

import {
	DummyServer,
	matchMaker,
	Transport,
	debugAndPrintError,
	spliceOne,
} from "@colyseus/core";
import { uWebSocketClient, uWebSocketWrapper } from "./uWebSocketClient";

export type TransportOptions = Omit<
	uWebSockets.WebSocketBehavior,
	"upgrade" | "open" | "pong" | "close" | "message"
>;

type RawWebSocketClient = uWebSockets.WebSocket & {
	headers: { [key: string]: string };
	connection: { remoteAddress: string };
};

export class uWebSocketsTransport extends Transport {
	public rivet: RivetClient;

	public app: uWebSockets.TemplatedApp;

	protected clients: RawWebSocketClient[] = [];
	protected clientWrappers = new WeakMap<
		RawWebSocketClient,
		uWebSocketWrapper
	>();

	private _listeningSocket: any;

	public constructor({
		transport,
		app,
		rivet,
	}: {
		transport?: TransportOptions;
		app?: uWebSockets.AppOptions;
		rivet: RivetClient;
	}) {
		super();

		transport = transport ?? {};
		app = app ?? {};

		this.rivet = rivet;

		this.app =
			app.cert_file_name && app.key_file_name
				? uWebSockets.SSLApp(app)
				: uWebSockets.App(app);

		if (!transport.maxBackpressure) {
			transport.maxBackpressure = 1024 * 1024;
		}

		if (!transport.compression) {
			transport.compression = uWebSockets.DISABLED;
		}

		if (!transport.maxPayloadLength) {
			transport.maxPayloadLength = 1024 * 1024;
		}

		// https://github.com/colyseus/colyseus/issues/458
		// Adding a mock object for Transport.server
		if (!this.server) {
			this.server = new DummyServer();
		}

		this.app.ws("/*", {
			...transport,

			upgrade: (res, req, context) => {
				// get all headers
				const headers: { [id: string]: string } = {};
				req.forEach((key, value) => (headers[key] = value));

				/* This immediately calls open handler, you must not use res after this call */
				/* Spell these correctly */
				res.upgrade(
					{
						url: req.getUrl(),
						query: req.getQuery(),

						// compatibility with @colyseus/ws-transport
						headers,
						connection: {
							remoteAddress: Buffer.from(
								res.getRemoteAddressAsText()
							).toString(),
						},
					},
					req.getHeader("sec-websocket-key"),
					req.getHeader("sec-websocket-protocol"),
					req.getHeader("sec-websocket-extensions"),
					context
				);
			},

			open: async (ws: RawWebSocketClient) => {
				// ws.pingCount = 0;
				await this.onConnection(ws);
			},

			// pong: (ws: RawWebSocketClient) => {
			//     ws.pingCount = 0;
			// },

			close: (ws: RawWebSocketClient, code: number, message: ArrayBuffer) => {
				// remove from client list
				spliceOne(this.clients, this.clients.indexOf(ws));

				const clientWrapper = this.clientWrappers.get(ws);
				if (clientWrapper) {
					this.clientWrappers.delete(ws);

					// emit 'close' on wrapper
					clientWrapper.emit("close", code);
				}
			},

			message: (
				ws: RawWebSocketClient,
				message: ArrayBuffer,
				isBinary: boolean
			) => {
				// emit 'close' on wrapper
				this.clientWrappers
					.get(ws)
					?.emit("message", Buffer.from(message.slice(0)));
			},
		});
	}

	public listen(
		port: number,
		hostname?: string,
		backlog?: number,
		listeningListener?: () => void
	) {
		this.app.listen(port, (listeningSocket: any) => {
			this._listeningSocket = listeningSocket;
			listeningListener?.();
			this.server.emit("listening"); // Mocking Transport.server behaviour, https://github.com/colyseus/colyseus/issues/458
		});
		return this;
	}

	public shutdown() {
		if (this._listeningSocket) {
			uWebSockets.us_listen_socket_close(this._listeningSocket);
			this.server.emit("close"); // Mocking Transport.server behaviour, https://github.com/colyseus/colyseus/issues/458
		}
	}

	public simulateLatency(milliseconds: number) {
		const originalRawSend = uWebSocketClient.prototype.raw;
		uWebSocketClient.prototype.raw = function () {
			setTimeout(() => originalRawSend.apply(this, arguments), milliseconds);
		};
	}

	protected async onConnection(rawClient: RawWebSocketClient) {
		const wrapper = new uWebSocketWrapper(rawClient);
		// keep reference to client and its wrapper
		this.clients.push(rawClient);
		this.clientWrappers.set(rawClient, wrapper);

		const query = rawClient.query;
		const url = rawClient.url;

		const queryParsed = querystring.parse(query);
		const playerToken = queryParsed.playerToken as string;
		const sessionId = queryParsed.sessionId as string;
		const processAndRoomId = url.match(/\/[a-zA-Z0-9_\-]+\/([a-zA-Z0-9_\-]+)$/);
		const roomId = processAndRoomId && processAndRoomId[1];

		// Validate Rivet player
		try {
			await this.rivet.matchmaker.players.connected({ playerToken });
		} catch (err) {
			console.warn("Failed to connect player to Rivet", err);
			rawClient.close();
			return;
		}

		const room = matchMaker.getRoomById(roomId);
		const client = new uWebSocketClient(sessionId, wrapper);

		//
		// TODO: DRY code below with all transports
		//

		try {
			if (!room || !room.hasReservedSeat(sessionId)) {
				throw new Error("seat reservation expired.");
			}

			await room._onJoin(client, rawClient as unknown as http.IncomingMessage);
		} catch (e) {
			debugAndPrintError(e);

			// send error code to client then terminate
			client.error(e.code, e.message, () => rawClient.close());
		}
	}
}

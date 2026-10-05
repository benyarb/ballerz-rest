/**
 * Ballerz API Cloudflare Worker!
 *
 * - Run `wrangler dev` in terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see worker in action
 * - Run `wrangler deploy` to deploy worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	BALLER: KVNamespace;
}

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
};

const text = (body: string, status: number) => new Response(body, { status, headers: CORS_HEADERS });

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			return text('Method Not Allowed', 405);
		}

		const match = new URL(request.url).pathname.match(/^\/baller\/(\d+)$/);
		if (!match) {
			return text('Not Found', 404);
		}

		const id = match[1];
		try {
			const ballerData = await env.BALLER.get(`baller-${id}`);
			if (!ballerData) {
				return text('Baller not found', 404);
			}

			return new Response(JSON.stringify({ id, ...JSON.parse(ballerData) }, null, 2), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'public, max-age=3600',
					...CORS_HEADERS,
				},
			});
		} catch (error) {
			console.error('Error retrieving baller data:', error);
			return text('Internal Server Error', 500);
		}
	},
} satisfies ExportedHandler<Env>;

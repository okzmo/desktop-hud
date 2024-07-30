import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import fs from 'fs';

export default defineConfig(({ mode }) => {
	const isDevelopment = mode === 'development';

	return {
		plugins: [sveltekit()],
		server: isDevelopment
			? {
					https: {
						key: fs.readFileSync(`${__dirname}/cert/key.pem`),
						cert: fs.readFileSync(`${__dirname}/cert/cert.pem`)
					},
					proxy: {}
				}
			: {},
		test: {
			include: ['src/**/*.{test,spec}.{js,ts}']
		}
	};
});

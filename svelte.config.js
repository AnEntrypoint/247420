import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
//import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-static';
/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
		adapter: adapter({
			// default options are shown. On some platforms
			// these options are set automatically — see below
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: true,
			strict: true
		})
	},

    preprocess: [vitePreprocess({})]
};

export default config;

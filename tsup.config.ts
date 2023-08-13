import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/**/*.ts'],
	external: [],
	noExternal: [],
	platform: 'node',
	format: ['esm'],
	skipNodeModulesBundle: false,
	target: 'es2022',
	clean: true,
	shims: false,
	minify: false,
	splitting: true,
	keepNames: true,
	dts: false,
	sourcemap: false,
	esbuildPlugins: [],
	bundle: false
});

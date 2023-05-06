import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/**/*.ts'],
	external: [],
	noExternal: [],
	platform: 'node',
	format: ['cjs'],
	skipNodeModulesBundle: false,
	target: 'es2022',
	clean: false,
	shims: false,
	minify: true,
	splitting: true,
	keepNames: true,
	dts: false,
	sourcemap: false,
	esbuildPlugins: [],
	bundle: false,
});

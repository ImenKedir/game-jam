import { DiscordProxy } from '@robojs/patch'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), DiscordProxy.Vite()],
	server: {
		allowedHosts: true,
	},
	optimizeDeps: {
		include: ['@uiw/react-codemirror', '@codemirror/lang-javascript'],
		force: true
	},
	build: {
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					'codemirror': ['@uiw/react-codemirror', '@codemirror/lang-javascript'],
				}
			}
		}
	}
})

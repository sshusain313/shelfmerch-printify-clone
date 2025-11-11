import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const TUNNEL_HOST = env.VITE_TUNNEL_HOST;

  return {
    root: './',
    build: {
      outDir: 'build',
      emptyOutDir: true,
    },
    server: {
      host: true,
      port: 8080,
      allowedHosts: TUNNEL_HOST 
        ? [TUNNEL_HOST, 'localhost', '127.0.0.1', '.localhost']
        : ['localhost', '127.0.0.1', '.localhost'],
      origin: TUNNEL_HOST ? `https://${TUNNEL_HOST}` : undefined,
      hmr: TUNNEL_HOST
        ? {
            host: TUNNEL_HOST,
            protocol: "wss",
            clientPort: 443,
          }
        : undefined,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "./src"),
      },
    },
  };
});

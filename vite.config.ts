import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const TUNNEL_HOST = env.VITE_TUNNEL_HOST;

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        // Dev-only: avoids browser CORS by proxying through Vite (same-origin)
        "/api/partner": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
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
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "./src"),
      },
    },
  };
});

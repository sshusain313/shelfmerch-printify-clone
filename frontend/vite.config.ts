import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // loads .env.*, including VITE_* keys
  const TUNNEL_HOST = env.VITE_TUNNEL_HOST;     // e.g. olive-...ngrok-free.dev

  return {
    server: {
      // Bind to all interfaces (your original had '::', which is fine too)
      host: true,
      port: 8080,

      // ✅ Allow the ngrok Host header and localhost
      allowedHosts: TUNNEL_HOST 
        ? [TUNNEL_HOST, 'localhost', '127.0.0.1', '.localhost']
        : ['localhost', '127.0.0.1', '.localhost'],

      // ✅ Make Vite generate absolute URLs that match your public tunnel
      origin: TUNNEL_HOST ? `https://${TUNNEL_HOST}` : undefined,

      // ✅ Ensure HMR/WebSocket goes over TLS/443 through ngrok
      hmr: TUNNEL_HOST
        ? {
            host: TUNNEL_HOST,
            protocol: "wss",
            clientPort: 443,
          }
        : undefined,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

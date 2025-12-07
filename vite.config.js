import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const saveConfigPlugin = () => ({
  name: 'save-config',
  configureServer(server) {
    server.middlewares.use('/api/save-config', async (req, res, next) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const config = JSON.parse(body);
            const filePath = path.resolve(__dirname, 'public/demo/config.json');
            
            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
            console.log('Config saved to', filePath);
          } catch (err) {
            console.error('Error saving config:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to save config' }));
          }
        });
      } else {
        next();
      }
    });
    
    server.middlewares.use('/api/save-transcript', async (req, res, next) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const transcript = JSON.parse(body);
            const filePath = path.resolve(__dirname, 'public/demo/transcript.json');
            
            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filePath, JSON.stringify(transcript, null, 2));
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
            console.log('Transcript saved to', filePath);
          } catch (err) {
            console.error('Error saving transcript:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to save transcript' }));
          }
        });
      } else {
        next();
      }
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), saveConfigPlugin()],
})

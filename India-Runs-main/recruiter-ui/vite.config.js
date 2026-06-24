import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to handle saving submission.csv from the frontend
function submissionSaverPlugin() {
  return {
    name: 'submission-saver',
    configureServer(server) {
      server.middlewares.use('/api/save-submission', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString() });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const candidates = data.candidates || [];
              
              // Format exactly like the python rank.py output
              const csvHeader = 'candidate_id,rank,score,reasoning\n';
              const csvRows = candidates.map(c => 
                `${c.id},${c.rank},${c.rawScore},"${c.summary}"`
              ).join('\n');
              
              const outputPath = path.resolve(__dirname, '../submission.csv');
              fs.writeFileSync(outputPath, csvHeader + csvRows);
              
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              console.error('Error saving submission:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to save submission.csv' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), submissionSaverPlugin()],
})

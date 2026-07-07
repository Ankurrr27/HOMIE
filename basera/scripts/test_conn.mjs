import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Configure Node to use Google and Cloudflare DNS servers
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Load environment variables from .env.local manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.slice(0, index).trim();
        const value = trimmed.slice(index + 1).trim();
        process.env[key] = value;
      }
    }
  });
}

console.log('Loaded MONGODB_URI:', JSON.stringify(process.env.MONGODB_URI));

async function test() {
  dns.resolveSrv('_mongodb._tcp.basera-cluster.vcae3oc.mongodb.net', async (dnsErr, addresses) => {
    if (dnsErr) {
      console.error('DNS SRV Lookup failed inside Node:', dnsErr);
    } else {
      console.log('DNS SRV Lookup inside Node succeeded:', addresses);
    }

    try {
      console.log('Connecting to database via Mongoose...');
      const dbConnect = (await import('../lib/mongodb.js')).default;
      const conn = await dbConnect();
      console.log('Successfully connected to MongoDB Atlas! Database Name:', conn.connection.name);
      process.exit(0);
    } catch (error) {
      console.error('Database connection failed:', error);
      process.exit(1);
    }
  });
}

test();

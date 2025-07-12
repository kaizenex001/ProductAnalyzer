// Vercel API handler for serverless deployment
import { createServer } from '../server/index.js';

// Create a cached server instance
let server;

export default async function handler(req, res) {
  // Initialize server if not already done
  if (!server) {
    server = await createServer();
  }
  
  // Handle the request
  return server(req, res);
}

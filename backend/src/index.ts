import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { readdir, writeFile, unlink } from 'fs/promises';
import { resolve } from 'path';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const CERTS_DIR = resolve(process.cwd(), 'certs');

// Cache for initialized Firebase apps
const firebaseApps = new Map<string, admin.app.App>();

/**
 * Initializes a Firebase app for a given project ID if not already initialized.
 * @param projectId The Firebase project ID.
 */
export async function initializeFirebaseApp(projectId: string) {
  if (firebaseApps.has(projectId)) {
    return firebaseApps.get(projectId);
  }

  try {
    const certPath = resolve(CERTS_DIR, `${projectId}.json`);

    // Legge il certificato come JSON
    if (!fs.existsSync(certPath)) {
      throw new Error(`Certificate file not found: ${certPath}`);
    }
    const serviceAccount = JSON.parse(fs.readFileSync(certPath, 'utf-8'));

    // Inizializza Firebase app
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    }, projectId);

    firebaseApps.set(projectId, app);
    console.log(`Initialized Firebase app for project: ${projectId}`);
    return app;
  } catch (error: any) {
    console.error(`Failed to initialize Firebase app for project ${projectId}:`, error);
    throw new Error(`Certificate for project '${projectId}' not found or invalid.`);
  }
}

/**
 * Endpoint to get the list of available projects.
 */
app.get('/api/projects', async (req, res) => {
  try {
    const files = await readdir(CERTS_DIR);
    const projectIds = files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    res.json({ projects: projectIds });
  } catch (error) {
    console.error('Failed to read certificates directory:', error);
    res.status(500).json({ error: 'Could not list projects.' });
  }
});

/**
 * Endpoint to send an FCM message.
 */
app.post('/api/send', async (req, res) => {
  const { projectId, message } = req.body;
  console.log(req.body);
  if (!projectId || !message) {
    return res.status(400).json({ error: 'projectId and message are required.' });
  }
  try {
    const firebaseApp = await initializeFirebaseApp(projectId);
    if (!firebaseApp) {
      throw new Error('Firebase app could not be initialized.');
    }

    const propertyCount = Number(!!message.token) + Number(!!message.topic) + Number(!!message.condition);

    if (propertyCount !== 1) {
      return res.status(400).json({
        error: "Message must contain exactly one of: token, topic, or condition"
      });
    }

    const response = await firebaseApp.messaging().send(message);
    console.log('Successfully sent message:', response);
    res.json({ success: true, response });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('Error sending FCM message:', errorMessage);
    res.status(500).json({ success: false, error: errorMessage });
  }
});


/**
 * Endpoint to upload a new certificate.
 */
app.post('/api/certificates', async (req, res) => {
  const certificate = req.body;

  if (!certificate || !certificate.project_id || !certificate.private_key || !certificate.client_email) {
    return res.status(400).json({ error: 'Invalid certificate format.' });
  }

  const projectId = certificate.project_id;
  const filePath = resolve(CERTS_DIR, `${projectId}.json`);

  try {
    await writeFile(filePath, JSON.stringify(certificate, null, 2));
    console.log(`Certificate for project ${projectId} saved.`);
    res.status(201).json({ success: true, projectId });
  } catch (error) {
    console.error(`Failed to save certificate for project ${projectId}:`, error);
    res.status(500).json({ error: 'Could not save certificate.' });
  }
});

/**
 * Endpoint to delete a certificate.
 */
app.delete('/api/certificates/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const filePath = resolve(CERTS_DIR, `${projectId}.json`);

  try {
    await unlink(filePath);

    // Also remove from the initialized apps cache if it exists
    if (firebaseApps.has(projectId)) {
      const app = firebaseApps.get(projectId);
      if (app) {
        await app.delete();
        firebaseApps.delete(projectId);
        console.log(`Unloaded Firebase app for project: ${projectId}`);
      }
    }

    console.log(`Certificate for project ${projectId} deleted.`);
    res.json({ success: true, projectId });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Certificate not found.' });
    }
    console.error(`Failed to delete certificate for project ${projectId}:`, error);
    res.status(500).json({ error: 'Could not delete certificate.' });
  }
});

app.listen(port, () => {

  console.log(`Backend server listening on port ${port}`);
});

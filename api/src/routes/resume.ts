import express from 'express';
import multer from 'multer';
import { BlobServiceClient } from '@azure/storage-blob';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = 'resumes';
const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:8000/api/v1/devops-agent/invoke';
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });

// POST /resume/upload
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!AZURE_STORAGE_CONNECTION_STRING) return res.status(500).json({ error: 'Azure storage not configured' });
    if (!DATABASE_URL) return res.status(500).json({ error: 'Database not configured' });

    // Upload to Azure Blob Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    await containerClient.createIfNotExists();
    const blobName = `${uuidv4()}-${req.file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype }
    });
    const fileUrl = blockBlobClient.url;

    // Save metadata to DB
    const userId = req.user!.id;
    const insertResult = await pool.query(
      'INSERT INTO resumes (user_id, file_name, file_url, uploaded_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [userId, req.file.originalname, fileUrl]
    );
    const resumeId = insertResult.rows[0].id;

    // Trigger AI agent analysis (privacy-first: only fileUrl, no PII)
    const agentResp = await axios.post(AGENT_API_URL, {
      user_id: userId,
      query: 'Analyze this resume for career recommendations and skill insights. Return only non-PII, privacy-first results.',
      current_file_context: { file_type: req.file.mimetype, file_url: fileUrl },
      session_id: `resume-${resumeId}`
    });
    const analysisResults = agentResp.data;

    // Save analysis results to DB
    await pool.query('UPDATE resumes SET analysis_results = $1 WHERE id = $2', [analysisResults, resumeId]);

    // Connect to recommendation engine (first week: use resume analysis)
    // (Assume recommendation engine uses resume analysis for initial recs)
    // Optionally, trigger rec engine update here

    res.json({ resumeId, fileUrl, analysisResults });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ error: 'Resume upload/analysis failed' });
  }
});

// GET /resume/:id
router.get('/:id', protect, async (req, res) => {
  try {
    if (!DATABASE_URL) return res.status(500).json({ error: 'Database not configured' });
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM resumes WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Resume not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

export default router; 
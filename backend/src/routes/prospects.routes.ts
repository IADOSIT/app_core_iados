import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getProspects, getProspect, createProspect, updateProspect, deleteProspect, addQuote, updateQuote, deleteQuote } from '../controllers/prospects.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// File upload config
const storage = multer.diskStorage({
  destination: '/app/uploads/quotes',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) { res.status(400).json({ success: false, message: 'Sin archivo' }); return; }
  const url = `/uploads/quotes/${req.file.filename}`;
  res.json({ success: true, url, originalName: req.file.originalname });
});

router.get('/', getProspects);
router.get('/:id', getProspect);
router.post('/', createProspect);
router.put('/:id', updateProspect);
router.delete('/:id', deleteProspect);
router.post('/:id/quotes', addQuote);
router.put('/:id/quotes/:qid', updateQuote);
router.delete('/:id/quotes/:qid', deleteQuote);

export default router;

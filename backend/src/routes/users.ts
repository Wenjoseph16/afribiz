import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from '../middlewares/auth';
import {
  getMyProfile,
  updateMyProfile,
  updateMyPassword,
  toggleMy2FA,
  uploadMyAvatar,
} from '../controllers/users';

const router = Router();

router.use(authMiddleware);

// Avatar upload
const avatarsDir = process.env.VERCEL
  ? '/tmp/uploads/avatars'
  : path.join(process.cwd(), 'uploads/avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.get('/profile', getMyProfile);
router.get('/me', getMyProfile);
router.put('/profile', updateMyProfile);
router.put('/password', updateMyPassword);
router.post('/2fa', toggleMy2FA);
router.post('/avatar', upload.single('avatar'), uploadMyAvatar);

export default router;

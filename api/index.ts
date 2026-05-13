import { appPromise } from './server';

export default async (req: any, res: any) => {
  console.log(`[API Handler] Menerima permintaan: ${req.method} ${req.url}`);
  try {
    const app = await appPromise;
    console.log(`[API Handler] App berhasil didapatkan, meneruskan permintaan...`);
    return app(req, res);
  } catch (error: any) {
    console.error(`[API Handler] Galat saat memproses permintaan:`, error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

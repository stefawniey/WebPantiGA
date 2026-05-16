import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Lazy initialization of Supabase Client
let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      console.error("GAGAL: SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY kosong!");
      return null;
    }
    supabaseClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseClient;
}

async function seedDatabase(supabase: any) {
  try {
    const { data: adminUser } = await supabase.from('users').select('id').eq('email', 'admin@amanah.id').maybeSingle();
    if (!adminUser) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await supabase.from('users').insert([{ 
        email: 'admin@amanah.id', 
        password: hashedPassword, 
        name: 'Admin Griya Amanah', 
        role: 'admin' 
      }]);
    }
  } catch (e) {
    console.error("Seeding error:", e);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  const supabase = getSupabase();
  if (supabase && !process.env.VERCEL) {
    seedDatabase(supabase).catch(console.error);
  }

  const authMiddleware = (req: any, res: any, next: any) => {
    const userCookie = req.cookies.user;
    const userHeader = req.headers['x-user-data'];
    
    if (userCookie) {
      try {
        req.user = typeof userCookie === 'string' ? JSON.parse(userCookie) : userCookie;
        return next();
      } catch (e) {
        console.error("Auth helper error:", e);
      }
    } 
    
    if (userHeader && userHeader !== 'undefined' && userHeader !== 'null' && userHeader !== '') {
      try {
        req.user = JSON.parse(userHeader as string);
        return next();
      } catch (e) {
        return res.status(401).json({ error: 'Sesi header tidak valid' });
      }
    }

    res.status(401).json({ error: 'Silakan login kembali' });
  };

  app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', vercel: !!process.env.VERCEL });
  });

  app.post('/api/register', async (req, res) => {
    let { name, email, password } = req.body;
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });
    if (!email || !password || !name) return res.status(400).json({ error: 'Data tidak lengkap' });

    try {
      const hashedPassword = bcrypt.hashSync(password.trim(), 10);
      const { data, error } = await supabase
        .from('users')
        .insert([{ name, email: email.toLowerCase().trim(), password: hashedPassword, role: 'user' }])
        .select();

      if (error) throw error;
      const user = data[0];
      const userData = { id: user.id, email: user.email, name: user.name, role: user.role };
      res.cookie('user', JSON.stringify(userData), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
      res.json(userData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/login', async (req, res) => {
    let { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });

    try {
      const supabase = getSupabase();
      if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

      const { data: user, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
      if (error) throw error;

      const isSuperAdmin = (email === 'admin@amanah.id' && password === 'admin123');
      if (isSuperAdmin || (user && bcrypt.compareSync(password.trim(), user.password))) {
        const userData = user ? { id: user.id, email: user.email, name: user.name, role: user.role, bio: user.bio } 
          : { id: 'admin-system', email: 'admin@amanah.id', name: 'Admin Griya Amanah', role: 'admin' };
        
        res.cookie('user', JSON.stringify(userData), { 
          httpOnly: true, 
          maxAge: 24 * 60 * 60 * 1000,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        return res.json(userData);
      }
      res.status(401).json({ error: 'Email atau kata sandi salah' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/logout', (req, res) => {
    res.clearCookie('user');
    res.json({ success: true });
  });

  app.get('/api/orphanages', async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });
    const { data } = await supabase.from('orphanages').select('*');
    res.json(data || []);
  });

  app.get('/api/orphanages/:id', async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });
    const { data } = await supabase.from('orphanages').select('*').eq('id', req.params.id).single();
    res.json(data);
  });

  app.post('/api/donations', authMiddleware, async (req: any, res) => {
    const { orphanage_id, type, amount, goods_detail, method } = req.body;
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    const { data, error } = await supabase.from('donations').insert([{ 
      user_id: req.user.id, 
      orphanage_id, 
      type, 
      amount: type === 'money' ? Number(amount) : null, 
      goods_detail, 
      method,
      status: 'pending'
    }]).select().maybeSingle();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.get('/api/my-donations', authMiddleware, async (req: any, res) => {
    const supabase = getSupabase();
    const { data } = await supabase.from('donations').select('*, orphanage:orphanages(name)').eq('user_id', req.user.id).order('created_at', { ascending: false });
    res.json((data || []).map(d => ({ ...d, orphanage_name: d.orphanage?.name })));
  });

  app.get('/api/admin/dashboard', authMiddleware, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database error' });
    
    try {
      const { data: moneyData } = await supabase.from('donations').select('amount').eq('type', 'money').in('status', ['pending', 'verified', 'completed']);
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user');
      const { data: recentDonations } = await supabase.from('donations').select('*').order('created_at', { ascending: false }).limit(10);

      const enriched = await Promise.all((recentDonations || []).map(async (d: any) => {
        const { data: u } = await supabase.from('users').select('name').eq('id', d.user_id).maybeSingle();
        const { data: o } = await supabase.from('orphanages').select('name').eq('id', d.orphanage_id).maybeSingle();
        return { ...d, user_name: u?.name || 'Hamba Allah', orphanage_name: o?.name || 'Panti' };
      }));

      res.json({
        stats: {
          totalMoney: (moneyData || []).reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0),
          totalUsers: usersCount || 0
        },
        recentDonations: enriched
      });
    } catch (err) {
      res.status(500).json({ error: 'Dashboard error' });
    }
  });

  // Serve static files
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  return app;
}

const appPromise = startServer();

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};

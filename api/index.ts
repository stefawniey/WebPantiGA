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
        role: 'admin',
        status: 'active'
      }]);
    }

    const { data: regularUser } = await supabase.from('users').select('id').eq('role', 'user').limit(1).maybeSingle();
    if (!regularUser) {
      console.log("[Seed] Menanam data user biasa...");
      const hashedPass = bcrypt.hashSync('user123', 10);
      await supabase.from('users').insert([{ 
        email: 'user@example.com', 
        password: hashedPass, 
        name: 'Donatur Contoh', 
        role: 'user',
        status: 'active'
      }]);
    }

    // Check if orphanages exist
    const { count } = await supabase.from('orphanages').select('*', { count: 'exact', head: true });
    if (count === 0) {
      console.log("[Seed] Menanam data panti asuhan...");
      await supabase.from('orphanages').insert([
        {
          name: 'Panti Asuhan Griya Amanah Kasih',
          description: 'Lembaga asuhan anak yang berfokus pada pendidikan karakter dan kemandirian.',
          location: 'Jakarta Selatan',
          image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070',
          target_money: 50000000,
          current_money: 12500000,
          urgent_needs: '[MENDESAK] Kebutuhan sembako dan biaya SPP sekolah.'
        },
        {
          name: 'Rumah Yatim Sinar Harapan',
          description: 'Mewadahi anak-anak yatim piatu untuk mendapatkan kehidupan yang layak.',
          location: 'Bandung',
          image_url: 'https://images.unsplash.com/photo-1540479859555-17af45c78602?q=80&w=2070',
          target_money: 30000000,
          current_money: 5000000,
          urgent_needs: 'Buku pelajaran dan alat tulis.'
        }
      ]);
    }

    // Check if donations exist
    const { count: donationsCount } = await supabase.from('donations').select('*', { count: 'exact', head: true });
    if (donationsCount === 0) {
      console.log("[Seed] Menanam data donasi...");
      const { data: orphanages } = await supabase.from('orphanages').select('id');
      const { data: users } = await supabase.from('users').select('id').eq('role', 'user');
      
      if (orphanages && orphanages.length > 0 && users && users.length > 0) {
        await supabase.from('donations').insert([
          {
            user_id: users[0].id,
            orphanage_id: orphanages[0].id,
            type: 'money',
            amount: 1000000,
            method: 'Transfer Bank',
            status: 'completed',
            created_at: new Date().toISOString()
          },
          {
            user_id: users[0].id,
            orphanage_id: orphanages[1].id,
            type: 'goods',
            goods_detail: '10 Dus Mie Instan',
            status: 'verified',
            created_at: new Date().toISOString()
          },
          {
            user_id: users[0].id,
            orphanage_id: orphanages[0].id,
            type: 'goods',
            goods_detail: 'Baju Layak Pakai',
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ]);
      }
    }
  } catch (e) {
    console.error("Seeding error:", e);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Logging tambahan untuk memantau request di Vercel
  app.use((req: any, res: any, next: any) => {
    console.log(`[Express] Request: ${req.method} ${req.url}`);
    next();
  });

  const supabase = getSupabase();
  if (supabase && !process.env.VERCEL) {
    seedDatabase(supabase).catch(err => console.error("Seed error:", err));
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
      } catch (e) {
        // Fallback for malformed header
      }
    }

    // Check if user is suspended if we have a user
    if (req.user && req.user.role !== 'admin') {
      const supabase = getSupabase();
      if (supabase) {
        // We do a quick check to ensure they aren't blocked
        // Checking both 'status' and 'role' for flexibility if 'status' column is missing
        supabase.from('users').select('*').eq('id', req.user.id).maybeSingle().then(({ data, error }: any) => {
          
          const isSuspended = (data?.status === 'suspended') || (data?.role === 'suspended');
          
          if (isSuspended) {
            return res.status(403).json({ error: 'Akun Anda ditangguhkan. Silakan hubungi admin di admin@amanah.id' });
          }
          next();
        }).catch(() => next());
        return;
      }
    }
    
    // Default anonymous user if not logged in but trying to access non-safe routes
    if (!req.user && (req.path.startsWith('/api/admin') || req.path === '/api/donations')) {
       return res.status(401).json({ error: 'Silakan login sebagai admin' });
    }
    
    next();
  };

  app.get('/api/me', authMiddleware, async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not logged in' });
    
    const supabase = getSupabase();
    if (!supabase) return res.json(req.user);

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.user.id)
        .maybeSingle();

      if (error) throw error;
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (user.status === 'suspended' || user.role === 'suspended') {
        return res.status(403).json({ error: 'Akun Anda ditangguhkan. Silakan hubungi admin.' });
      }

      const userData = { id: user.id, email: user.email, name: user.name, role: user.role, bio: user.bio, status: user.status || (user.role === 'suspended' ? 'suspended' : 'active') };
      res.json(userData);
    } catch (err) {
      res.json(req.user);
    }
  });

  app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', vercel: !!process.env.VERCEL });
  });

  app.post('/api/register', async (req, res) => {
    let { name, email, password } = req.body;
    console.log(`[Register] Request diterima untuk: ${email}`);
    
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    try {
      const hashedPassword = bcrypt.hashSync(password.trim(), 10);
      
      let insertData: any = { name, email: email.toLowerCase().trim(), password: hashedPassword, role: 'user', status: 'active' };
      let { data, error } = await supabase
        .from('users')
        .insert([insertData])
        .select();

      // Fallback if status column is missing (PGRST204)
      if (error && error.code === 'PGRST204') {
        console.warn(`[Register] 'status' column missing, retrying without it.`);
        delete insertData.status;
        const retry = await supabase
          .from('users')
          .insert([insertData])
          .select();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Failed to create account');
      
      const user = data[0];
      const userData = { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status || 'active' };
      
      res.cookie('user', JSON.stringify(userData), { 
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
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

      // Super Admin Hardcoded Check
      if (email === 'admin@amanah.id' && password === 'admin123') {
        const adminData = { id: 'admin-system', email: 'admin@amanah.id', name: 'Admin Griya Amanah', role: 'admin' };
        res.cookie('user', JSON.stringify(adminData), { 
          httpOnly: true, 
          maxAge: 24 * 60 * 60 * 1000,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        return res.json(adminData);
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      
      if (error) throw error;
      if (user && bcrypt.compareSync(password.trim(), user.password)) {
        if (user.status === 'suspended' || user.role === 'suspended') {
          return res.status(403).json({ error: 'Akun Anda telah ditangguhkan. Silakan hubungi admin.' });
        }
        const userData = { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role, 
          bio: user.bio, 
          status: user.status || (user.role === 'suspended' ? 'suspended' : 'active') 
        };
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
    const { data } = await supabase.from('orphanages').select('*').order('created_at', { ascending: false });
    res.json(data || []);
  });

  app.post('/api/orphanages', authMiddleware, async (req: any, res) => {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya admin yang boleh menambah panti' });
    const supabase = getSupabase();
    const { data, error } = await supabase.from('orphanages').insert([req.body]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.get('/api/orphanages/:id', async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });
    const { data } = await supabase.from('orphanages').select('*').eq('id', req.params.id).single();
    res.json(data);
  });

  app.patch('/api/orphanages/:id', authMiddleware, async (req: any, res: any) => {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const supabase = getSupabase();
    const { data, error } = await supabase.from('orphanages').update(req.body).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.put('/api/orphanages/:id', authMiddleware, async (req: any, res: any) => {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const supabase = getSupabase();
    const { data, error } = await supabase.from('orphanages').update(req.body).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.delete('/api/orphanages/:id', authMiddleware, async (req: any, res) => {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database error' });

    try {
      // Delete all donations associated with this orphanage first
      const { error: donationError } = await supabase.from('donations').delete().eq('orphanage_id', req.params.id);
      if (donationError) throw donationError;

      const { error } = await supabase.from('orphanages').delete().eq('id', req.params.id);
      if (error) throw error;

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/donations', authMiddleware, async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'Silakan login' });
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
    if (!req.user) return res.status(401).json({ error: 'Silakan login' });
    const supabase = getSupabase();
    const { data } = await supabase.from('donations').select('*, orphanage:orphanages(name)').eq('user_id', req.user.id).order('created_at', { ascending: false });
    res.json((data || []).map(d => ({ ...d, orphanage_name: d.orphanage?.name })));
  });

  app.post('/api/reset-password', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password baru wajib diisi' });
    }

    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    try {
      console.log(`[Reset] Mencoba mereset password untuk: ${email}`);
      
      // Hash the new password
      const hashedPassword = bcrypt.hashSync(password.trim(), 10);
      
      const { error } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('email', email.toLowerCase().trim());

      if (error) throw error;

      res.json({ success: true, message: "Kata sandi Anda telah berhasil diperbarui" });
    } catch (err: any) {
      console.error(`[Reset] Error:`, err);
      res.status(500).json({ error: 'Gagal memperbarui kata sandi' });
    }
  });

  // Admin Routes
  const adminMiddleware = (req: any, res: any, next: any) => {
    authMiddleware(req, res, () => {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak: Hanya untuk Admin' });
      }
      next();
    });
  };

  app.get('/api/admin/dashboard', adminMiddleware, async (req: any, res) => {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database error' });
    
    try {
      const { data: moneyData } = await supabase.from('donations').select('amount').eq('type', 'money').in('status', ['pending', 'verified', 'completed']);
      const { count: goodsCount } = await supabase.from('donations').select('*', { count: 'exact', head: true }).eq('type', 'goods').in('status', ['pending', 'verified', 'completed']);
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user');
      const { count: pendingCount } = await supabase.from('donations').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { data: recentDonations } = await supabase.from('donations').select('*').order('created_at', { ascending: false });

      const enriched = await Promise.all((recentDonations || []).map(async (d: any) => {
        const { data: u } = await supabase.from('users').select('name').eq('id', d.user_id).maybeSingle();
        const { data: o } = await supabase.from('orphanages').select('name').eq('id', d.orphanage_id).maybeSingle();
        return { ...d, user_name: u?.name || 'Hamba Allah', orphanage_name: o?.name || 'Panti' };
      }));

      res.json({
        stats: {
          totalMoney: (moneyData || []).reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0),
          totalGoods: goodsCount || 0,
          totalUsers: usersCount || 0,
          pendingCount: pendingCount || 0
        },
        recentDonations: enriched
      });
    } catch (err) {
      res.status(500).json({ error: 'Dashboard error' });
    }
  });

  app.get('/api/admin/reports', adminMiddleware, async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database error' });
    
    try {
      const { data: donations } = await supabase.from('donations').select('*, orphanage:orphanages(name), user:users(name)').order('created_at', { ascending: false });
      const { data: orphanages } = await supabase.from('orphanages').select('id, name, target_money');

      const donationsList = (donations || []).map(d => ({
        ...d,
        user_name: d.user?.name,
        orphanage_name: d.orphanage?.name
      }));

      const totalMoney = donationsList.reduce((sum, d) => sum + (d.type === 'money' && (['verified', 'completed'].includes(d.status)) ? Number(d.amount) || 0 : 0), 0);
      const totalGoods = donationsList.filter(d => d.type === 'goods' && (['verified', 'completed'].includes(d.status))).length;
      
      const byOrphanageMap: Record<string, number> = {};
      donationsList.forEach(d => {
        if (d.type === 'money' && (['verified', 'completed'].includes(d.status))) {
          const name = d.orphanage_name || 'Lainnya';
          byOrphanageMap[name] = (byOrphanageMap[name] || 0) + (Number(d.amount) || 0);
        }
      });

      const byOrphanage = Object.entries(byOrphanageMap).map(([name, value]) => ({ name, value }));
      
      const monthlyTrendMap: Record<string, number> = {};
      donationsList.forEach(d => {
        if (d.type === 'money' && (['verified', 'completed'].includes(d.status))) {
          const date = new Date(d.created_at);
          const month = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
          monthlyTrendMap[month] = (monthlyTrendMap[month] || 0) + (Number(d.amount) || 0);
        }
      });

      const monthlyTrend = Object.entries(monthlyTrendMap).map(([month, amount]) => ({ month, amount }));

      res.json({
        summary: {
          totalMoney,
          totalGoods,
          totalItems: donationsList.length,
          verifiedItems: donationsList.filter(d => ['verified', 'completed'].includes(d.status)).length,
          totalTarget: (orphanages || []).reduce((sum, o) => sum + (Number(o.target_money) || 0), 0)
        },
        donations: donationsList,
        byOrphanage,
        monthlyTrend
      });
    } catch (err) {
      res.status(500).json({ error: 'Gagal membuat laporan' });
    }
  });

  app.get('/api/admin/users', adminMiddleware, async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database error' });
    
    try {
      const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      
      const enrichedUsers = await Promise.all((users || []).map(async (u: any) => {
        const { data: userDonations } = await supabase
          .from('donations')
          .select('amount, type, orphanage:orphanages(name)')
          .eq('user_id', u.id)
          .in('status', ['pending', 'verified', 'completed']);
          
        const total_donations = (userDonations || []).reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);
        const donation_count = (userDonations || []).length;
        const supported_orphanages = Array.from(new Set((userDonations || []).map((d: any) => d.orphanage?.name).filter(Boolean)));
        
        const { password, ...userWithoutPassword } = u;

        return {
          ...userWithoutPassword,
          status: u.status || (u.role === 'suspended' ? 'suspended' : 'active'),
          total_donations,
          donation_count,
          supported_orphanages
        };
      }));
      
      res.json(enrichedUsers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/users/:userId', adminMiddleware, async (req, res) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('users').select('*').eq('id', req.params.userId).single();
    if (error || !data) return res.status(404).json({ error: 'User not found' });
    const { password, ...userWithoutPassword } = data;
    res.json({
      ...userWithoutPassword,
      status: data.status || (data.role === 'suspended' ? 'suspended' : 'active')
    });
  });

  app.patch('/api/admin/users/:userId', adminMiddleware, async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database connection failed' });
    
    const { userId } = req.params;
    
    // Sanitize body to only include allowed columns
    const allowedColumns = ['name', 'email', 'role', 'status', 'bio'];
    const updatePayload: any = {};
    Object.keys(req.body).forEach(key => {
      if (allowedColumns.includes(key)) {
        updatePayload[key] = req.body[key];
      }
    });

    console.log(`[Admin] Request update user: ${userId}`, updatePayload);
    
    try {
      // 1. Resolve ID and verify existence
      let targetId: any = userId;
      let userQuery = supabase.from('users').select('id, name, email');
      
      // Handle numeric IDs vs UUIDs
      if (!isNaN(Number(userId)) && !userId.includes('-')) {
        targetId = parseInt(userId);
        userQuery = userQuery.eq('id', targetId);
      } else {
        userQuery = userQuery.eq('id', userId);
      }
      
      const { data: existingUser, error: findError } = await userQuery.maybeSingle();
      
      if (findError) {
        console.error(`[Admin] Error finding user:`, findError);
        return res.status(500).json({ error: 'Gagal mencari pengguna di database' });
      }
      
      if (!existingUser) {
        console.warn(`[Admin] User not found: ${userId}`);
        return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
      }

      console.log(`[Admin] User found, performing update on ID:`, existingUser.id);

      // 2. Perform the update
      let updateResult = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', existingUser.id);
      
      // Handle missing 'status' column error (PGRST204)
      if (updateResult.error && updateResult.error.code === 'PGRST204' && updatePayload.status) {
         console.warn(`[Admin] 'status' column missing in Supabase. Falling back to 'role' based suspension.`);
         
         const fallbackPayload = { ...updatePayload };
         delete fallbackPayload.status;
         
         // If we were trying to suspend/unsuspend, use the role column
         if (updatePayload.status === 'suspended') {
           fallbackPayload.role = 'suspended';
         } else if (updatePayload.status === 'active' && existingUser.role === 'suspended') {
           fallbackPayload.role = 'user'; // Default back to user
         }
         
         updateResult = await supabase
           .from('users')
           .update(fallbackPayload)
           .eq('id', existingUser.id);
         
         if (updateResult.error) {
            console.error(`[Admin] Fallback update attempt also failed:`, updateResult.error);
         }
      }
      
      if (updateResult.error) {
         console.error(`[Admin] Supabase Update Error! Code: ${updateResult.error.code}, Message: ${updateResult.error.message}`);
         
         let errorMessage = updateResult.error.message;
         if (updateResult.error.code === 'PGRST204') {
           errorMessage = "Kolom 'status' tidak ditemukan di database. Silakan jalankan perintah SQL berikut di Supabase Dashboard: ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';";
         }
         
         return res.status(400).json({ 
           error: errorMessage,
           code: updateResult.error.code,
           details: updateResult.error.details
         });
      }
      
      // 3. Fetch updated data to return
      // We try to select status but safely handle if it's missing
      const { data: updatedData, error: fetchErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', existingUser.id)
        .single();
      
      if (fetchErr) {
         return res.json({ id: existingUser.id, ...updatePayload });
      }

      console.log(`[Admin] User ${userId} updated successfully`);
      const virtualStatus = updatedData.status || (updatedData.role === 'suspended' ? 'suspended' : 'active');
      res.json({ ...updatedData, status: virtualStatus });
    } catch (err: any) {
      console.error(`[Admin] Critical error in update route:`, err);
      res.status(500).json({ error: err.message || 'Terjadi kesalahan sistem' });
    }
  });

  // Consolidation into the hardened PATCH route above
  app.put('/api/admin/users/:userId', adminMiddleware, async (req, res) => {
    res.status(405).json({ error: 'Use PATCH instead' });
  });

  app.post('/api/admin/users/:userId', adminMiddleware, async (req, res) => {
    res.status(405).json({ error: 'Use PATCH instead' });
  });

  app.delete('/api/admin/users/:userId', adminMiddleware, async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database error' });
    
    try {
      // First, delete all donations from this user to avoid FK constraint errors
      const { error: donationError } = await supabase.from('donations').delete().eq('user_id', req.params.userId);
      if (donationError) throw donationError;

      // Then delete the user
      const { error } = await supabase.from('users').delete().eq('id', req.params.userId);
      if (error) throw error;
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/users/:userId/donations', adminMiddleware, async (req, res) => {
    const supabase = getSupabase();
    const { data } = await supabase.from('donations').select('*, orphanage:orphanages(name)').eq('user_id', req.params.userId);
    res.json((data || []).map(d => ({ ...d, orphanage_name: d.orphanage?.name })));
  });

  app.patch('/api/admin/donations/:id', adminMiddleware, async (req, res) => {
    const supabase = getSupabase();
    const { status } = req.body;
    
    try {
      // Ambil detail donasi lama
      const { data: donation, error: getErr } = await supabase.from('donations').select('*').eq('id', req.params.id).single();
      if (getErr) throw getErr;

      const oldStatus = donation.status;
      
      // Update status donasi
      const { data: updated, error: updateErr } = await supabase.from('donations').update({ status }).eq('id', req.params.id).select().single();
      if (updateErr) throw updateErr;

      // Jika donasi uang dan status berpindah ke sukses, tambahkan saldo panti
      const isNewlyFinished = (status === 'completed' || status === 'verified') && (oldStatus !== 'completed' && oldStatus !== 'verified');
      
      if (donation.type === 'money' && isNewlyFinished) {
        const { data: orphanage } = await supabase.from('orphanages').select('current_money').eq('id', donation.orphanage_id).single();
        if (orphanage) {
          const newTotal = (Number(orphanage.current_money) || 0) + (Number(donation.amount) || 0);
          await supabase.from('orphanages').update({ current_money: newTotal }).eq('id', donation.orphanage_id);
        }
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Serve static files (Hanya untuk local development)
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    // Di Vercel, kita biarkan Vercel menangani file statis dari folder `dist` 
    // melalui rewrite di vercel.json. API handler hanya fokus pada /api/*
    console.log("[Vercel] Menjalankan mode API-only");
  }

  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  }

  return app;
}

let cachedApp: any = null;

// Mulai server secara otomatis jika tidak berada di lingkungan Vercel
if (!process.env.VERCEL) {
  console.log("[Local] Memulai server...");
  startServer().then(app => {
    cachedApp = app;
  }).catch(err => {
    console.error("[Local] Gagal memulai server:", err);
  });
}

export default async (req: any, res: any) => {
  if (!cachedApp) {
    console.log("[Vercel] Menjalankan inisialisasi server pertama kali...");
    cachedApp = await startServer();
  }
  
  // Penanganan khusus untuk Vercel: pastikan req.url dikenali oleh express router
  // Terkadang vcl-proxy mengirim URL lengkap atau berbeda
  return cachedApp(req, res);
};

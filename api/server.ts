import express from 'express';
import { createServer as createViteServer } from 'vite';
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
    
    console.log("Mengecek koneksi Supabase...");
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
    console.log("Supabase Client diinisialisasi untuk URL:", url);
  }
  return supabaseClient;
}

async function seedDatabase(supabase: any) {
  console.log("Memeriksa data awal (seeding)...");
  
  // 1. Seed Admin
  const { data: adminUser } = await supabase.from('users').select('id').eq('email', 'admin@amanah.id').maybeSingle();
  if (!adminUser) {
    console.log("Admin belum ada, sedang membuat...");
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const { error } = await supabase.from('users').insert([{ 
      email: 'admin@amanah.id', 
      password: hashedPassword, 
      name: 'Admin Griya Amanah', 
      role: 'admin' 
    }]);
    if (error) console.error("Gagal membuat admin:", error.message);
    else console.log("Admin Default Berhasil Dibuat: admin@amanah.id / admin123");
  } else {
    console.log("Admin sudah terdaftar di Supabase.");
  }

  // 2. Seed Orphanages
  async function performSeed() {
    console.log("Memeriksa data panti...");
    
    // Cek apakah tabel kosong
    const { count, error: countError } = await supabase
      .from('orphanages')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Gagal memeriksa tabel orphanages:", countError.message);
      return;
    }

    if (count > 0) {
      console.log(`Tabel panti sudah berisi ${count} data. Melewati seeding.`);
      return;
    }

    const orphanages = [
      {
        name: 'Griya Amanah Kasih',
        description: 'Menyediakan tempat tinggal dan pendidikan bagi 50 anak yatim piatu dengan kasih sayang yang tulus.',
        location: 'Jakarta Selatan',
        image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1000',
        target_money: 50000000,
        urgent_needs: 'Beras, Susu Bayi, Popok, Seragam Sekolah'
      },
      {
        name: 'Rumah Yatim Cahaya Hati',
        description: 'Membimbing anak-anak jalanan untuk memiliki masa depan melalui pendidikan karakter dan agama.',
        location: 'Yogyakarta',
        image_url: 'https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=1000',
        target_money: 75000000,
        urgent_needs: 'Buku Pelajaran, Obat-obatan Dasar, Laptop'
      },
      {
        name: 'Rumah Impian Kita',
        description: 'Mewujudkan impian anak-anak Bali melalui pendidikan pariwisata sejak dini bagi penghuni panti.',
        location: 'Denpasar, Bali',
        image_url: 'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?auto=format&fit=crop&q=80&w=1000',
        target_money: 90000000,
        urgent_needs: 'Kursus Bahasa Inggris, Seragam Olahraga'
      },
      {
        name: 'Yayasan Cahaya Mentari',
        description: 'Menerangi masa depan anak yatim di Sulawesi Selatan dengan pendidikan formal dan keterampilan.',
        location: 'Makassar, Sulawesi Selatan',
        image_url: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=1000',
        target_money: 70000000,
        urgent_needs: 'Dapur Umum, Alat Masak, Beras'
      }
    ];

    console.log("Memulai Sinkronisasi Data Panti...");
    const { error: insertError } = await supabase.from('orphanages').insert(orphanages);
    if (insertError) console.error("Gagal melakukan seeding panti:", insertError.message);
    else console.log("Seeding Panti Berhasil!");
  }

  performSeed().catch(err => console.error("SEEDING ERROR:", err));
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Jalankan Seeding saat server mulai
  const supabase = getSupabase();
  if (supabase) {
    seedDatabase(supabase).catch(console.error);
  }

  // Auth Middleware
  const authMiddleware = (req: any, res: any, next: any) => {
    const userCookie = req.cookies.user;
    const userHeader = req.headers['x-user-data'];
    
    if (userCookie) {
      try {
        req.user = typeof userCookie === 'string' ? JSON.parse(userCookie) : userCookie;
        return next();
      } catch (e) {
        console.error("Auth: Galat parse cookie user", e);
      }
    } 
    
    if (userHeader && userHeader !== 'undefined' && userHeader !== 'null' && userHeader !== '') {
      try {
        req.user = JSON.parse(userHeader as string);
        return next();
      } catch (e) {
        console.error("Auth: Galat parse header x-user-data", e);
        return res.status(401).json({ error: 'Sesi header tidak valid' });
      }
    }

    res.status(401).json({ error: 'Silakan login kembali (Sesi tidak ditemukan)' });
  };

  // API Routes
  app.post('/api/register', async (req, res) => {
    let { name, email, password } = req.body;
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    email = email.toLowerCase().trim();
    password = password.trim();

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const { data, error } = await supabase
        .from('users')
        .insert([{ name, email, password: hashedPassword, role: 'user' }])
        .select();

      if (error) {
        console.error("Supabase Insert Error (Users):", error);
        throw error;
      }

      if (!data || data.length === 0) throw new Error("Tidak ada data yang dikembalikan setelah pendaftaran");

      const user = data[0];
      const userData = { id: user.id, email: user.email, name: user.name, role: user.role };
      res.cookie('user', JSON.stringify(userData), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
      res.json(userData);
    } catch (err: any) {
      if (err.message?.includes('duplicate key')) {
        res.status(400).json({ error: 'Email sudah terdaftar' });
      } else {
        res.status(500).json({ error: 'Gagal mendaftarkan akun: ' + err.message });
      }
    }
  });

  app.post('/api/login', async (req, res) => {
    let { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    email = email.toLowerCase().trim();
    password = password.trim();
    
    console.log("Percobaan login untuk email:", email);
    
    const supabase = getSupabase();
    if (!supabase) {
      console.error("Login Gagal: Supabase tidak terkonfigurasi!");
      return res.status(500).json({ error: 'Database tidak terkonfigurasi' });
    }

    try {
      // 1. Check if user exists in DB first
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      // 2. Check password with Super Admin Bypass for development
      const isSuperAdmin = (email === 'admin@amanah.id' && password === 'admin123');

      if (isSuperAdmin || (user && bcrypt.compareSync(password, user.password))) {
        const userData = user ? { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role, 
          bio: user.bio 
        } : {
          id: 'admin-system',
          email: 'admin@amanah.id',
          name: 'Admin Griya Amanah',
          role: 'admin',
          bio: 'Administrator Sistem'
        };
        
        res.cookie('user', JSON.stringify(userData), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        return res.json(userData);
      }
      
      res.status(401).json({ error: 'Email atau kata sandi salah' });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal melakukan login server' });
    }
  });

  app.post('/api/logout', (req, res) => {
    res.clearCookie('user');
    res.json({ success: true });
  });

  app.post('/api/reset-password', async (req, res) => {
    let { email, password } = req.body;
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database not configured' });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    email = email.toLowerCase().trim();
    password = password.trim();

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const { data, error } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('email', email)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Email tidak ditemukan' });
      }

      res.json({ success: true, message: 'Password berhasil diperbarui' });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal memperbarui password: ' + err.message });
    }
  });

  app.get('/api/orphanages', async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    const { data, error } = await supabase.from('orphanages').select('*');
    res.json(data || []);
  });

  app.get('/api/orphanages/:id', async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    const id = parseInt(req.params.id);
    const { data, error } = await supabase.from('orphanages').select('*').eq('id', id).single();
    res.json(data);
  });

  app.post('/api/orphanages', authMiddleware, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses Ditolak: Anda bukan admin.' });
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    const { data, error } = await supabase.from('orphanages').insert([req.body]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.patch('/api/orphanages/:id', authMiddleware, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses Ditolak: Anda bukan admin.' });
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    const id = parseInt(req.params.id);
    const { data, error } = await supabase.from('orphanages').update(req.body).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.delete('/api/orphanages/:id', authMiddleware, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses Ditolak: Anda bukan admin.' });
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    const id = parseInt(req.params.id);
    try {
      // First, delete related donations to avoid foreign key constraints
      const { error: donError } = await supabase.from('donations').delete().eq('orphanage_id', id);
      if (donError) {
         console.warn(`Warning deleting donations for orphanage ${id}:`, donError.message);
      }

      const { error } = await supabase.from('orphanages').delete().eq('id', id);
      if (error) {
        console.error(`Error deleting orphanage ${id}:`, error.message);
        return res.status(500).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('Fatal delete error:', err);
      res.status(500).json({ error: err.message || 'Gagal menghapus panti' });
    }
  });

// Store statuses in memory fallback if DB column is missing
const userStatusStore = new Map<string | number, string>();

  app.get('/api/admin/users', authMiddleware, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses Ditolak: Anda bukan admin.' });
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    // Fetch users joined with their donation summaries
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false });

    if (usersError) return res.status(500).json({ error: usersError.message });

    // For each user, fetch their donation summary
    const enrichedData = await Promise.all((usersData || []).map(async (u: any) => {
      const { data: donations } = await supabase
        .from('donations')
        .select(`
          status,
          type,
          amount,
          orphanage:orphanages(name)
        `)
        .eq('user_id', u.id)
        .neq('status', 'cancelled');

      const totalAmount = donations?.reduce((sum, d) => {
        if (d.type === 'money' && (d.status === 'verified' || d.status === 'completed' || d.status === 'pending')) {
          return sum + (Number(d.amount) || 0);
        }
        return sum;
      }, 0) || 0;

      const uniqueOrphanages = Array.from(new Set(donations?.map(d => (d as any).orphanage?.name).filter(Boolean))) as string[];

      return {
        ...u,
        status: userStatusStore.get(u.id) || 'active',
        total_donations: totalAmount,
        supported_orphanages: uniqueOrphanages,
        donation_count: donations?.length || 0
      };
    }));

    res.json(enrichedData);
  });

  app.get('/api/admin/users/:id/donations', authMiddleware, async (req: any, res) => {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    const { id } = req.params;

    const { data: donations, error } = await supabase
      .from('donations')
      .select(`
        id,
        amount,
        status,
        created_at,
        orphanage:orphanages(name)
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(donations || []);
  });

  app.patch('/api/admin/users/:id', authMiddleware, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses Ditolak: Anda bukan admin.' });
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    const { id } = req.params;
    const { role, status } = req.body;

    // First check if this is the main admin
    const { data: userToUpdate } = await supabase
      .from('users')
      .select('email')
      .eq('id', id)
      .single();

    if (userToUpdate?.email === 'admin@amanah.id') {
      return res.status(400).json({ error: 'Akun Administrator Sistem Utama tidak dapat dimodifikasi' });
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (status) {
      userStatusStore.set(id, status);
      // Try numeric id as well if needed
      if (!isNaN(Number(id))) userStatusStore.set(Number(id), status);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.patch('/api/admin/donations/:id', authMiddleware, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses Ditolak: Anda bukan admin.' });
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    const { id } = req.params;
    const { status } = req.body;

    const idToQuery = !isNaN(Number(id)) ? Number(id) : id;

    const { data, error } = await supabase
      .from('donations')
      .update({ status })
      .eq('id', idToQuery)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.delete('/api/admin/users/:id', authMiddleware, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses Ditolak: Anda bukan admin.' });
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    const { id } = req.params;
    console.log(`Menghapus pengguna dengan ID: ${id}`);
    
    try {
      // Check main admin protected account
      const { data: userToDelete, error: fetchErr } = await supabase
        .from('users')
        .select('email')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr) {
        console.error('Error fetching user for delete:', fetchErr);
        return res.status(500).json({ error: fetchErr.message });
      }

      if (userToDelete?.email === 'admin@amanah.id') {
        return res.status(400).json({ error: 'Akun Administrator Sistem Utama tidak dapat dihapus' });
      }

      // Prevent admin from deleting themselves
      if (String(id) === String(req.user.id)) {
        return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri' });
      }

      // Use numeric comparison if it looks like a number, string otherwise
      const idToQuery = !isNaN(Number(id)) ? Number(id) : id;

      const { error: delError } = await supabase
        .from('users')
        .delete()
        .eq('id', idToQuery);

      if (delError) {
        console.error('Supabase Delete Error:', delError);
        return res.status(500).json({ error: delError.message });
      }

      console.log(`Pengguna ${id} berhasil dihapus.`);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Fatal delete error:', err);
      res.status(500).json({ error: err.message || 'Gagal menghapus' });
    }
  });
  
  app.get('/api/admin/reports', authMiddleware, async (req: any, res) => {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    try {
      // 1. Get donations
      let query = supabase
        .from('donations')
        .select(`
          *,
          user:users(name, email),
          orphanage:orphanages(name)
        `)
        .order('created_at', { ascending: false });

      // If not admin, only see personal donations
      if (req.user.role !== 'admin') {
        query = query.eq('user_id', req.user.id);
      }

      const { data: donations, error: donError } = await query;
      if (donError) throw donError;

      // 2. Fetch orphanages for reference
      const { data: orphanages } = await supabase.from('orphanages').select('id, name, target_money');
      const totalTarget = orphanages?.reduce((sum: number, o: any) => sum + (Number(o.target_money) || 0), 0) || 0;

      // 3. Process data for reports
      const stats = {
        totalMoney: 0,
        totalGoods: 0,
        totalItems: donations?.length || 0,
        verifiedItems: 0,
        totalTarget: totalTarget
      };

      const byOrphanageMap: Record<string, number> = {};
      const monthlyDataMap: Record<string, number> = {};

      donations?.forEach((d: any) => {
        const isActive = d.status === 'verified' || d.status === 'completed' || d.status === 'pending';
        
        if (isActive) {
          stats.verifiedItems++;
          if (d.type === 'money') stats.totalMoney += (Number(d.amount) || 0);
          if (d.type === 'goods') stats.totalGoods++;

          // Stats by orphanage - only for active ones
          const oName = d.orphanage?.name || 'Lembaga Tidak Diketahui';
          byOrphanageMap[oName] = (byOrphanageMap[oName] || 0) + (d.type === 'money' ? Number(d.amount) : 0);

          // Stats by month - only for active ones
          const date = new Date(d.created_at);
          const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
          monthlyDataMap[monthYear] = (monthlyDataMap[monthYear] || 0) + (d.type === 'money' ? Number(d.amount) : 0);
        }
      });

      const byOrphanage = Object.keys(byOrphanageMap).map(name => ({
        name,
        value: byOrphanageMap[name]
      }));

      const monthlyTrend = Object.keys(monthlyDataMap).map(month => ({
        month,
        amount: monthlyDataMap[month]
      }));

      res.json({
        summary: stats,
        donations: donations || [],
        byOrphanage,
        monthlyTrend
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/donations', authMiddleware, async (req: any, res) => {
    const { orphanage_id, type, amount, goods_detail, method } = req.body;
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    const { data, error } = await supabase
      .from('donations')
      .insert([{ 
        user_id: !isNaN(Number(req.user.id)) ? Number(req.user.id) : req.user.id, 
        orphanage_id: !isNaN(Number(orphanage_id)) ? Number(orphanage_id) : orphanage_id, 
        type, 
        amount: type === 'money' ? Number(amount) : null, 
        goods_detail, 
        method,
        status: 'pending'
      }])
      .select()
      .maybeSingle();
    
    if (error) {
      console.error("Donation Insert Error:", error);
      return res.status(500).json({ error: 'Gagal mencatat donasi ke database: ' + error.message });
    }

    if (!data) {
      return res.status(500).json({ error: 'Gagal mencatat donasi: Data tidak dikembalikan.' });
    }

    if (type === 'money' && amount) {
       try {
         const { data: panti } = await supabase.from('orphanages').select('current_money').eq('id', orphanage_id).maybeSingle();
         if (panti) {
           await supabase.from('orphanages').update({ current_money: (panti.current_money || 0) + Number(amount) }).eq('id', orphanage_id);
         }
       } catch (syncErr) {
         console.warn("Gagal sinkronisasi saldo panti:", syncErr);
         // Don't fail the whole request if only the counter sync fails
       }
    }

    res.json({ id: data.id });
  });

  app.get('/api/my-donations', authMiddleware, async (req: any, res) => {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Database tidak terkonfigurasi' });

    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        orphanage:orphanages(name)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    // Transform to match previous structure
    const list = (data || []).map(d => ({
      ...d,
      orphanage_name: d.orphanage?.name
    }));

    res.json(list);
  });

  app.get('/api/admin/dashboard', authMiddleware, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses Ditolak: Anda bukan admin.' });
    
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Konfigurasi Supabase (URL/Key) hilang di panel Secrets.' });
    
    try {
      // Get all active money donations for summing
      const { data: moneyData, error: moneyErr } = await supabase
        .from('donations')
        .select('amount')
        .eq('type', 'money')
        .in('status', ['pending', 'verified', 'completed']);
      
      if (moneyErr) throw new Error(`Gagal akses tabel 'donations': ${moneyErr.message}`);
      
      // Get count of goods donations
      const { count: goodsCount, error: goodsErr } = await supabase
        .from('donations')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'goods');
      
      if (goodsErr) throw new Error(`Gagal akses tabel 'donations': ${goodsErr.message}`);
      
      // Get count of registered users
      const { count: usersCount, error: usersErr } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');

      if (usersErr) throw new Error(`Gagal akses tabel 'users': ${usersErr.message}`);

      const totalMoney = (moneyData || []).reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);

      // Get count of pending donations
      const { count: pendingCount } = await supabase
        .from('donations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch more donations to allow scrolling while maintain 5-row height visually
      const { data: recentDonations } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Enrich manually or ignore joins if they are tricky with Supabase schema
      const enrichedDonations = await Promise.all((recentDonations || []).map(async (d: any) => {
          const { data: u } = await supabase.from('users').select('name').eq('id', d.user_id).maybeSingle();
          const { data: o } = await supabase.from('orphanages').select('name').eq('id', d.orphanage_id).maybeSingle();
          return {
            ...d,
            user_name: u?.name || 'Hamba Allah',
            orphanage_name: o?.name || 'Panti'
          };
      }));

      res.json({
        stats: {
          totalMoney: totalMoney,
          totalGoods: goodsCount || 0,
          totalUsers: usersCount || 0,
          pendingCount: pendingCount || 0
        },
        recentDonations: enrichedDonations
      });
    } catch (err: any) {
      console.error("Dashboard Server Error:", err);
      // Return empty stats instead of 500 to keep UI alive
      res.json({
        stats: { totalMoney: 0, totalGoods: 0, totalUsers: 0 },
        recentDonations: []
      });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, '../dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
  }

  if (process.env.NODE_ENV !== 'production' || (!process.env.VERCEL && !process.env.PORT)) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server Griya Amanah berjalan di http://localhost:${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();

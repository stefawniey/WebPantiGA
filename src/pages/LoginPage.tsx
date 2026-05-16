import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, Lock, ArrowRight, User as UserIcon, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const body = isLogin ? { email, password } : { name, email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("Gagal parse JSON dari server:", e);
        throw new Error("Respon server tidak valid");
      }

      if (response.ok) {
        onLogin(data);
        localStorage.setItem('amanah_user', JSON.stringify(data));
        navigate('/app');
      } else {
        setError(data.error || 'Terjadi kesalahan');
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.message === "Respon server tidak valid" ? "Server sedang bermasalah (500)" : 'Gagal menghubungkan ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-beige to-beige relative">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -5 }}
        className="fixed top-8 left-8 z-50"
      >
        <Link 
          to="/" 
          className="flex items-center gap-2 text-emerald-600/60 hover:text-emerald-600 hover:bg-emerald-50 transition-all font-bold text-[10px] uppercase tracking-[0.2em] group bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-emerald-100 shadow-lg shadow-emerald-900/5"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali
        </Link>
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div 
          key={isLogin ? 'login' : 'register'}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="max-w-[760px] w-full flex flex-col md:flex-row bg-white rounded-[3rem] overflow-hidden shadow-3xl border border-emerald-50"
        >
          {/* Left Side: Illustration & Motivation */}
          <div className="hidden md:flex flex-1 premium-gradient p-12 flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <Link to="/" className="flex items-center gap-2 mb-12">
                <motion.div 
                  whileHover={{ rotate: 15 }}
                  className="p-1.5 bg-white rounded-md"
                >
                  <Heart className="w-4 h-4 text-emerald-600" />
                </motion.div>
                <span className="text-xl font-display font-bold text-white tracking-tight">Griya Amanah</span>
              </Link>
              <h2 className="text-5xl font-display font-bold text-white mb-6 leading-tight">Selamat Datang di Jaringan Kebaikan.</h2>
              <p className="text-emerald-100/70 text-lg leading-relaxed text-sm">Bergabunglah dengan komunitas dermawan yang telah memberikan dampak nyata bagi pendidikan dan kesejahteraan mereka yang membutuhkan.</p>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              className="relative z-10 flex items-center gap-4 p-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl mt-12 cursor-default"
            >
               <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-emerald-900" />
               </div>
               <div className="text-sm">
                  <div className="text-white font-bold">Wujudkan Masa Depan Mereka</div>
                  <div className="text-emerald-100/60 font-medium text-xs">Setiap kontribusi Anda sangat berarti.</div>
               </div>
            </motion.div>

            {/* Abstract circles */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-600 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-900 rounded-full blur-3xl opacity-50"></div>
          </div>

          {/* Right Side: Form */}
          <div className="flex-1 p-8 md:p-12">

          <div className="w-full">
            <h1 className="text-4xl font-display font-bold text-emerald-900 mb-2">
              {isLogin ? 'Masuk' : 'Daftar'}
            </h1>
            <p className="text-emerald-800/60 mb-8 text-sm">
              {isLogin 
                ? 'Silakan masuk untuk melanjutkan kontribusi Anda.' 
                : 'Mulai perjalanan kebaikan Anda dengan mendaftarkan akun baru.'}
            </p>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm mb-6 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                {error}
              </motion.div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-900 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-beige/50 border border-emerald-100/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-medium text-emerald-900 placeholder:text-emerald-900/30"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-900 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-beige/50 border border-emerald-100/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-medium text-emerald-900 placeholder:text-emerald-900/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                   <label className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Kata Sandi</label>
                   {isLogin && <Link to="/forgot-password" virtual="true" className="text-xs font-bold text-emerald-600 hover:underline">Lupa Kata Sandi?</Link>}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-beige/50 border border-emerald-100/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-medium text-emerald-900 placeholder:text-emerald-900/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-600/40 hover:text-emerald-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isLogin ? 'Masuk Sekarang' : 'Daftar Sekarang'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-emerald-100 text-center">
               <p className="text-emerald-800/60 text-sm">
                 {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
                 <button 
                   onClick={() => setIsLogin(!isLogin)}
                   className="ml-2 font-bold text-emerald-600 hover:underline"
                 >
                   {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
                 </button>
               </p>
            </div>
            

          </div>
        </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

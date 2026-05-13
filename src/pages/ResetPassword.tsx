import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');

    if (!email) {
      alert('Email tidak ditemukan. Silakan kembali ke halaman lupa password.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Kata sandi tidak cocok!');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert(data.error || 'Gagal memperbarui kata sandi');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsLoading(false);
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
          to="/login" 
          className="flex items-center gap-2 text-emerald-600/60 hover:text-emerald-600 hover:bg-emerald-50 transition-all font-bold text-[10px] uppercase tracking-[0.2em] group bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-emerald-100 shadow-lg shadow-emerald-900/5"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Halaman Masuk
        </Link>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-[450px] w-full bg-white rounded-[2.5rem] overflow-hidden shadow-3xl border border-emerald-50 p-8 md:p-12"
      >
        {!isSubmitted ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-emerald-900 mb-2">Atur Ulang Kata Sandi</h1>
              <p className="text-emerald-800/60 text-sm">
                Silakan buat kata sandi baru yang kuat untuk keamanan akun Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-emerald-800 mb-2 ml-1">Kata Sandi Baru</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-600/40 group-focus-within:text-emerald-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-900/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-emerald-800 mb-2 ml-1">Konfirmasi Kata Sandi</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-600/40 group-focus-within:text-emerald-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-900/20"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Simpan Kata Sandi
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-emerald-900 mb-3">Berhasil!</h2>
            <p className="text-emerald-800/60 text-sm mb-8">
              Kata sandi Anda telah berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
            >
              Masuk Sekarang
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;

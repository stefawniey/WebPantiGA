import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
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
              <h1 className="text-3xl font-display font-bold text-emerald-900 mb-2">Lupa Kata Sandi?</h1>
              <p className="text-emerald-800/60 text-sm">
                Jangan khawatir. Masukkan email Anda dan kami akan mengirimkan instruksi untuk mengatur ulang kata sandi Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-emerald-800 mb-2 ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-600/40 group-focus-within:text-emerald-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-900/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    Kirim Instruksi
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
            <h2 className="text-2xl font-display font-bold text-emerald-900 mb-3">Email Terkirim</h2>
            <p className="text-emerald-800/60 text-sm mb-8">
              Kami telah mengirimkan instruksi pengaturan ulang kata sandi ke {email}. Silakan periksa kotak masuk atau folder spam Anda.
            </p>
            <Link 
              to={`/reset-password?email=${encodeURIComponent(email)}`} 
              className="text-emerald-600 font-bold hover:underline"
            >
              Simulasi Atur Ulang Kata Sandi (Klik di sini)
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

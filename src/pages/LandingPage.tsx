import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, ShieldCheck, TrendingUp, ArrowRight, Home, Users, Gift, DollarSign } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-beige selection:bg-emerald-200">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Heart className="w-6 h-6 text-white text-emerald-100" />
            </div>
            <span className="text-2xl font-display font-bold text-emerald-900">Griya Amanah</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-medium text-emerald-800">
            <a href="#impact" className="hover:text-emerald-600 transition-colors hover:scale-110 duration-200">Dampak</a>
            <a href="#featured" className="hover:text-emerald-600 transition-colors hover:scale-110 duration-200">Program Kebaikan</a>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/login" 
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 block font-bold"
              >
                Masuk
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 lg:pt-48 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-6"
              >
                <Users className="w-4 h-4" />
                Dukungan Kemanusiaan Terpercaya
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-emerald-900 leading-[1.1] tracking-tighter mb-8"
              >
                Kebaikan Kecil Anda, <span className="text-emerald-600">Terang Bagi Masa Depan.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-emerald-800/80 mb-10 max-w-xl leading-relaxed"
              >
                Griya Amanah memfasilitasi niat baik Anda untuk mendukung ekosistem kebaikan melalui sistem donasi yang transparan, aman, dan tepat sasaran.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap gap-4"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/login" className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100/50 flex items-center gap-2 group">
                    Salurkan Bantuan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <a href="#impact" className="px-8 py-4 bg-white text-emerald-900 font-bold rounded-2xl border border-emerald-100/50 hover:bg-emerald-50 transition-all block">
                    Pelajari Dampak
                  </a>
                </motion.div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 w-full aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white/50 rotate-3 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop" 
                  className="w-full h-full object-cover"
                  alt="Dampak Donasi"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-emerald-900/10"></div>
              </div>
              
              {/* Floating badges */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-6 -left-6 glass p-4 rounded-2xl flex items-center gap-3 z-20 shadow-xl"
              >
                 <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-emerald-900">
                    <Heart className="w-6 h-6" />
                 </div>
                 <div className="text-xs font-bold text-emerald-900">Penyaluran<br/>Transparan</div>
              </motion.div>

              {/* Decorative Blur Background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-200/30 rounded-full blur-3xl -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-24 bg-white border-y border-emerald-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
             <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Ringkasan Dampak</div>
             <h2 className="text-4xl font-display font-black text-emerald-900">Transformasi Nyata dari Kepedulian Anda</h2>
             <p className="text-emerald-800/60 font-medium leading-relaxed">Setiap bantuan yang Anda salurkan menjadi harapan bagi masa depan mereka.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: DollarSign, label: 'Total Penyaluran', value: 'Terverifikasi', desc: 'Dana pembangunan dan operasional mitra' },
              { icon: Users, label: 'Lembaga Mitra', value: 'Aktif', desc: 'Lembaga resmi yang telah terverifikasi' },
              { icon: Heart, label: 'Penerima Manfaat', value: 'Tersalurkan', desc: 'Mendapat akses nutrisi dan pendidikan' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="text-center group cursor-default"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2">{stat.label}</div>
                <div className="text-4xl font-display font-black text-emerald-900 mb-2">{stat.value}</div>
                <div className="text-emerald-800/60">{stat.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section id="featured" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-16">
            <div>
              <div className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4">Program Prioritas</div>
              <h2 className="text-5xl font-display font-black text-emerald-900">Bantu Mereka Hari Ini</h2>
            </div>
            <Link to="/login" className="hidden md:flex items-center gap-2 text-emerald-600 font-bold hover:underline">
              Telusuri Semua Program <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <motion.div 
               whileHover={{ y: -10 }}
               className="group relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl"
             >
                <img src="https://images.unsplash.com/photo-1540479859555-17af45c78602?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Program Kebaikan 1" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900 via-emerald-900/40 to-transparent p-12 flex flex-col justify-end">
                  <span className="inline-block px-3 py-1 rounded-full bg-gold text-emerald-900 text-[10px] font-bold uppercase mb-4 w-fit">Kebutuhan Mendesak</span>
                  <h3 className="text-3xl font-display font-bold text-white mb-2">Griya Amanah Kasih</h3>
                  <p className="text-emerald-50/80 mb-6 line-clamp-2">Memerlukan bantuan bahan pangan dan perlengkapan dasar untuk binaan kami.</p>
                  <Link to="/login" className="w-full py-4 bg-white text-emerald-900 text-center font-bold rounded-2xl hover:bg-emerald-50 transition-colors">
                    Donasi Sekarang
                  </Link>
                </div>
             </motion.div>

             <motion.div 
               whileHover={{ y: -10 }}
               className="group relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl"
             >
                <img src="https://images.unsplash.com/photo-1594708767771-a7502209ff51?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Program Kebaikan 2" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900 via-emerald-900/40 to-transparent p-12 flex flex-col justify-end">
                  <h3 className="text-3xl font-display font-bold text-white mb-2">Program Cahaya Hati</h3>
                  <p className="text-emerald-50/80 mb-6 line-clamp-2">Berfokus pada pengembangan kemandirian melalui program pendidikan khusus.</p>
                  <Link to="/login" className="w-full py-4 bg-emerald-600 text-white text-center font-bold rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/40 border border-emerald-500">
                    Donasi Sekarang
                  </Link>
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="premium-gradient rounded-[4rem] p-16 md:p-32 text-center relative overflow-hidden shadow-3xl">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight">Kebaikan Dimulai dari Tindakan Anda.</h2>
              <p className="text-xl text-emerald-100/80 mb-12 max-w-2xl mx-auto">Mari bergabung bersama ribuan donatur lainnya untuk mewujudkan mimpi mereka yang membutuhkan di seluruh Indonesia.</p>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Link to="/login" className="px-12 py-6 bg-gold text-emerald-900 text-xl font-black rounded-3xl hover:bg-[#E5C14F] transition-all shadow-2xl block">
                  Mari Berkontribusi Sekarang
                </Link>
              </motion.div>
            </div>
            
            {/* Background pattern - Improved floating hearts */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
               <motion.div 
                 animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
                 transition={{ duration: 5, repeat: Infinity }}
                 className="absolute -top-10 -left-10 text-white"
               >
                 <Heart className="w-64 h-64 blur-2xl" />
               </motion.div>
               <motion.div 
                 animate={{ y: [0, 20, 0], opacity: [0.2, 0.4, 0.2] }}
                 transition={{ duration: 7, repeat: Infinity, delay: 1 }}
                 className="absolute -bottom-20 -right-20 text-white"
               >
                 <Heart className="w-96 h-96 blur-3xl" />
               </motion.div>
               <motion.div 
                 animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                 transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                 className="absolute top-1/2 left-1/4 text-white"
               >
                 <Heart className="w-32 h-32 blur-xl" />
               </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-emerald-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="text-emerald-800/60 text-sm font-medium">
            © 2026 Griya Amanah. Dibuat dengan cinta untuk kemanusiaan di seluruh Indonesia.
          </div>
        </div>
      </footer>
    </div>
  );
}

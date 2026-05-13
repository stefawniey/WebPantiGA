import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Wallet, Gift, ChevronRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Donation, Orphanage } from '../types';
import { formatToWIB, formatTimeWIB } from '../utils';
import DonationReceiptModal from '../components/DonationReceiptModal';

export default function Dashboard() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [orphanages, setOrphanages] = useState<Orphanage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('amanah_user');
    const headers: any = {};
    if (savedUser) headers['x-user-data'] = savedUser;

    Promise.all([
      fetch('/api/my-donations', { headers }).then(res => res.json()),
      fetch('/api/orphanages').then(res => res.json())
    ]).then(([d, o]) => {
      setDonations(d);
      setOrphanages(o);
      setLoading(false);
    });
  }, []);

  const donationList = Array.isArray(donations) 
    ? [...donations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  const handleDonationClick = (donation: Donation) => {
    setSelectedDonation(donation);
    setIsReceiptOpen(true);
  };

  const totalDonation = donationList
    .filter(d => d.type === 'money' && (d.status === 'completed' || d.status === 'pending' || d.status === 'verified'))
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-48 bg-emerald-100 rounded-[2rem]"></div>
    <div className="grid grid-cols-2 gap-8"><div className="h-40 bg-emerald-50 rounded-2xl"></div><div className="h-40 bg-emerald-50 rounded-2xl"></div></div>
  </div>;

  return (
    <div className="space-y-8 pb-12">
      {/* ... (keeping existing layout) */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="premium-gradient rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-200"
      >
        <div className="relative z-10 text-center md:text-left">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-5xl font-display font-black mb-4 tracking-tight"
          >
            Sinergi Kebaikan, <br className="hidden md:block" /><span className="text-emerald-300">Dua Juta Harapan.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-emerald-100/70 max-w-lg mb-10 font-medium leading-relaxed"
          >
            Setiap kontribusi Anda adalah langkah nyata dalam memberdayakan masyarakat dan membangun ekosistem kemanusiaan yang mandiri.
          </motion.p>
          
          <div className="flex flex-wrap gap-8 justify-center md:justify-start">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Saldo Terhimpun</div>
              <div className="text-4xl font-display font-black tracking-tighter">Rp{(totalDonation.toLocaleString('id-ID'))}</div>
            </motion.div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
            >
               <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Logistik Tersalurkan</div>
               <div className="text-4xl font-display font-black tracking-tighter">{donationList.filter(d => d.type === 'goods').length} <span className="text-lg font-bold text-emerald-300">Unit</span></div>
            </motion.div>
          </div>
        </div>

        {/* Dynamic Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-display font-bold text-emerald-900">Aktivitas Terbaru</h3>
            <motion.div whileHover={{ scale: 1.1, x: -5 }} whileTap={{ scale: 0.9 }}>
              <Link to="/app/my-donations" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full transition-colors block">
                Lihat Semua
              </Link>
            </motion.div>
          </div>
          
          <div className="space-y-4">
            {donationList.length > 0 ? donationList.slice(0, 3).map((d) => (
              <motion.div 
                key={d.id}
                initial={{ opacity: 0, x: -10 }}
                whileHover={{ scale: 1.02, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleDonationClick(d)}
                className="glass p-5 rounded-3xl flex items-center gap-4 group hover:bg-white transition-shadow shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${d.type === 'money' ? 'bg-emerald-50 text-emerald-600' : 'bg-gold/10 text-gold'}`}>
                  {d.type === 'money' ? <Wallet className="w-6 h-6" /> : <Gift className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-emerald-900 group-hover:text-emerald-700">{d.orphanage_name}</div>
                  <div className="text-xs text-emerald-800/60 font-medium">
                    {d.type === 'money' ? `Kontribusi Rp${d.amount?.toLocaleString('id-ID')}` : d.goods_detail}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${
                    d.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {d.status === 'completed' ? 'Selesai' : 
                     d.status === 'pending' ? 'Tertunda' : 
                     d.status === 'verified' ? 'Terverifikasi' : d.status}
                  </span>
                  <div className="text-[10px] text-emerald-800/40 mt-1 font-bold">
                    {formatToWIB(d.created_at, { day: 'numeric', month: 'short', year: 'numeric' })} • {formatTimeWIB(d.created_at)}
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="p-10 text-center glass rounded-3xl">
                <Heart className="w-12 h-12 text-emerald-100 mx-auto mb-4" />
                <p className="text-emerald-800/40 font-bold">Belum ada kontribusi. Mulai langkah pertama Anda!</p>
              </div>
            )}
          </div>
        </div>

        {/* Featured Programs / Urgent Needs */}
        <div className="space-y-6">
          <h3 className="text-xl font-display font-bold text-emerald-900 px-4">Program Prioritas</h3>
          <div className="space-y-4">
            {orphanages
              .map(o => ({
                ...o,
                is_urgent: o.urgent_needs?.startsWith('[URGENT]') || o.urgent_needs?.startsWith('[MENDESAK]'),
                clean_needs: o.urgent_needs?.replace('[URGENT] ', '').replace('[MENDESAK] ', '')
              }))
              .filter(o => o.is_urgent)
              .slice(0, 3) // Tampilkan maksimal 3 program mendesak
              .map((o) => (
                <motion.div
                  key={o.id}
                  whileHover={{ scale: 1.03, y: -5 }}
                >
                  <Link 
                    to={`/app/orphanage/${o.id}`}
                    className="block group"
                  >
                    <div className="glass rounded-[2rem] overflow-hidden p-4 group-hover:bg-white transition-shadow shadow-sm hover:shadow-xl">
                      <div className="h-32 rounded-[1.5rem] overflow-hidden mb-4 relative">
                        <img src={o.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={o.name} referrerPolicy="no-referrer" />
                        <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-[9px] font-black uppercase rounded shadow-lg">Mendesak</div>
                      </div>
                      <h4 className="font-bold text-emerald-900 mb-1">{o.name}</h4>
                      <p className="text-xs text-emerald-800/60 font-medium line-clamp-1 mb-4">{o.clean_needs || o.urgent_needs}</p>
                      
                      {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-emerald-700">
                         <span>Progres Dana</span>
                         <span className="bg-emerald-50 px-1.5 py-0.5 rounded-md">{Math.round((o.current_money / o.target_money) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${(o.current_money / o.target_money) * 100}%` }}
                           className="h-full bg-emerald-600 rounded-full"
                         />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <DonationReceiptModal 
        donation={selectedDonation}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
}

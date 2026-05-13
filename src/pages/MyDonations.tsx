import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Wallet, Gift, Search, Calendar } from 'lucide-react';
import { Donation } from '../types';
import { formatToWIB, formatTimeWIB } from '../utils';
import DonationReceiptModal from '../components/DonationReceiptModal';

export default function MyDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('amanah_user');
    const headers: any = {};
    if (savedUser) headers['x-user-data'] = savedUser;

    fetch('/api/my-donations', { headers }).then(res => res.json()).then(data => {
      setDonations(data);
      setLoading(false);
    });
  }, []);

  const donationList = Array.isArray(donations) ? donations : [];

  const handleDonationClick = (donation: Donation) => {
    setSelectedDonation(donation);
    setIsReceiptOpen(true);
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-4xl font-display font-black text-emerald-900 mb-2">Riwayat Donasi</h1>
           <p className="text-emerald-800/60 font-medium">Jejak kebaikan yang telah Anda tebarkan melalui berbagai program.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
           {[1,2,3].map(i => <div key={i} className="h-24 bg-emerald-100 animate-pulse rounded-3xl"></div>)}
        </div>
      ) : (
        <div className="space-y-6">
          {donationList.length > 0 ? (
            donationList.map((d, index) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleDonationClick(d)}
                className="glass p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 group hover:bg-white transition-all border-none cursor-pointer"
              >
                <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg ${
                  d.type === 'money' ? 'bg-emerald-50 text-emerald-600' : 'bg-gold/10 text-gold shadow-gold/10'
                }`}>
                  {d.type === 'money' ? <Wallet className="w-10 h-10" /> : <Gift className="w-10 h-10" />}
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-2">
                   <div className="text-xs font-bold text-emerald-800/40 uppercase tracking-widest">Penerima Manfaat</div>
                   <h3 className="text-2xl font-display font-bold text-emerald-900 group-hover:text-emerald-600 transition-colors">{d.orphanage_name}</h3>
                   <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm font-medium text-emerald-800/60">
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatToWIB(d.created_at)} • {formatTimeWIB(d.created_at)}</div>
                   </div>
                </div>

                <div className="h-12 w-[1px] bg-emerald-100 hidden md:block"></div>

                <div className="space-y-2 text-center md:text-right min-w-[150px]">
                   <div className="text-xs font-bold text-emerald-800/40 uppercase tracking-widest">Detail & Status</div>
                   <div className="text-xl font-black text-emerald-900">
                      {d.type === 'money' ? `Rp${(d.amount || 0).toLocaleString('id-ID')}` : 'Bantuan Barang'}
                   </div>
                   {d.type === 'goods' && <div className="text-xs font-bold text-emerald-800/60 truncate max-w-[200px]">{d.goods_detail}</div>}
                   <div className="mt-2">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        d.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                        d.status === 'verified' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {d.status === 'completed' ? 'Selesai' : d.status === 'verified' ? 'Terverifikasi' : 'Tertunda'}
                      </span>
                   </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-24 text-center glass rounded-[3rem]">
               <Heart className="w-20 h-20 text-emerald-100 mx-auto mb-8" />
               <h3 className="text-2xl font-display font-bold text-emerald-900 mb-2">Belum Ada Riwayat Donasi</h3>
               <p className="text-emerald-800/60 font-medium mb-8">Bantu lembaga mitra pertama Anda hari ini!</p>
               <button className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl">Telusuri Program Sekarang</button>
            </div>
          )}
        </div>
      )}
      <DonationReceiptModal 
        donation={selectedDonation}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
}

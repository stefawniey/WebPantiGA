import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MapPin, 
  ChevronLeft, 
  ShieldCheck, 
  Target, 
  Wallet, 
  Gift, 
  ChevronRight,
  Info,
  CheckCircle2,
  CreditCard,
  Smartphone,
  QrCode,
  Truck,
  Package,
  Navigation,
  X
} from 'lucide-react';
import { Orphanage } from '../types';
import confetti from 'canvas-confetti';

export default function OrphanageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orphanage, setOrphanage] = useState<Orphanage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationType, setDonationType] = useState<'money' | 'goods'>('money');
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');

  const formatRupiah = (value: string) => {
    const number = value.replace(/\D/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setAmount(rawValue);
    setDisplayAmount(formatRupiah(rawValue));
  };
  const [goodsDetail, setGoodsDetail] = useState('');
  const [method, setMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');

  const openDonationModal = (type: 'money' | 'goods') => {
    if (userRole === 'admin') {
      navigate('/app/reports');
      return;
    }
    setDonationType(type);
    setAmount('');
    setDisplayAmount('');
    setGoodsDetail('');
    setMethod('');
    setShowDonationModal(true);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('amanah_user');
    if (savedUser) {
      setUserRole(JSON.parse(savedUser).role);
    }
    fetch(`/api/orphanages/${id}`)
      .then(res => res.json())
      .then(data => {
          if (data) {
            const isUrgent = data.urgent_needs?.startsWith('[URGENT]') || data.urgent_needs?.startsWith('[MENDESAK]');
            setOrphanage({
              ...data,
              is_urgent: isUrgent,
              urgent_needs: isUrgent 
                ? data.urgent_needs.replace('[URGENT] ', '').replace('[MENDESAK] ', '') 
                : data.urgent_needs
            });
          }
        setLoading(false);
      });
  }, [id]);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (donationType === 'money' && !amount) {
      alert('Silakan masukkan nominal donasi');
      return;
    }
    
    if (donationType === 'goods' && !goodsDetail) {
      alert('Silakan isi detail barang bantuan');
      return;
    }

    if (!method) {
      alert('Silakan pilih metode pembayaran/pengiriman terlebih dahulu');
      return;
    }

    setSubmitting(true);
    
    try {
       const userStr = localStorage.getItem('amanah_user');
       const response = await fetch('/api/donations', {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json',
           'x-user-data': userStr || ''
         },
         body: JSON.stringify({
           orphanage_id: Number(id),
           type: donationType,
           amount: donationType === 'money' ? Number(amount) : null,
           goods_detail: donationType === 'goods' ? goodsDetail : null,
           method
         })
       });

       const result = await response.json();

       if (response.ok) {
         setSuccess(true);
         try {
           confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#10b981', '#059669', '#34d399']
           });
         } catch (confettiErr) {
           console.warn("Confetti error", confettiErr);
         }
         
         setTimeout(() => {
           setShowDonationModal(false);
           setSuccess(false);
           navigate('/app/my-donations');
         }, 3000);
       } else {
         console.error("Donation Error Response:", result);
         alert(result.error || 'Gagal memproses kontribusi. Silakan coba masuk kembali.');
       }
    } catch (err) {
       console.error("Fetch Catch Error:", err);
       alert('Terjadi kendala saat menghubungi server. Pastikan koneksi aman.');
    } finally {
       setSubmitting(false);
    }
  };

  if (loading || !orphanage) return <div className="animate-pulse flex items-center justify-center p-20">
    <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
  </div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <motion.button 
        whileHover={{ opacity: 0.8 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-emerald-800/60 hover:text-emerald-900 font-bold group w-fit transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        Kembali
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl relative border-8 border-white">
             <img src={orphanage.image_url} className="w-full h-full object-cover" alt={orphanage.name} referrerPolicy="no-referrer" />
             <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur rounded-full text-xs font-bold text-emerald-700 flex items-center gap-2 shadow-xl">
                <ShieldCheck className="w-4 h-4" /> Terverifikasi
             </div>
          </div>
          
          <div className="glass rounded-[2rem] p-8 space-y-6">
             <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-800/60 uppercase tracking-widest">{orphanage.location}</span>
             </div>
             <h1 className="text-4xl font-display font-black text-emerald-900 leading-tight">{orphanage.name}</h1>
             <p className="text-emerald-800/80 leading-relaxed font-medium">
               {orphanage.description}
             </p>
             
             <div className="p-6 bg-red-50 border border-red-100 rounded-2xl">
                <div className="flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-widest mb-3">
                   <Info className="w-4 h-4" /> Kebutuhan Mendesak
                </div>
                <div className="text-sm font-bold text-emerald-900 leading-relaxed">
                   {orphanage.urgent_needs}
                </div>
             </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
           {/* Progress Card */}
           <div className="premium-gradient rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-8 uppercase text-[10px] font-black tracking-widest text-emerald-300">
                    <Target className="w-4 h-4" /> Target Penggalangan Dana
                 </div>
                 
                 <div className="flex justify-between items-end mb-4">
                    <div>
                      <div className="text-sm font-bold text-emerald-100/60 mb-1">Terkumpul</div>
                      <div className="text-4xl font-display font-black">Rp{orphanage.current_money.toLocaleString('id-ID')}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-4xl font-display font-black">{Math.round((orphanage.current_money / orphanage.target_money) * 100)}%</div>
                       <div className="text-xs font-bold text-emerald-200">Menuju Target</div>
                    </div>
                 </div>

                 <div className="h-4 bg-emerald-900/40 rounded-full overflow-hidden mb-6 border border-white/10">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${Math.min((orphanage.current_money / orphanage.target_money) * 100, 100)}%` }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       className="h-full bg-gold rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    />
                 </div>
                 
                 <div className="text-sm font-bold text-emerald-100/60 flex justify-between">
                    <span>Target Dana: Rp{orphanage.target_money.toLocaleString('id-ID')}</span>
                    <span>{orphanage.target_money - orphanage.current_money > 0 ? `Kebutuhan Belum Terpenuhi: Rp${(orphanage.target_money - orphanage.current_money).toLocaleString('id-ID')}` : 'Target Dana Tercapai!'}</span>
                 </div>
              </div>
              
              {/* Decorative circle */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
           </div>

           <div className="glass rounded-[3rem] p-10 space-y-8">
              <h3 className="text-2xl font-display font-bold text-emerald-900">
                {userRole === 'admin' ? 'Pemantauan Distribusi' : 'Salurkan Kontribusi Anda'}
              </h3>
              <p className="text-emerald-800/60 font-medium">
                {userRole === 'admin' 
                  ? `Pantau dan kelola alur bantuan yang masuk untuk ${orphanage.name} secara waktu nyata.` 
                  : `Pilih jenis kontribusi yang ingin Anda berikan untuk mendukung masa depan mereka yang membutuhkan di ${orphanage.name}.`}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button 
                   onClick={() => openDonationModal('money')}
                   className={`p-8 bg-white border border-emerald-100 rounded-[2rem] transition-all text-left group hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-100 cursor-pointer`}
                 >
                    <div className={`w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 transition-colors group-hover:bg-emerald-600 group-hover:text-white`}>
                       <Wallet className="w-7 h-7" />
                    </div>
                    <div className="font-bold text-emerald-900 text-lg mb-1">
                      {userRole === 'admin' ? 'Laporan Keuangan' : 'Kontribusi Tunai'}
                    </div>
                    <div className="text-xs text-emerald-800/60 font-medium leading-relaxed">
                      {userRole === 'admin' ? 'Verifikasi laporan saldo dan mutasi dana operasional lembaga.' : 'Bantuan dana tunai bagi operasional serta pendidikan mereka yang membutuhkan.'}
                    </div>
                 </button>

                 <button 
                   onClick={() => openDonationModal('goods')}
                   className={`p-8 bg-white border border-emerald-100 rounded-[2rem] transition-all text-left group hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-100 cursor-pointer`}
                 >
                    <div className={`w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-6 transition-colors group-hover:bg-gold group-hover:text-white`}>
                       <Gift className="w-7 h-7" />
                    </div>
                    <div className="font-bold text-emerald-900 text-lg mb-1">
                      {userRole === 'admin' ? 'Inventaris Logistik' : 'Kontribusi Logistik'}
                    </div>
                    <div className="text-xs text-emerald-800/60 font-medium leading-relaxed">
                      {userRole === 'admin' ? 'Kontrol ketersediaan stok pangan dan kebutuhan fisik lembaga mitra.' : 'Berikan bantuan berupa pakaian, buku, sembako, atau kebutuhan lainnya.'}
                    </div>
                 </button>
              </div>
           </div>
        </motion.div>
      </div>

      {/* Donation Modal */}
      <AnimatePresence>
        {showDonationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => !submitting && !success && setShowDonationModal(false)}
               className="absolute inset-0 bg-emerald-900/60 backdrop-blur-sm"
             />
             
             <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-4xl overflow-y-auto max-h-[90vh] custom-scrollbar"
             >
                {success ? (
                  <div className="p-16 text-center space-y-6">
                     <motion.div 
                       initial={{ scale: 0 }}
                       animate={{ scale: 1 }}
                       className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8"
                     >
                        <CheckCircle2 className="w-12 h-12" />
                     </motion.div>
                     <h2 className="text-3xl font-display font-black text-emerald-900">Kontribusi Berhasil Terkirim!</h2>
                     <p className="text-emerald-800/60 font-medium">Terima kasih atas kedermawanan Anda. Penyaluran Anda akan segera kami verifikasi di sistem.</p>
                     <p className="text-xs text-emerald-500 font-bold animate-pulse italic">Sedang mengalihkan ke halaman riwayat...</p>
                  </div>
                ) : (
                  <form onSubmit={handleDonate} className="p-10 space-y-8">
                     <div className="flex justify-between items-start">
                        <div>
                           <h2 className="text-2xl font-display font-bold text-emerald-900">
                              {donationType === 'money' ? 'Kontribusi Tunai' : 'Kontribusi Logistik'}
                           </h2>
                           <p className="text-sm text-emerald-800/60 font-medium">Anda menyalurkan bantuan untuk {orphanage.name}</p>
                        </div>
                        <motion.button 
                          type="button" 
                          whileHover={{ rotate: 180, scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowDonationModal(false)}
                          className="w-10 h-10 bg-emerald-50 text-emerald-900 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors shadow-sm"
                        >
                           <X className="w-5 h-5" />
                        </motion.button>
                     </div>

                     <div className="space-y-6">
                        {donationType === 'money' ? (
                          <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-emerald-900 uppercase tracking-widest ml-1">Nominal Donasi (Rp)</label>
                                <input 
                                  type="text" 
                                  required
                                  value={displayAmount}
                                  onChange={handleAmountChange}
                                  className="w-full px-6 py-4 bg-beige/50 border border-emerald-100 rounded-2xl focus:outline-none focus:border-emerald-600 font-display text-xl font-bold"
                                />
                             </div>
                             <div className="space-y-4">
                                <label className="text-xs font-bold text-emerald-900 uppercase tracking-widest ml-1">Metode Pembayaran</label>
                                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                                   {/* QRIS First */}
                                   <button
                                     type="button"
                                     onClick={() => setMethod('QRIS')}
                                     className={`col-span-2 p-5 rounded-2xl flex items-center gap-4 transition-all border-2 text-left group ${method === 'QRIS' ? 'border-emerald-600 bg-emerald-50' : 'border-emerald-100 bg-white hover:border-emerald-300'}`}
                                   >
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${method === 'QRIS' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'}`}>
                                         <QrCode className="w-6 h-6" />
                                      </div>
                                      <div>
                                         <div className="font-bold text-emerald-900 text-sm">QRIS (Griya Amanah)</div>
                                         <div className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-wider">Bayar Instan Lewat Aplikasi Apapun</div>
                                      </div>
                                      {method === 'QRIS' && <CheckCircle2 className="w-6 h-6 text-emerald-600 ml-auto" />}
                                   </button>

                                   <div className="col-span-2 flex items-center gap-3 py-2">
                                      <div className="h-[1px] flex-1 bg-emerald-100"></div>
                                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-800/20">Transfer Bank</span>
                                      <div className="h-[1px] flex-1 bg-emerald-100"></div>
                                   </div>

                                   {[
                                     { id: 'Transfer Bank BCA', name: 'Bank BCA' },
                                     { id: 'Transfer Bank Mandiri', name: 'Bank Mandiri' },
                                     { id: 'Transfer Bank BNI', name: 'Bank BNI' },
                                     { id: 'Transfer Bank BRI', name: 'Bank BRI' },
                                     { id: 'Transfer Bank DKI', name: 'Bank DKI' },
                                   ].map(item => (
                                     <button
                                       key={item.id}
                                       type="button"
                                       onClick={() => setMethod(item.id)}
                                       className={`p-4 rounded-2xl flex items-center gap-3 transition-all border-2 text-left group ${method === item.id ? 'border-emerald-600 bg-emerald-50' : 'border-emerald-100 bg-white hover:border-emerald-300'}`}
                                     >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${method === item.id ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'}`}>
                                           <CreditCard className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-emerald-900 text-xs leading-tight">{item.name}</span>
                                     </button>
                                   ))}

                                   <div className="col-span-2 flex items-center gap-3 py-2">
                                      <div className="h-[1px] flex-1 bg-emerald-100"></div>
                                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-800/20">Dompet Digital</span>
                                      <div className="h-[1px] flex-1 bg-emerald-100"></div>
                                   </div>

                                   {[
                                     { id: 'GoPay', name: 'GoPay' },
                                     { id: 'OVO', name: 'OVO' },
                                     { id: 'Dana', name: 'Dana' },
                                     { id: 'LinkAja', name: 'LinkAja' },
                                     { id: 'ShopeePay', name: 'ShopeePay' },
                                   ].map(item => (
                                     <button
                                       key={item.id}
                                       type="button"
                                       onClick={() => setMethod(item.id)}
                                       className={`p-4 rounded-2xl flex items-center gap-3 transition-all border-2 text-left group ${method === item.id ? 'border-emerald-600 bg-emerald-50' : 'border-emerald-100 bg-white hover:border-emerald-300'}`}
                                     >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${method === item.id ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'}`}>
                                           <Smartphone className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-emerald-900 text-xs leading-tight">{item.name}</span>
                                     </button>
                                   ))}
                                </div>
                             </div>

                             {/* QRIS Display */}
                             {method === 'QRIS' && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-4 p-6 bg-white border-2 border-dashed border-emerald-200 rounded-3xl text-center space-y-4"
                                >
                                   <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/40">Scan QRIS Berikut</div>
                                   <div className="text-lg font-display font-black text-emerald-900">GRIYA AMANAH</div>
                                   <div className="w-48 h-48 bg-emerald-50 rounded-2xl mx-auto flex items-center justify-center p-4 shadow-inner">
                                      {/* QR Code Placeholder Graphic */}
                                      <div className="relative w-full h-full border-4 border-emerald-900/10 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                                         <div className="grid grid-cols-4 gap-1 opacity-20">
                                            {Array.from({ length: 64 }).map((_, i) => (
                                               <div key={i} className={`w-1 h-1 bg-emerald-900 ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`} />
                                            ))}
                                         </div>
                                         <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 bg-white p-1 rounded-sm shadow-sm">
                                               <div className="w-full h-full bg-emerald-600 rounded-[2px]" />
                                            </div>
                                         </div>
                                      </div>
                                   </div>
                                   <div className="text-[9px] font-bold text-emerald-800/40 px-6">
                                      Pastikan nama merchant adalah <span className="text-emerald-900">Griya Amanah</span> saat melakukan pembayaran.
                                   </div>
                                </motion.div>
                             )}
                          </div>
                        ) : (
                              <div className="space-y-4">
                                 <div className="space-y-2">
                                    <label className="text-xs font-bold text-emerald-900 uppercase tracking-widest ml-1">Detail Barang & Jumlah</label>
                                    <textarea 
                                      required
                                      rows={4}
                                      value={goodsDetail}
                                      onChange={(e) => setGoodsDetail(e.target.value)}
                                      className="w-full px-6 py-4 bg-beige/50 border border-emerald-100 rounded-2xl focus:outline-none focus:border-emerald-600 font-medium text-emerald-900"
                                    />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-xs font-bold text-emerald-900 uppercase tracking-widest ml-1">Metode Pengiriman</label>
                                    <div className="grid grid-cols-1 gap-3">
                                       {[
                                         { id: 'Kirim Instan (Gojek/Grab)', name: 'Kirim Instan', desc: 'Gojek, Grab, atau kurir instan lainnya', icon: <Navigation className="w-5 h-5" /> },
                                         { id: 'Ekspedisi (JNE/J&T/Sicepat)', name: 'Ekspedisi', desc: 'JNE, J&T, Sicepat, atau kurir kargo lainnya', icon: <Truck className="w-5 h-5" /> },
                                         { id: 'Antar Sendiri', name: 'Antar Sendiri', desc: 'Serahkan bantuan langsung ke lokasi lembaga mitra', icon: <Package className="w-5 h-5" /> },
                                       ].map(item => (
                                         <button
                                           key={item.id}
                                           type="button"
                                           onClick={() => setMethod(item.id)}
                                           className={`p-5 rounded-2xl flex items-center gap-4 transition-all border-2 text-left group ${method === item.id ? 'border-emerald-600 bg-emerald-50' : 'border-emerald-100 bg-white hover:border-emerald-300'}`}
                                         >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${method === item.id ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'}`}>
                                               {item.icon}
                                            </div>
                                            <div>
                                               <div className="font-bold text-emerald-900 text-sm">{item.name}</div>
                                               <div className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-wider">{item.desc}</div>
                                            </div>
                                            {method === item.id && <CheckCircle2 className="w-6 h-6 text-emerald-600 ml-auto" />}
                                         </button>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                        )}
                     </div>

                     <motion.button 
                       type="submit"
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       disabled={submitting}
                       className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-emerald-100"
                     >
                        {submitting ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            Konfirmasi Kontribusi
                            <ChevronRight className="w-5 h-5 transition-transform" />
                          </>
                        )}
                     </motion.button>
                  </form>
                )}
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

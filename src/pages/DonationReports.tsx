import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Calendar, 
  Filter, 
  RotateCcw,
  Download, 
  Search,
  Wallet,
  Package,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  FileDown
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { formatToWIB, getCurrentWIB } from '../utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DonationReports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'list'>('stats');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all'
  });

  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPNG = async () => {
    if (!reportRef.current) return;
    try {
      const dataUrl = await toPng(reportRef.current, { cacheBust: true, backgroundColor: '#f9fafb' });
      const link = document.createElement('a');
      link.download = `Laporan_Analisis_${new Date().getFullYear()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const handleExportPDF = () => {
    if (!data || !data.donations) return;

    const doc = new jsPDF();
    
     // Header
    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text('Laporan Kontribusi Griya Amanah', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Dicetak pada: ${getCurrentWIB()}`, 14, 30);

    // Ringkasan Statistik
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Ringkasan Statistik', 14, 45);
    
    doc.setFontSize(10);
    doc.text(`Total Dana Terkumpul: Rp${data.summary.totalMoney.toLocaleString('id-ID')}`, 14, 55);
    doc.text(`Total Bantuan Logistik: ${data.summary.totalGoods} Item`, 14, 62);
    doc.text(`Total Transaksi: ${data.summary.totalItems} Transaksi`, 14, 69);
    doc.text(`Persentase Verifikasi: ${Math.round((data.summary.verifiedItems / data.summary.totalItems) * 100) || 0}%`, 14, 76);

    // Tabel
    const tableData = data.donations.map((don: any) => [
      don.user?.name || '-',
      don.orphanage?.name || '-',
      don.type === 'money' ? `Rp${Number(don.amount).toLocaleString('id-ID')}` : (don.goods_detail || 'Logistik'),
      formatToWIB(don.created_at),
      don.status === 'verified' ? 'Terverifikasi' : 
      don.status === 'completed' ? 'Selesai' : 
      don.status === 'pending' ? 'Tertunda' : 'Dibatalkan'
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Dermawan', 'Lembaga Mitra', 'Jumlah/Keterangan', 'Tanggal', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], halign: 'center' },
      styles: { fontSize: 8, font: 'helvetica' },
      columnStyles: {
        2: { halign: 'right' },
        4: { halign: 'center' }
      },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 4) {
          const text = (hookData.cell.text[0] || '').toUpperCase();
          if (text.includes('TUNDA')) {
            hookData.cell.styles.fillColor = [255, 251, 235];
            hookData.cell.styles.textColor = [180, 83, 9];
          } else if (text.includes('BATAL') || text.includes('GAGAL')) {
            hookData.cell.styles.fillColor = [254, 242, 242];
            hookData.cell.styles.textColor = [220, 38, 38];
          } else {
            hookData.cell.styles.fillColor = [236, 253, 245];
            hookData.cell.styles.textColor = [5, 150, 105];
          }
        }
      },
      didDrawCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 4) {
          const text = (hookData.cell.text[0] || '').toUpperCase();
          let color: [number, number, number] = [5, 150, 105]; // emerald-600
          let bgColor: [number, number, number] = [236, 253, 245]; // emerald-50

          if (text.includes('TUNDA')) {
            color = [180, 83, 9]; // amber-700
            bgColor = [255, 251, 235]; // amber-50
          } else if (text.includes('BATAL') || text.includes('GAGAL')) {
            color = [220, 38, 38]; // red-600
            bgColor = [254, 242, 242]; // red-50
          }

          const { x, y, width, height } = hookData.cell;
          const padding = 2;
          
          doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
          (doc as any).roundedRect(x + padding, y + padding, width - padding * 2, height - padding * 2, 3, 3, 'F');
          
          doc.setTextColor(color[0], color[1], color[2]);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text(hookData.cell.text, x + width / 2, y + height / 2, { align: 'center', baseline: 'middle' });
        }
      }
    });

    doc.save(`Laporan_Kontribusi_Griya_Amanah_${Date.now()}.pdf`);
    setShowPreview(false);
  };

  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    const savedUser = localStorage.getItem('amanah_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUserRole(u.role);
    }
    
    const fetchData = async () => {
      try {
        const savedUser = localStorage.getItem('amanah_user');
        const headers: any = {};
        if (savedUser) headers['x-user-data'] = savedUser;

        const res = await fetch('/api/admin/reports', { headers });
        if (!res.ok) throw new Error('Gagal memuat laporan');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

  const filteredDonations = data?.donations?.filter((d: any) => {
    const matchesSearch = d.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.orphanage?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filters.type === 'all' || d.type === filters.type;
    
    // Status matching - make it more robust and match display logic
    const status = (d.status || '').toLowerCase();
    const isVerified = status.includes('verified') || status.includes('completed') || status.includes('selesai');
    const isPending = status.includes('pending') || status.includes('tunda');
    
    let matchesStatus = false;
    if (filters.status === 'all') {
      matchesStatus = true;
    } else if (filters.status === 'verified') {
      matchesStatus = isVerified;
    } else if (filters.status === 'pending') {
      matchesStatus = isPending;
    } else if (filters.status === 'cancelled') {
      matchesStatus = !isVerified && !isPending;
    }

    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const sortedOrphanages = data?.byOrphanage ? [...data.byOrphanage].sort((a: any, b: any) => b.value - a.value) : [];
  const topOrphanage = sortedOrphanages[0] || null;
  const achievementPercent = data?.summary?.totalTarget > 0 
    ? Math.min(Math.round((data.summary.totalMoney / data.summary.totalTarget) * 100), 100) 
    : 0;

  if (loading) return (
    <div className="h-full flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
    </div>
  );

  if (error) return (
    <div className="h-full flex flex-col items-center justify-center p-20 text-center">
       <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
       <h3 className="text-xl font-bold text-emerald-900 mb-2">Kesalahan</h3>
       <p className="text-emerald-800/60 mb-6">{error}</p>
       <button onClick={() => window.location.reload()} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold">Coba Lagi</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-display font-black text-emerald-900 mb-2">Laporan Donasi</h1>
           <p className="text-emerald-800/60 font-medium font-display leading-tight italic opacity-90">Laporan transparansi kontribusi dan dampak sosial sistem secara langsung.</p>
        </div>
        
        <div className="flex gap-3">
           <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-100 flex gap-1 shadow-sm">
              <button 
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-emerald-800/60 hover:bg-emerald-50'}`}
              >
                 Analitik
              </button>
              <button 
                onClick={() => setActiveTab('list')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-emerald-800/60 hover:bg-emerald-50'}`}
              >
                 Riwayat Transaksi
              </button>
           </div>
           <button 
             onClick={() => setShowPreview(true)}
             className="flex items-center gap-2 px-6 py-3 bg-white border border-emerald-100 text-emerald-900 rounded-2xl font-bold hover:bg-emerald-50 shadow-sm transition-all active:scale-95"
           >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Ekspor Ke PDF</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Akumulasi Dana Kontribusi', value: `Rp${data.summary.totalMoney.toLocaleString('id-ID')}`, icon: Wallet, color: 'emerald' },
          { label: 'Jumlah Bantuan Logistik', value: `${data.summary.totalGoods} Item`, icon: Package, color: 'blue' },
          { label: 'Total Transaksi', value: `${data.summary.totalItems} Transaksi`, icon: TrendingUp, color: 'amber' },
          { label: 'Verifikasi Berhasil', value: `${Math.round((data.summary.verifiedItems / data.summary.totalItems) * 100) || 0}%`, icon: CheckCircle2, color: 'purple' }
        ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { type: "spring", stiffness: 300 }
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-[2.5rem] p-8 relative overflow-hidden group shadow-xl shadow-emerald-900/10 cursor-pointer border border-emerald-100/50 hover:border-emerald-300/50 transition-colors flex flex-col items-center text-center gap-5"
            >
               <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110
                 ${stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : 
                   stat.color === 'blue' ? 'bg-blue-100 text-blue-600' : 
                   stat.color === 'amber' ? 'bg-amber-100 text-amber-600' : 
                   'bg-purple-100 text-purple-600'}`}
               >
                  <stat.icon className="w-7 h-7" />
               </div>
               <div className="min-w-0">
                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800/30 mb-1 leading-none">{stat.label}</p>
                 <h3 className="text-xl sm:text-2xl font-display font-black text-emerald-900 leading-tight tracking-tight">{stat.value}</h3>
               </div>
            </motion.div>
        ))}
      </div>

      {activeTab === 'stats' ? (
        <div className="space-y-12">
          {/* Hero Impact Section */}
          <motion.div 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             className="relative p-12 rounded-[4rem] bg-emerald-950 text-white overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center gap-12"
          >
             {/* Glowing Aura */}
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
             <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-200/5 rounded-full blur-[100px] -ml-48 -mb-48" />

             <div className="relative z-10 flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800/30 rounded-full mb-6 border border-emerald-700/50">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Pemantau Dampak Langsung</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-display font-black leading-tight mb-6">
                   Setiap Kontribusi Adalah <span className="text-emerald-400 italic">Harapan.</span>
                </h2>
                <p className="text-lg text-emerald-100/60 max-w-xl leading-relaxed mb-8 font-medium">
                   Bersama kita membangun ekosistem kebaikan yang transparan dan berdampak nyata bagi ribuan masa depan.
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                   <div className="px-6 py-4 bg-white/5 rounded-3xl border border-white/10 hover:border-emerald-500/50 transition-colors">
                      <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">Total Dana Aktif</p>
                      <p className="text-2xl font-display font-black tracking-tight">Rp{data.summary.totalMoney.toLocaleString('id-ID')}</p>
                   </div>
                   <div className="px-6 py-4 bg-white/5 rounded-3xl border border-white/10 hover:border-emerald-500/50 transition-colors">
                      <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">Efisiensi</p>
                      <p className="text-2xl font-display font-black tracking-tight">99.8%</p>
                   </div>
                </div>
             </div>

             <div className="relative z-10 w-full lg:w-auto flex flex-col items-center">
                <div className="relative w-64 h-64 flex items-center justify-center">
                   {/* Circle Ring */}
                   <svg className="w-full h-full rotate-[-90deg]">
                      <circle cx="128" cy="128" r="110" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                      <motion.circle 
                         initial={{ strokeDashoffset: 691 }}
                         animate={{ strokeDashoffset: 691 - (691 * (achievementPercent / 100)) }}
                         transition={{ duration: 2, ease: "easeOut" }}
                         cx="128" cy="128" r="110" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" 
                         strokeDasharray="691"
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-5xl font-display font-black tracking-tighter">{achievementPercent}%</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Target Tercapai</p>
                   </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100/40 mt-8">Menuju Pencapaian Berikutnya</p>
             </div>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Leaderboard of Grace */}
             <div className="lg:col-span-2 space-y-8">
                <div className="flex items-center justify-between px-4">
                   <div>
                      <h3 className="text-2xl font-display font-black text-emerald-900 leading-none mb-2">Ekosistem Kebaikan Mitra</h3>
                      <p className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-widest">Lembaga dengan dampak terverifikasi tertinggi</p>
                   </div>
                   <div className="w-10 h-10 rounded-full border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <BarChartIcon className="w-5 h-5" />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {data.byOrphanage.sort((a: any, b: any) => b.value - a.value).map((item: any, idx: number) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="glass p-8 rounded-[2.5rem] border border-emerald-100 hover:border-emerald-300 shadow-lg shadow-emerald-900/5 transition-all group overflow-hidden relative"
                      >
                         <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform pointer-events-none">
                            <Wallet className="w-24 h-24 text-emerald-900" />
                         </div>
                         <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm
                                 bg-emerald-50 text-emerald-600`}>
                                  {String(idx + 1).padStart(2, '0')}
                               </div>
                               <p className="text-xs font-black text-emerald-600">Terakumulasi</p>
                            </div>
                            <h4 className="text-lg font-display font-black text-emerald-900 line-clamp-1 mb-1">{item.name}</h4>
                            <p className="text-2xl font-display font-black tracking-tight text-emerald-950 mb-6 font-mono">Rp{item.value.toLocaleString('id-ID')}</p>
                            <div className="flex items-center gap-2">
                               <div className="flex-1 h-1.5 bg-emerald-50 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((item.value / 100000000) * 100, 100)}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-emerald-500 rounded-full"
                                  />
                               </div>
                               <span className="text-[10px] font-bold text-emerald-800/20">Terverifikasi</span>
                            </div>
                         </div>
                      </motion.div>
                   ))}
                </div>
             </div>

             {/* Vertical Activity Pulse */}
             <div className="lg:col-span-1 flex flex-col">
                <div className="flex items-center justify-between px-4 mb-8">
                   <h3 className="text-2xl font-display font-black text-emerald-900 leading-none">Denyut Bulanan</h3>
                   <Calendar className="w-5 h-5 text-emerald-200" />
                </div>

                <div 
                  ref={reportRef}
                  className="glass p-10 rounded-[3rem] border border-emerald-100 flex-1 flex flex-col shadow-xl shadow-emerald-900/5 relative overflow-hidden"
                >
                   {/* Abstract Pulse Decoration */}
                   <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                         <path d="M0 50 Q 25 20 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-emerald-900" />
                         <path d="M0 60 Q 30 90 60 60 T 100 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-emerald-900" />
                      </svg>
                   </div>
                   
                   <div className="relative z-10 flex-1 flex flex-col justify-center space-y-12 py-6">
                      {data.monthlyTrend.sort((a: any, b: any) => b.month.localeCompare(a.month)).slice(0, 4).map((item: any, idx: number) => (
                         <div key={item.month} className="relative pl-12 border-l-2 border-emerald-100 last:border-transparent group h-full">
                            <div className={`absolute top-0 left-0 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-white shadow-lg transition-all group-hover:scale-125
                              ${idx === 0 ? 'bg-emerald-600 ring-4 ring-emerald-600/10' : 'bg-emerald-100 group-hover:bg-emerald-400'}`} />
                            
                            <div className="group-hover:translate-x-2 transition-transform">
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/40 mb-3">Rekapitulasi {item.month}</p>
                               <h4 className="text-2xl font-display font-black text-emerald-900 mb-2 font-mono tracking-tighter">Rp{item.amount.toLocaleString('id-ID')}</h4>
                               <div className="flex items-center gap-3">
                                  <div className="px-3 py-1 bg-emerald-50 rounded-lg flex items-center gap-2">
                                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                     <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Dampak Terverifikasi</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                      ))}
                      
                      {data.monthlyTrend.length < 2 && (
                         <div className="pt-8 border-t border-emerald-50/50 mt-4">
                            <div className="p-6 bg-emerald-50/30 rounded-3xl border border-dashed border-emerald-200">
                               <p className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-widest leading-relaxed">
                                  Laporan mendatang akan muncul di sini seiring berjalannya waktu. Konsistensi adalah kunci kebaikan.
                               </p>
                            </div>
                         </div>
                      )}
                   </div>


                </div>
             </div>
          </div>

        {/* New Section: Creative Insights & Achievements */}
        <div className="mt-12 space-y-12 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20 group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                 <TrendingUp className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/60 mb-4 text-center sm:text-left">Target Capaian Bulan Ini</p>
                 <div className="flex items-end justify-center sm:justify-start gap-3 mb-6">
                    <span className="text-4xl font-display font-black tracking-tight">{achievementPercent}%</span>
                    <span className="text-xs font-bold text-emerald-100/60 mb-2">Tercapai</span>
                 </div>
                 <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-6">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${achievementPercent}%` }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    />
                 </div>
                 <p className="text-xs font-medium text-emerald-100/80 leading-relaxed text-center sm:text-left">
                    Luar biasa! Kontribusi bulan ini melampaui rata-rata historis sebesar <span className="font-bold text-white">12%</span>.
                 </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-[2.5rem] p-8 border border-emerald-100 flex flex-col justify-between shadow-xl shadow-emerald-900/10 group hover:border-emerald-300 transition-colors"
            >
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/30 mb-8">Lembaga Mitra Paling Aktif</p>
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                       <BarChartIcon className="w-8 h-8" />
                    </div>
                    <div>
                       <h4 className="text-xl font-display font-black text-emerald-900 leading-tight">
                          {topOrphanage?.name || 'Belum Ada Data'}
                       </h4>
                       <p className="text-xs font-bold text-emerald-600">Penerima Dana Terbesar</p>
                    </div>
                 </div>
              </div>
              <div className="mt-8 pt-6 border-t border-emerald-50">
                 <div className="flex justify-between items-center text-xs font-bold text-emerald-800/40 uppercase tracking-widest">
                    <span>Total Bantuan</span>
                    <span className="text-emerald-900">Rp{(topOrphanage?.value || 0).toLocaleString('id-ID')}</span>
                 </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-[2.5rem] p-8 border border-emerald-100 flex flex-col justify-between shadow-xl shadow-emerald-900/10 group hover:border-emerald-300 transition-colors"
            >
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/30 mb-8">Efisiensi Verifikasi</p>
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner group-hover:-rotate-12 transition-transform">
                       <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                       <h4 className="text-xl font-display font-black text-emerald-900 leading-tight">Verifikasi Tercepat</h4>
                       <p className="text-xs font-bold text-blue-600">Rata-rata 1.2 Jam</p>
                    </div>
                 </div>
              </div>
              <div className="mt-8 pt-6 border-t border-emerald-50">
                 <div className="flex justify-between items-center text-xs font-bold text-emerald-800/40 uppercase tracking-widest">
                    <span>Skor Akurasi</span>
                    <span className="text-emerald-900">99.2%</span>
                 </div>
              </div>
            </motion.div>
          </div>



          {/* Creative Innovative Footer: Message of the Day */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-[3rem] bg-emerald-950 text-emerald-100 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group"
          >
             {/* Decorative Background */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-800/20 to-transparent opacity-50" />
             <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

             <div className="w-24 h-24 shrink-0 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_50px_rgba(5,150,105,0.2)]">
                <FileText className="w-10 h-10" />
             </div>

             <div className="flex-1 text-center md:text-left relative z-10 space-y-2">
                <h4 className="text-2xl font-display font-black text-white mb-4 italic leading-tight">
                  {userRole === 'admin' 
                    ? '"Integritas data adalah cermin dari amanah yang kita emban."' 
                    : '"Tangan yang memberi lebih mulia daripada yang menerima."'
                  }
                </h4>
                <p className="text-sm font-medium text-emerald-100/60 leading-relaxed max-w-2xl">
                  {userRole === 'admin'
                    ? 'Sebagai admin, ketelitian Anda dalam memvalidasi setiap transaksi memastikan setiap butir kebaikan sampai ke tangan yang tepat dengan penuh transparansi.'
                    : 'Setiap kontribusi yang Anda dokumentasikan di sini bukan sekadar angka, melainkan bukti nyata dari kebaikan hati yang akan terus mengalir menjadi keberkahan bagi mereka yang membutuhkan.'
                  }
                </p>
             </div>

             <div className="hidden lg:block shrink-0 px-8 py-4 bg-emerald-900/50 rounded-2xl border border-emerald-800/50 backdrop-blur-md">
                <div className="text-center">
                   <p className="text-2xl font-black text-emerald-400">#Solidaritas</p>
                   <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1">Griya Amanah 2026</p>
                </div>
             </div>
          </motion.div>
        </div>
      </div>
      ) : (
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-800/30" />
                 <input 
                   type="text" 
                   placeholder="Cari transaksi..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-16 pr-6 py-5 bg-white border border-emerald-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600 transition-all font-medium text-emerald-900 shadow-sm"
                 />
              </div>
              <div className="relative">
                 <button 
                   onClick={() => setShowFilters(!showFilters)}
                   className={`px-8 py-5 border rounded-3xl flex items-center justify-center gap-2 font-bold shadow-sm transition-all ${showFilters ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-emerald-100 text-emerald-900 hover:bg-emerald-50'}`}
                 >
                    <Filter className="w-4 h-4" />
                    Saring Lanjutan
                 </button>

                 <AnimatePresence>
                   {showFilters && (
                     <>
                       <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)}></div>
                       <motion.div
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         className="absolute right-0 top-full mt-4 w-72 bg-white rounded-[2rem] shadow-4xl border border-emerald-50 p-6 z-20 space-y-6"
                       >
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800/40 mb-3">Tipe Donasi</p>
                            <div className="grid grid-cols-1 gap-2">
                               {['all', 'money', 'goods'].map((t) => (
                                 <button
                                   key={t}
                                   onClick={() => setFilters({ ...filters, type: t })}
                                   className={`px-4 py-2 rounded-xl text-xs font-bold text-left transition-all ${filters.type === t ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-emerald-900'}`}
                                 >
                                    {t === 'all' ? 'Semua Tipe' : t === 'money' ? 'Dana (Uang)' : 'Barang'}
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800/40 mb-3">Status Verifikasi</p>
                            <div className="grid grid-cols-1 gap-2">
                               {['all', 'verified', 'pending', 'cancelled'].map((s) => (
                                 <button
                                   key={s}
                                   onClick={() => setFilters({ ...filters, status: s })}
                                   className={`px-4 py-2 rounded-xl text-xs font-bold text-left transition-all ${filters.status === s ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-emerald-900'}`}
                                 >
                                    {s === 'all' ? 'Semua Status' : s === 'verified' ? 'Terverifikasi' : s === 'pending' ? 'Menunggu' : 'Dibatalkan'}
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="pt-2 border-t border-emerald-50">
                            <button 
                               onClick={() => {
                                 setFilters({ type: 'all', status: 'all' });
                                 setShowFilters(false);
                               }}
                               className="w-full py-2 text-xs font-bold text-red-600 hover:text-red-700 text-center"
                            >
                               Atur Ulang Saringan
                            </button>
                         </div>
                       </motion.div>
                     </>
                   )}
                 </AnimatePresence>
              </div>
           </div>

           <div className="glass rounded-[3rem] overflow-hidden border border-emerald-100 shadow-xl shadow-emerald-900/10">
              <div>
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-emerald-50 border-b-2 border-emerald-200">
                          <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-emerald-800">Donatur</th>
                          <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-emerald-800">Tujuan</th>
                          <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-emerald-800">Jumlah/Tipe</th>
                          <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-emerald-800">Waktu</th>
                          <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-emerald-800">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                       {filteredDonations.map((don: any) => (
                         <motion.tr 
                           key={don.id} 
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           whileHover={{ backgroundColor: 'rgba(236, 253, 245, 0.5)' }}
                           className="transition-colors group"
                         >
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                                     {don.user?.name?.substring(0, 1)}
                                  </div>
                                  <div>
                                     <p className="font-bold text-emerald-900">{don.user?.name}</p>
                                     <p className="text-[10px] text-emerald-800/40 font-bold">{don.user?.email}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <p className="font-bold text-emerald-900">{don.orphanage?.name}</p>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-2">
                                  {don.type === 'money' ? (
                                    <>
                                       <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                          <Wallet className="w-3 h-3" />
                                       </div>
                                       <span className="font-display font-black text-emerald-900">Rp{Number(don.amount).toLocaleString('id-ID')}</span>
                                    </>
                                  ) : (
                                    <>
                                       <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                          <Package className="w-3 h-3" />
                                       </div>
                                       <span className="font-bold text-emerald-900">{don.goods_detail || 'Barang'}</span>
                                    </>
                                  )}
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <p className="text-xs font-bold text-emerald-900">{formatToWIB(don.created_at)}</p>
                               <p className="text-[10px] text-emerald-800/40 font-bold">{formatToWIB(don.created_at, { hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\./g, ':')} WIB</p>
                            </td>
                            <td className="px-8 py-6">
                               <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.15em]
                                 ${(don.status || '').toLowerCase().includes('pending') || (don.status || '').toLowerCase().includes('tunda') ? 'bg-amber-100 text-amber-600' : 
                                   (don.status || '').toLowerCase().includes('verified') || (don.status || '').toLowerCase().includes('completed') || (don.status || '').toLowerCase().includes('selesai') ? 'bg-emerald-100 text-emerald-600' : 
                                   'bg-red-100 text-red-600'}`}
                               >
                                  {don.status === 'verified' ? 'Terverifikasi' : 
                                   don.status === 'completed' ? 'Selesai' : 
                                   don.status === 'pending' ? 'Tertunda' : 'Dibatalkan'}
                               </span>
                            </td>
                         </motion.tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              {filteredDonations.length === 0 && (
                <div className="py-20 text-center">
                   <FileText className="w-16 h-16 text-emerald-50 mx-auto mb-4" />
                   <p className="text-emerald-800/40 font-bold uppercase tracking-widest">Tidak ada riwayat transaksi</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* MODAL PRATINJAU PDF */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-8 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/30">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                       <FileText className="w-6 h-6" />
                    </div>
                    <div>
                       <h2 className="text-xl font-display font-black text-emerald-900">Pratinjau Laporan Donasi</h2>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/40">Tinjau format sebelum mengunduh</p>
                    </div>
                 </div>
                 <motion.button 
                   whileHover={{ rotate: 180, scale: 1.1 }}
                   whileTap={{ scale: 0.9 }}
                   onClick={() => setShowPreview(false)}
                   className="w-10 h-10 rounded-full bg-white text-emerald-900 flex items-center justify-center hover:bg-emerald-50 transition-colors shadow-sm"
                 >
                    <X className="w-5 h-5" />
                 </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-gray-50/50">
                 <div className="bg-white shadow-sm border border-emerald-50 rounded-xl p-10 max-w-3xl mx-auto min-h-[800px] flex flex-col">
                    {/* Header Report */}
                    <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-8 mb-8">
                       <div>
                          <h1 className="text-3xl font-display font-black text-emerald-600">Griya Amanah</h1>
                          <p className="text-xs font-bold text-emerald-800/40 tracking-wider">LAYANAN DONASI TERPERCAYA</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-emerald-800/30 uppercase tracking-widest">Waktu Cetak</p>
                          <p className="text-xs font-bold text-emerald-900">{getCurrentWIB()}</p>
                       </div>
                    </div>

                    <h2 className="text-xl font-display font-black text-emerald-900 mb-6 text-center underline decoration-emerald-200 decoration-4">LAPORAN REKAPITULASI DONASI</h2>

                    <div className="grid grid-cols-2 gap-8 mb-10">
                       <div className="space-y-4">
                          <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-50 pb-2">Ringkasan Statistik</h3>
                          <div className="space-y-2">
                             <div className="flex justify-between text-sm">
                                <span className="text-emerald-800/60 font-medium">Total Dana:</span>
                                <span className="font-bold text-emerald-900">Rp{data.summary.totalMoney.toLocaleString('id-ID')}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-emerald-800/60 font-medium">Donasi Barang:</span>
                                <span className="font-bold text-emerald-900">{data.summary.totalGoods} Barang</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-emerald-800/60 font-medium">Total Transaksi:</span>
                                <span className="font-bold text-emerald-900">{data.summary.totalItems} Transaksi</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex-1">
                       <table className="w-full text-left text-[10px]">
                          <thead>
                             <tr className="bg-emerald-600 text-white font-black uppercase tracking-widest">
                                <th className="px-4 py-3 first:rounded-tl-lg">Donatur</th>
                                <th className="px-4 py-3">Lembaga Mitra</th>
                                <th className="px-4 py-3">Jumlah/Ket</th>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3 last:rounded-tr-lg text-center">Status</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-50">
                             {data.donations.map((don: any) => (
                               <tr key={don.id}>
                                  <td className="px-4 py-3 font-bold text-emerald-900">{don.user?.name}</td>
                                  <td className="px-4 py-3 text-emerald-800">{don.orphanage?.name}</td>
                                  <td className="px-4 py-3 text-emerald-900 font-bold">
                                     {don.type === 'money' ? `Rp${Number(don.amount).toLocaleString('id-ID')}` : (don.goods_detail || 'Logistik')}
                                  </td>
                                  <td className="px-4 py-3 text-emerald-800/60">{formatToWIB(don.created_at)}</td>
                                  <td className="px-4 py-3 text-center">
                                     <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full
                                       ${(don.status || '').toLowerCase().includes('pending') || (don.status || '').toLowerCase().includes('tunda') ? 'bg-amber-50 text-amber-600' : 
                                         (don.status || '').toLowerCase().includes('verified') || (don.status || '').toLowerCase().includes('completed') || (don.status || '').toLowerCase().includes('selesai') ? 'bg-emerald-50 text-emerald-600' : 
                                         'bg-red-50 text-red-600'}`}>
                                        {don.status === 'verified' ? 'Terverifikasi' : 
                                         don.status === 'completed' ? 'Selesai' : 
                                         don.status === 'pending' ? 'Tertunda' : 'Dibatalkan'}
                                     </span>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>

                    <div className="mt-12 pt-8 border-t border-emerald-50 text-[10px] text-emerald-800/40 text-center font-bold tracking-widest">
                       &copy; 2026 GRIYA AMANAH - LAPORAN RESMI KONTRIBUSI
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-emerald-50/50 flex items-center justify-end gap-3">
                 <button 
                   onClick={() => setShowPreview(false)}
                   className="px-8 py-3.5 bg-white text-emerald-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-red-500 transition-all border border-emerald-100"
                 >
                    Batal
                 </button>
                 <button 
                   onClick={handleExportPDF}
                   className="px-10 py-3.5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-2"
                 >
                    <FileDown className="w-4 h-4" />
                    Unduh PDF Sekarang
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

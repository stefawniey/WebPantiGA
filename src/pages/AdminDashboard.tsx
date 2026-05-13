import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  TrendingUp,
  BarChart2,
  X,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Donation } from '../types';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('amanah_user');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userStr) headers['x-user-data'] = userStr;

    fetch('/api/admin/dashboard', { headers })
      .then(async res => {
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Data gagal dimuat');
        return result;
      })
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setErrorMsg(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-40 glass rounded-[2.5rem] animate-pulse"></div>)}
      </div>
      <div className="h-96 glass rounded-[3rem] animate-pulse"></div>
    </div>
  );

  if (errorMsg) return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-12 text-center glass rounded-[3rem] border-red-100"
    >
       <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10" />
       </div>
       <div className="text-red-900 font-display text-2xl font-bold mb-2">Gagal Memuat Data</div>
       <div className="text-emerald-800/60 max-w-md mx-auto mb-8">{errorMsg}</div>
       <button onClick={() => window.location.reload()} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-600/20 hover:scale-105 transition-transform active:scale-95">
         Coba Lagi
       </button>
    </motion.div>
  );

  const stats = [
    { 
      label: 'Total Kontribusi Tunai', 
      value: `Rp${(data.stats.totalMoney || 0).toLocaleString('id-ID')}`, 
      icon: DollarSign, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      trend: null, 
      isUp: true 
    },
    { 
      label: 'Total Bantuan Logistik', 
      value: data.stats.totalGoods || 0, 
      icon: Package, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50', 
      trend: null, 
      isUp: true 
    },
    { 
      label: 'Total Pengguna', 
      value: data.stats.totalUsers || 0, 
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      trend: null, 
      isUp: true 
    }
  ];

  const CustomTick = (props: any) => {
    const { x, y, payload } = props;
    const text = String(payload?.value || "");
    const boxWidth = Math.max(50, text.length * 8 + 16);
    return (
      <g transform={`translate(${x},${y})`}>
        <rect
          x={-boxWidth / 2}
          y={8}
          width={boxWidth}
          height={26}
          rx={10}
          fill="#f0fdf4"
          stroke="#dcfce7"
          strokeWidth={1.5}
        />
        <text
          x={0}
          y={25}
          textAnchor="middle"
          fill="#065f46"
          fontSize={10}
          fontWeight={800}
          className="uppercase tracking-tighter"
        >
          {text || "—"}
        </text>
      </g>
    );
  };

  const chartData = [
    { name: 'Sen', amount: 4000, donations: 2400 },
    { name: 'Sel', amount: 3000, donations: 1398 },
    { name: 'Rab', amount: 2000, donations: 9800 },
    { name: 'Kam', amount: 2780, donations: 3908 },
    { name: 'Jum', amount: 1890, donations: 4800 },
    { name: 'Sab', amount: 2390, donations: 3800 },
    { name: 'Min', amount: 3490, donations: 4300 },
  ];

  const recentDonations = Array.isArray(data?.recentDonations) ? data.recentDonations : [];

  const updateDonationStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const userStr = localStorage.getItem('amanah_user');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userStr) headers['x-user-data'] = userStr;

    try {
      const res = await fetch(`/api/admin/donations/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal memperbarui status');
      
      // Update local state
      setData((prev: any) => ({
        ...prev,
        recentDonations: prev.recentDonations.map((d: any) => 
          d.id === id ? { ...d, status } : d
        )
      }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {stats.map((stat, i) => (
           <motion.div
             key={i}
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1, duration: 0.8, ease: "circOut" }}
             whileHover={{ scale: 1.03, y: -5 }}
             className="glass p-8 rounded-[3rem] group hover:bg-white transition-shadow duration-500 shadow-xl shadow-emerald-900/[0.05] border border-emerald-100/50 cursor-default flex flex-col items-center text-center"
           >
              <div className="flex flex-col items-center gap-4 mb-6 w-full">
                 <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:rotate-6 group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon className="w-7 h-7" />
                 </div>
                 {stat.trend && (
                   <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${stat.isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stat.trend}
                   </div>
                 )}
              </div>
              <div className="min-w-0 w-full text-center">
                 <div className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-widest mb-1 leading-none">{stat.label}</div>
                 <div className="text-xl sm:text-2xl font-display font-black text-emerald-900 leading-tight">{stat.value}</div>
              </div>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
         {/* Verification Table */}
         <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.3 }}
           className="lg:col-span-2 flex flex-col space-y-6"
         >
            <div className="flex items-center justify-between px-4 min-h-[40px]">
               <h3 className="text-2xl font-display font-bold text-emerald-900 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-emerald-600" /> Validasi Kontribusi
               </h3>
               <motion.div 
                 whileHover={{ scale: 1.05, backgroundColor: "#059669" }}
                 whileTap={{ scale: 0.95 }}
                 className="px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase tracking-tighter shadow-lg shadow-emerald-600/10 cursor-pointer transition-colors"
               >
                 {data.stats.pendingCount || 0} &nbsp; Perlu Ditinjau
               </motion.div>
            </div>
            
            <div className="glass rounded-[3.5rem] overflow-hidden border border-emerald-100 flex flex-col flex-1 shadow-2xl shadow-emerald-900/[0.05] relative">
               <div className="h-[480px] overflow-y-auto no-scrollbar bg-white/40">
                 <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20">
                       <tr className="bg-emerald-50/95 backdrop-blur-md border-b-2 border-emerald-200">
                          <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-emerald-800">Kontributor</th>
                          <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-emerald-800">Tujuan</th>
                          <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-emerald-800 text-right">Nilai</th>
                          <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-emerald-800 text-center">Aksi</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                       {recentDonations.length > 0 ? recentDonations.map((d: any, i: number) => (
                          <motion.tr 
                            key={d.id || i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + (i * 0.05) }}
                            whileHover={{ backgroundColor: 'rgba(236, 253, 245, 0.5)' }}
                            className="hover:bg-emerald-50/50 transition-all group cursor-default relative"
                          >
                             <td className="px-6 py-4">
                                <div className="font-bold text-emerald-900 group-hover:text-emerald-600 transition-colors text-sm">{d.user_name || 'Hamba Allah'}</div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="font-bold text-emerald-800/80 text-[11px] truncate max-w-[120px]">{d.orphanage_name || 'Lembaga Mitra'}</div>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <div className="font-display font-black text-emerald-900 text-sm">
                                   {d.type === 'money' ? `Rp${(Number(d.amount) || 0).toLocaleString('id-ID')}` : 'Logistik'}
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       updateDonationStatus(d.id, 'completed');
                                     }}
                                     disabled={updatingId === d.id || d.status === 'completed'}
                                     className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 ${
                                       d.status === 'completed' 
                                         ? 'bg-emerald-500 text-white' 
                                         : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                                     }`}
                                   >
                                      {updatingId === d.id ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                   </button>
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       updateDonationStatus(d.id, 'cancelled');
                                     }}
                                     disabled={updatingId === d.id || d.status === 'cancelled'}
                                     className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 ${
                                       d.status === 'cancelled'
                                         ? 'bg-red-500 text-white'
                                         : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'
                                     }`}
                                   >
                                      <AlertCircle className="w-4 h-4" />
                                   </button>
                                </div>
                             </td>
                          </motion.tr>
                       )) : (
                         <tr>
                           <td colSpan={4} className="px-10 py-20 text-center text-emerald-800/30 font-bold italic">Belum terdokumentasi adanya kontribusi terbaru.</td>
                         </tr>
                       )}
                    </tbody>
                 </table>
               </div>
            </div>
         </motion.div>

         {/* Analytics Container */}
         <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.4 }}
           className="flex flex-col space-y-6"
         >
            <h3 className="text-2xl font-display font-bold text-emerald-900 flex items-center gap-3 px-4 min-h-[40px]">
               <TrendingUp className="w-6 h-6 text-emerald-600" /> Ikhtisar Kinerja
            </h3>
                       <div className="glass rounded-[3.5rem] p-8 relative overflow-hidden group shadow-2xl shadow-emerald-900/[0.05] border border-emerald-100 flex-1 flex flex-col justify-between bg-white/40">
               {/* Decorative background removed based on user request */}
                             <div className="space-y-6">
                  <div className="space-y-3">
                     <div className="flex justify-between items-end gap-4">
                        <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">Pertumbuhan</span>
                        <span className="text-emerald-600 font-display font-black text-lg">+12%</span>
                     </div>
                     <div className="h-2.5 bg-emerald-50 rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: "70%" }}
                           transition={{ duration: 1.5, ease: "circOut" }}
                           className="h-full bg-emerald-600 rounded-full shadow-[0_0_15px_rgba(5,150,105,0.4)]"
                        />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between items-end gap-4">
                        <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">Kapasitas</span>
                        <span className="text-orange-600 font-display font-black text-lg">45%</span>
                     </div>
                     <div className="h-2.5 bg-emerald-50 rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: "45%" }}
                           transition={{ duration: 1.5, delay: 0.2, ease: "circOut" }}
                           className="h-full bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                        />
                     </div>
                  </div>
               </div>
               
               <div className="py-6 border-y border-emerald-100/30 text-center relative z-10 my-4">
                  <div className="inline-block p-3 bg-emerald-50 rounded-xl text-emerald-600 mb-3 mx-auto">
                     <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="text-base font-display font-black text-emerald-900 mb-1 tracking-tight">Fokus Penyaluran</div>
                  <div className="text-[10px] text-emerald-800/50 leading-relaxed font-medium max-w-[200px] mx-auto">
                    Griya Amanah Kasih memerlukan peningkatan dukungan logistik sebesar 20%.
                  </div>
               </div>
               
               <button 
                 onClick={() => setShowChartModal(true)}
                 className="w-full py-4 bg-emerald-600 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-emerald-600/20 text-[11px] tracking-widest uppercase"
               >
                  Analisis Detail
               </button>
            </div>
         </motion.div>
      </div>

      {/* Advanced Chart Modal */}
      <AnimatePresence>
        {showChartModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChartModal(false)}
              className="absolute inset-0 bg-emerald-950/40 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-5xl bg-white rounded-[3rem] sm:rounded-[4.5rem] shadow-4xl flex flex-col md:flex-row h-[90vh] md:h-[80vh] border border-emerald-50/50 overflow-hidden"
            >
                <motion.button 
                   whileHover={{ rotate: 180, scale: 1.1 }}
                   whileTap={{ scale: 0.9 }}
                   onClick={() => setShowChartModal(false)}
                   className="absolute top-6 right-6 z-50 w-12 h-12 bg-white/80 backdrop-blur-md shadow-lg border border-emerald-100 text-emerald-900 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors active:scale-90"
                >
                   <X className="w-5 h-5" />
                </motion.button>

                {/* Modal Sidebar Dashboard */}
                <div className="w-full md:w-80 premium-gradient px-8 py-12 text-white flex flex-col justify-between overflow-hidden relative">
                   <div className="relative z-10">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8">
                         <TrendingUp className="w-6 h-6" />
                      </div>
                      <h4 className="text-3xl font-display font-bold mb-4 tracking-tighter">Ringkasan Kinerja</h4>
                      <p className="text-emerald-100/60 text-sm leading-relaxed mb-10 font-medium">Visualisasi transparansi tren bantuan selama 7 hari terakhir.</p>
                   <div className="space-y-6">
                      <div className="flex items-center gap-4">
                         <div>
                            <div className="text-[10px] font-black uppercase text-white/50 tracking-widest">Minggu Ini</div>
                            <div className="text-2xl font-display font-black">Rp12.400.000</div>
                         </div>
                      </div>
                         <div className="flex items-center gap-4">
                            <div>
                               <div className="text-[10px] font-black uppercase text-white/50 tracking-widest">Target Bulanan</div>
                               <div className="text-2xl font-display font-black">75%</div>
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                 {/* Modal Content - Charts */}
                <div className="flex-1 p-8 sm:p-12 pt-14 sm:pt-16 overflow-y-auto no-scrollbar">
                  <div className="mb-10">
                     <h3 className="text-2xl font-display font-extrabold text-emerald-900 mb-2">Grafik Pertumbuhan Kontribusi</h3>
                     <p className="text-emerald-800/40 text-sm font-bold">Akumulasi data kontribusi yang telah diverifikasi oleh sistem.</p>
                  </div>
                  
                  <div className="h-[300px] w-full mb-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ left: 40, right: 40, top: 10, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          interval={0}
                          tick={<CustomTick />}
                          height={60}
                          padding={{ left: 0, right: 0 }}
                        />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                          formatter={(value: number) => [`Rp${value.toLocaleString('id-ID')}`, 'Nominal']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          name="Nominal"
                          stroke="#059669" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorAmt)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="p-8 bg-emerald-50/80 rounded-[2.5rem] border border-emerald-200/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                           <BarChart2 className="w-5 h-5 text-emerald-600" />
                           <span className="text-xs font-black text-emerald-900 uppercase tracking-widest">Statistik Logistik</span>
                        </div>
                        <div className="h-[120px]">
                           <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={chartData}>
                               <Bar dataKey="donations" radius={[4, 4, 0, 0]}>
                                 {chartData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#f59e0b'} />
                                 ))}
                               </Bar>
                             </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                     <div className="p-8 bg-emerald-50/80 rounded-[2.5rem] border border-emerald-200/50 shadow-sm flex flex-col justify-center text-center">
                        <div className="text-4xl font-display font-black text-emerald-900 mb-2">128</div>
                        <div className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">Transaksi Terverifikasi</div>
                        <p className="text-[10px] text-emerald-600 mt-4 font-bold">+15% Dari Minggu Lalu</p>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

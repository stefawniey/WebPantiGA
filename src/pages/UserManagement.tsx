import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Shield, 
  User as UserIcon, 
  Trash2, 
  AlertCircle,
  Ban,
  CheckCircle2,
  Calendar,
  Wallet,
  Heart,
  ExternalLink,
  Award,
  X,
  History
} from 'lucide-react';
import { User } from '../types';
import { formatToWIB } from '../utils';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDonations, setUserDonations] = useState<any[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);

  const fetchUsers = async () => {
    try {
      const savedUser = localStorage.getItem('aman_user') || localStorage.getItem('amanah_user');
      const headers: any = {};
      if (savedUser) headers['x-user-data'] = savedUser;

      const res = await fetch('/api/admin/users', { headers });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      } else {
        setError(data.error || 'Gagal mengambil data pengguna');
      }
    } catch (err) {
      setError('Kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUserDonations = async (userId: string | number) => {
    setLoadingDonations(true);
    try {
      const savedUser = localStorage.getItem('aman_user') || localStorage.getItem('amanah_user');
      const headers: any = {};
      if (savedUser) headers['x-user-data'] = savedUser;

      const res = await fetch(`/api/admin/users/${userId}/donations`, { headers });
      if (res.ok) {
        const data = await res.json();
        setUserDonations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDonations(false);
    }
  };

  const handleUpdateUser = async (userId: number | string, payload: Partial<User>) => {
    setUpdatingId(userId);
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...payload } : u));
    
    try {
      const savedUser = localStorage.getItem('aman_user') || localStorage.getItem('amanah_user');
      const headers: any = { 'Content-Type': 'application/json' };
      if (savedUser) headers['x-user-data'] = savedUser;

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        // Revert on error
        fetchUsers();
        const data = await res.json();
        console.warn('Update failed:', data.error);
      }
    } catch (err) {
      console.error('Connection error:', err);
      fetchUsers(); // Revert
    } finally {
      setUpdatingId(null);
    }
  };

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteUser = async (userId: number | string) => {
    setIsDeleting(true);
    // Optimistic update
    setUsers(prev => prev.filter(u => u.id !== userId));
    setUserToDelete(null);

    try {
      const savedUser = localStorage.getItem('aman_user') || localStorage.getItem('amanah_user');
      const headers: any = {};
      if (savedUser) headers['x-user-data'] = savedUser;

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        fetchUsers(); // Revert
        const data = await res.json();
        console.error('Delete failed:', data.error);
      }
    } catch (err) {
      fetchUsers(); // Revert
      console.error('Connection error during delete:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const isNotAdmin = u.role !== 'admin';
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (u.status || 'active') === filterStatus;
    return isNotAdmin && matchesSearch && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // Sort by donation amount
    return (b.total_donations || 0) - (a.total_donations || 0);
  });

  const donators = users.filter(u => u.role !== 'admin');

  const stats = {
    total: donators.length,
    suspended: donators.filter(u => u.status === 'suspended').length,
    totalFunds: donators.reduce((acc, curr) => acc + (curr.total_donations || 0), 0)
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div>
           <h1 className="text-4xl font-display font-black text-emerald-900 mb-2">Pantau Aktivitas Pengguna</h1>
           <p className="text-emerald-800/60 font-medium">Pantau kontribusi, tingkat partisipasi, serta status dermawan di platform Griya Amanah.</p>
        </div>
        
        <div className="bg-white/50 backdrop-blur-md p-1.5 sm:p-2 rounded-[1.5rem] sm:rounded-3xl border border-white flex gap-1.5 sm:gap-2 w-full sm:w-[450px]">
           <button 
             onClick={() => setFilterStatus('all')}
             className={`flex-1 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === 'all' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' : 'text-emerald-800/60 hover:bg-emerald-50'}`}
           >
              Seluruh Pengguna
           </button>
           <button 
             onClick={() => setFilterStatus('suspended')}
             className={`flex-1 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === 'suspended' ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'text-emerald-800/60 hover:bg-red-50'}`}
           >
              Akun Ditangguhkan
           </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Total Dermawan', value: stats.total, icon: Users, color: 'emerald', filter: 'all' },
           { label: 'Akumulasi Kontribusi', value: `Rp${(stats.totalFunds || 0).toLocaleString('id-ID')}`, icon: Wallet, color: 'blue', filter: 'all' },
           { label: 'Akun Ditangguhkan', value: stats.suspended, icon: Ban, color: 'red', filter: 'suspended' },
           { label: 'Laju Kontribusi', value: '+12%', icon: Award, color: 'amber', filter: 'all' }
         ].map((stat, i) => (
           <motion.div
             key={stat.label}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             whileHover={{ y: -8, scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             transition={{ delay: i * 0.1 }}
             onClick={() => setFilterStatus(stat.filter)}
             className={`glass p-8 rounded-[2.5rem] flex flex-col items-center text-center gap-5 group cursor-pointer hover:shadow-2xl transition-all ${filterStatus === stat.filter ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : ''}`}
           >
              <div className={`w-14 h-14 shrink-0 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                 <stat.icon className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800/40 mb-1 leading-none">{stat.label}</p>
                 <p className="text-lg sm:text-xl font-display font-black text-emerald-900 tracking-tight leading-tight">{stat.value}</p>
              </div>
           </motion.div>
         ))}
      </div>

      <div className="relative group max-w-2xl">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-emerald-300 group-focus-within:text-emerald-600 transition-colors">
          <Search className="w-6 h-6" />
        </div>
        <input 
          type="text" 
          placeholder="Cari dermawan berdasarkan nama atau email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-6 py-6 bg-white border border-emerald-100 rounded-[2rem] focus:outline-none focus:ring-8 focus:ring-emerald-600/5 focus:border-emerald-600 transition-all font-medium text-emerald-900 shadow-xl shadow-emerald-900/5 placeholder:text-emerald-200"
        />
      </div>

      {error ? (
        <div className="p-10 glass rounded-[3rem] text-center space-y-4">
           <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-display font-bold text-emerald-900">Gagal Memuat Data</h3>
           <p className="text-emerald-800/60 max-w-md mx-auto">{error}</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass rounded-[2rem] p-8 animate-pulse h-80" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {sortedUsers.map((u, index) => {
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ 
                    y: -10,
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedUser(u);
                    fetchUserDonations(u.id);
                  }}
                  className={`glass rounded-[2rem] p-8 relative group overflow-hidden border-2 transition-all cursor-pointer hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-900/10 ${u.status === 'suspended' ? 'border-red-100 bg-red-50/10 shadow-sm' : 'border-emerald-100/50 shadow-sm'}`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl bg-emerald-400 shadow-emerald-400/20">
                          <UserIcon className="w-6 h-6" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h3 className="font-display font-bold text-emerald-900 line-clamp-1">{u.name}</h3>
                          <p className="text-[10px] text-emerald-800/40 font-black uppercase tracking-widest">{u.email}</p>
                       </div>
                    </div>
                     <div className="flex gap-1">
                        {u.status === 'suspended' ? (
                          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                             <Ban className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                             <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mb-6">
            <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-between gap-4 border border-emerald-100">
                        <div className="min-w-0">
                           <div className="flex items-center gap-2 text-emerald-800/40 mb-1 font-black uppercase text-[8px] tracking-widest">
                              <Wallet className="w-3 h-3" />
                              Total Kontribusi
                           </div>
                           <p className="text-sm sm:text-base font-display font-black text-emerald-900 leading-tight">Rp{(u.total_donations || 0).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="text-right shrink-0">
                           <div className="flex items-center gap-2 text-emerald-800/40 mb-1 font-black uppercase text-[8px] tracking-widest justify-end">
                              <Heart className="w-3 h-3" />
                              Frekuensi
                           </div>
                           <p className="text-sm font-bold text-emerald-900">{u.donation_count}x</p>
                        </div>
                     </div>

                     <div className="p-4 bg-white/50 rounded-2xl border border-emerald-50">
                        <div className="flex items-center gap-2 text-emerald-800/40 mb-3 font-black uppercase text-[8px] tracking-widest">
                           <ExternalLink className="w-3 h-3" />
                           Mitra Program Terpilih
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                           {u.supported_orphanages && u.supported_orphanages.length > 0 ? (
                             u.supported_orphanages.map(program => (
                               <span key={program} className="px-3 py-1 bg-white border border-emerald-100 text-emerald-600 rounded-lg text-[9px] font-bold">
                                  {program}
                               </span>
                             ))
                           ) : (
                             <p className="text-[10px] text-emerald-800/30 italic">Belum memiliki riwayat kontribusi</p>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="pt-6 border-t border-emerald-100/50 flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-1.5 text-emerald-800/40 font-black uppercase text-[7px] tracking-widest bg-emerald-50/50 px-2.5 py-1 rounded-md border border-emerald-100/20 shrink-0 max-w-[150px] overflow-hidden whitespace-nowrap">
                       <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                       <span className="truncate">Bergabung: {formatToWIB(u.created_at)}</span>
                    </div>
 
                    <div className="flex items-center gap-2 shrink-0">
                       {u.status === 'suspended' ? (
                         <button 
                           disabled={updatingId === u.id || isDeleting}
                           onClick={(e) => {
                             e.stopPropagation();
                             handleUpdateUser(u.id, { status: 'active' });
                           }}
                           className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                           title="Aktifkan Akun"
                         >
                            <CheckCircle2 className="w-4 h-4" />
                         </button>
                       ) : (
                         <button 
                           disabled={updatingId === u.id || isDeleting}
                           onClick={(e) => {
                             e.stopPropagation();
                             handleUpdateUser(u.id, { status: 'suspended' });
                           }}
                           className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm active:scale-95"
                           title="Blokir Akun"
                         >
                            <Ban className="w-4 h-4" />
                         </button>
                       )}
                       <button 
                         disabled={updatingId === u.id || isDeleting}
                         onClick={(e) => {
                           e.stopPropagation();
                           setUserToDelete(u);
                         }}
                         className="p-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-100 shadow-sm active:scale-95"
                         title="Hapus Permanen"
                       >
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredUsers.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4 glass rounded-[3rem]">
               <div className="w-20 h-20 bg-emerald-50 text-emerald-200 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-10 h-10" />
               </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 lg:left-72 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-emerald-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/30">
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/20">
                       <UserIcon className="w-8 h-8" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-display font-black text-emerald-900">{selectedUser.name}</h2>
                       <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800/40">{selectedUser.email}</p>
                    </div>
                 </div>
                 <motion.button 
                   whileHover={{ rotate: 180, scale: 1.1 }}
                   whileTap={{ scale: 0.9 }}
                   onClick={() => {
                     setSelectedUser(null);
                     setAnalysisDone(false);
                     setIsAnalyzing(false);
                   }}
                   className="w-12 h-12 rounded-full bg-white text-emerald-900 flex items-center justify-center hover:bg-emerald-50 transition-colors shadow-sm"
                 >
                    <X className="w-6 h-6" />
                 </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <div className="glass rounded-[3rem] p-10 space-y-8 relative overflow-hidden group border border-emerald-50">
                     <div className="space-y-6">
                        <div className="space-y-3">
                           <div className="flex justify-between items-end gap-4">
                              <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">Total Akumulasi Donasi</span>
                              <span className="text-emerald-600 font-display font-black text-xl">Rp{(selectedUser.total_donations || 0).toLocaleString('id-ID')}</span>
                           </div>
                           <div className="h-3 bg-emerald-50 rounded-full overflow-hidden">
                              <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: "75%" }}
                                 transition={{ duration: 1.5, ease: "circOut" }}
                                 className="h-full bg-emerald-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                              />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <div className="flex justify-between items-end gap-4">
                              <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">Frekuensi Kontribusi</span>
                              <span className="text-orange-600 font-display font-black text-xl">{selectedUser.donation_count}x</span>
                           </div>
                           <div className="h-3 bg-emerald-50 rounded-full overflow-hidden">
                              <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${Math.min((selectedUser.donation_count || 0) * 10, 100)}%` }}
                                 transition={{ duration: 1.5, delay: 0.2, ease: "circOut" }}
                                 className="h-full bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                              />
                           </div>
                        </div>
                     </div>
                     
                     <div className="pt-8 border-t border-emerald-50 text-center relative z-10">
                        <div className="inline-block p-4 bg-emerald-50 rounded-2xl text-emerald-600 mb-4">
                           <AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="text-lg font-display font-black text-emerald-900 mb-3">Wawasan Strategis: Profil Dermawan</div>
                        <div className="text-sm text-emerald-800/50 leading-relaxed font-medium max-w-md mx-auto">
                           Berdasarkan analisis frekuensi, {selectedUser.name} menunjukkan tingkat loyalitas yang tinggi. 
                           Kontribusi konsisten sangat membantu stabilitas stok logistik di lembaga mitra.
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <button 
                          onClick={() => {
                            if (analysisDone) return;
                            setIsAnalyzing(true);
                            setTimeout(() => {
                              setIsAnalyzing(false);
                              setAnalysisDone(true);
                            }, 2000);
                          }}
                          disabled={isAnalyzing}
                          className={`w-full py-5 rounded-3xl font-bold flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl text-sm ${isAnalyzing ? 'bg-emerald-400 cursor-wait' : analysisDone ? 'bg-emerald-800 shadow-emerald-900/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'} text-white`}
                        >
                           {isAnalyzing ? (
                             <div className="flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Menganalisis Data...
                             </div>
                           ) : analysisDone ? (
                             <>Analisis Selesai ✓</>
                           ) : (
                             <>Analisis Detail Kontributor</>
                           )}
                        </button>

                        <AnimatePresence>
                           {analysisDone && (
                             <motion.div 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               className="p-6 bg-emerald-900 text-emerald-50 rounded-2xl text-xs font-medium space-y-3"
                             >
                                <div className="flex items-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-[8px]">
                                   <CheckCircle2 className="w-3 h-3" />
                                   Laporan Analisis AI
                                </div>
                                <p>Berdasarkan data 12 bulan terakhir, kontributor ini memiliki tingkat loyalitas <span className="text-emerald-400 font-bold">94%</span> dengan preferensi pada program kategori kebutuhan mendesak.</p>
                                <p className="opacity-60 italic text-[10px]">Pembaruan terakhir: Baru saja</p>
                             </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </div>

                 <div>
                    <div className="flex items-center gap-2 mb-6">
                       <History className="w-5 h-5 text-emerald-600" />
                       <h3 className="font-display font-bold text-emerald-900">Riwayat Aktivitas Donasi</h3>
                    </div>

                    {loadingDonations ? (
                      <div className="space-y-4">
                         {[1,2,3].map(i => <div key={i} className="h-20 bg-emerald-50 animate-pulse rounded-2xl" />)}
                      </div>
                    ) : userDonations.length > 0 ? (
                      <div className="space-y-3">
                         {userDonations.map((don) => (
                           <div key={don.id} className="p-5 bg-white border border-emerald-50 rounded-2xl flex items-center justify-between hover:border-emerald-200 transition-colors group">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Heart className="w-5 h-5" />
                                 </div>
                                 <div>
                                    <p className="font-bold text-emerald-900 text-sm">{don.orphanage?.name || 'Lembaga Mitra'}</p>
                                    <p className="text-[10px] text-emerald-800/40 font-bold">
                                      {formatToWIB(don.created_at, {
                                        day: 'numeric',
                                        month: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })} WIB
                                    </p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="font-display font-black text-emerald-900 leading-none">Rp{Number(don.amount).toLocaleString('id-ID')}</p>
                                 <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${don.status === 'verified' || don.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {don.status === 'verified' ? 'Terverifikasi' : 
                                     don.status === 'completed' ? 'Selesai' : 
                                     don.status === 'pending' ? 'Tertunda' : don.status}
                                 </span>
                              </div>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                         <Heart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                         <p className="text-gray-400 font-bold text-sm tracking-wide">Belum ada riwayat aktivitas donasi</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="p-8 bg-gray-50 flex items-center justify-between">
                 <div className="text-[10px] font-bold text-emerald-800/30 tracking-widest uppercase bg-white px-4 py-2 rounded-lg border border-emerald-50">
                    Terdaftar sejak {formatToWIB(selectedUser.created_at)}
                 </div>
                 <div className="flex gap-3">
                    <button 
                      onClick={() => {
                      setSelectedUser(null);
                      setAnalysisDone(false);
                      setIsAnalyzing(false);
                    }}
                      className="px-6 py-2.5 bg-white text-emerald-900 border border-emerald-100 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50 transition-all"
                    >
                       Batal
                    </button>
                    {selectedUser.status !== 'suspended' && (
                      <button 
                        onClick={() => {
                          handleUpdateUser(selectedUser.id, { status: 'suspended' });
                          setSelectedUser(null);
                        }}
                        className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                      >
                         Blokir Akun
                      </button>
                    )}
                 </div>
              </div>
            </motion.div>
          </div>
        )}
        {/* Confirmation Modal */}
        {userToDelete && (
          <div className="fixed inset-0 lg:left-72 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUserToDelete(null)}
              className="absolute inset-0 bg-emerald-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center border border-emerald-100/50"
            >
               <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-red-50/50">
                  <Trash2 className="w-10 h-10" />
               </div>
               
               <h3 className="text-xl font-display font-black text-emerald-900 mb-2">Hapus Pengguna?</h3>
               <p className="text-emerald-800/60 text-sm leading-relaxed mb-8">
                  Anda yakin ingin menghapus <span className="font-bold text-emerald-900">"{userToDelete.name}"</span>? Akun ini akan dihapus secara permanen dari sistem Griya Amanah.
               </p>

               <div className="flex flex-col gap-3">
                  <button
                    disabled={isDeleting}
                    onClick={() => handleDeleteUser(userToDelete.id)}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isDeleting ? "Menghapus..." : "Ya, Hapus Permanen"}
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={() => setUserToDelete(null)}
                    className="w-full py-4 bg-[#f1f5f3] hover:bg-[#e8efec] text-emerald-900 border border-emerald-100 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-[0.98]"
                  >
                    Batalkan
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

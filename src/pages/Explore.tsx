import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Target, ArrowUpRight, Plus, Edit, Trash2, AlertCircle, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Orphanage } from '../types';

export default function Explore() {
  const [orphanages, setOrphanages] = useState<Orphanage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string>('user');
  
  // Admin Features
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [displayTarget, setDisplayTarget] = useState('');

  const formatRupiah = (value: string | number) => {
    const number = String(value).replace(/\D/g, '');
    if (!number) return '';
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    image_url: '',
    target_money: 0,
    urgent_needs: '',
    is_urgent: false
  });

  const fetchData = () => {
    setLoading(true);
    fetch('/api/orphanages').then(res => res.json()).then(data => {
      // Workaround for missing is_urgent column: check for [URGENT] prefix in urgent_needs
      const processedData = (data || []).map((o: Orphanage) => {
        const isUrgent = o.urgent_needs?.startsWith('[URGENT]') || o.urgent_needs?.startsWith('[MENDESAK]');
        return {
          ...o,
          is_urgent: isUrgent,
          // If it's urgent, we show the clean needs, but we keep the marker if we were to re-save
          // Actually, for display in the form we want it clean.
          urgent_needs: isUrgent 
            ? o.urgent_needs.replace('[URGENT] ', '').replace('[MENDESAK] ', '') 
            : o.urgent_needs
        };
      });

      // Sort: Urgent items first
      const sortedData = [...processedData].sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0));
      
      setOrphanages(sortedData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('amanah_user');
    if (savedUser) {
      setUserRole(JSON.parse(savedUser).role);
    }
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      location: '',
      image_url: '',
      target_money: 0,
      urgent_needs: '',
      is_urgent: false
    });
    setFormError('');
    setIsModalOpen(true);
    setDisplayTarget('');
  };

  const handleOpenEdit = (e: React.MouseEvent, o: Orphanage) => {
    e.stopPropagation();
    setEditingId(o.id);
    setFormData({
      name: o.name,
      description: o.description,
      location: o.location,
      image_url: o.image_url,
      target_money: o.target_money,
      urgent_needs: o.urgent_needs, // Already cleaned in fetchData
      is_urgent: !!o.is_urgent
    });
    setFormError('');
    setIsModalOpen(true);
    setDisplayTarget(formatRupiah(o.target_money));
  };

  const [formError, setFormError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    
    // Get user data for auth header (fallback)
    const savedUser = localStorage.getItem('amanah_user');
    const headers: any = { 'Content-Type': 'application/json' };
    if (savedUser) headers['x-user-data'] = savedUser;

    // Clean payload: ensure number types and no extra fields
    const finalUrgentNeeds = formData.is_urgent 
      ? `[MENDESAK] ${formData.urgent_needs}` 
      : formData.urgent_needs;

    const payload: any = {
      name: formData.name,
      description: formData.description,
      location: formData.location,
      image_url: formData.image_url,
      target_money: Number(formData.target_money),
      urgent_needs: finalUrgentNeeds
    };

    if (!editingId) {
      payload.current_money = 0;
    }

    try {
      const url = editingId ? `/api/orphanages/${editingId}` : '/api/orphanages';
      const method = editingId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });
      
      const resData = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        setFormError(resData.error || 'Terjadi kesalahan pada server');
      }
    } catch (err) {
      setFormError('Gagal menghubungkan ke server');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    
    // Logika 2 langkah konfirmasi
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      // Reset konfirmasi setelah 3 detik jika tidak diklik lagi
      setTimeout(() => setDeleteConfirmId(null), 3000);
      return;
    }

    const savedUser = localStorage.getItem('amanah_user');
    const headers: any = {};
    if (savedUser) headers['x-user-data'] = savedUser;

    try {
      const res = await fetch(`/api/orphanages/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchData();
      } else {
        const errorData = await res.json();
        alert('Gagal menghapus program: ' + (errorData.error || 'Terjadi kesalahan sistem'));
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi server untuk menghapus program');
    }
  };

  const toggleUrgent = async (o: Orphanage) => {
    const savedUser = localStorage.getItem('amanah_user');
    const headers: any = { 'Content-Type': 'application/json' };
    if (savedUser) headers['x-user-data'] = savedUser;

    // Prepare toggled urgent needs
    const newUrgentStatus = !o.is_urgent;
    const cleanNeeds = o.urgent_needs;
    const finalNeeds = newUrgentStatus ? `[MENDESAK] ${cleanNeeds}` : cleanNeeds;

    try {
      const res = await fetch(`/api/orphanages/${o.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ urgent_needs: finalNeeds })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrphanages = orphanages.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
           <motion.h1 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.1 }}
             className="text-4xl font-display font-black text-emerald-900 mb-2 tracking-tight"
           >
             {userRole === 'admin' ? 'Mitra Kemanusiaan' : 'Program Kebaikan'}
           </motion.h1>
           <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="text-emerald-800/60 font-medium max-w-xl"
           >
             {userRole === 'admin' 
               ? 'Kelola data lembaga, pantau target kontribusi, dan kurasi ekosistem kebaikan.' 
               : 'Temukan dan bantu program kemanusiaan yang memerlukan dukungan lewat kontribusi Anda.'}
           </motion.p>
        </div>
        
        <div className="flex items-center gap-4">
          {userRole === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#047857' }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={handleOpenAdd}
              className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" /> Tambah Program Baru
            </motion.button>
          )}

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative w-full md:w-80 group"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari program atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-emerald-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600 transition-all font-medium text-emerald-900 shadow-sm"
            />
          </motion.div>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[1,2,3,4,5,6].map(i => <div key={i} className="h-[400px] bg-emerald-100/50 animate-pulse rounded-[2.5rem]"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredOrphanages.map((o, index) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ backgroundColor: 'rgba(236, 253, 245, 0.3)' }}
              className={`glass rounded-[2.5rem] overflow-hidden group transition-all duration-300 relative border-2 flex flex-col h-full ${o.is_urgent ? 'border-red-400/30 shadow-red-900/5 shadow-xl' : 'border-emerald-100/50 shadow-xl shadow-emerald-900/5'}`}
            >
              <div className="h-56 relative overflow-hidden shrink-0">
                <img 
                  src={o.image_url} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={o.name}
                  referrerPolicy="no-referrer"
                />
                
                {/* Badges Overlay */}
                <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap gap-2 items-start pointer-events-none">
                  {o.is_urgent && (
                    <motion.div 
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg animate-pulse pointer-events-auto"
                    >
                      <AlertCircle className="w-3 h-3" /> Mendesak
                    </motion.div>
                  )}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold text-emerald-900 border border-emerald-100 shadow-lg pointer-events-auto">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    {o.location}
                  </div>
                </div>
              </div>
              
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-3 gap-2">
                     <h3 className="text-xl font-display font-bold text-emerald-900 group-hover:text-emerald-600 transition-colors line-clamp-1">{o.name}</h3>
                     {userRole === 'admin' && (
                       <div className="flex items-center gap-2 relative z-30 shrink-0">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleOpenEdit(e, o)}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                             <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleDelete(e, o.id)}
                            title={deleteConfirmId === o.id ? "Klik lagi untuk konfirmasi" : "Hapus Program"}
                            className={`p-2 rounded-lg transition-all shadow-sm ${deleteConfirmId === o.id ? 'bg-red-600 text-white animate-pulse' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                          >
                             {deleteConfirmId === o.id ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                          </motion.button>
                       </div>
                     )}
                  </div>
                  
                  <p className="text-sm text-emerald-800/60 font-medium line-clamp-2 mb-6 leading-relaxed">
                    {o.description}
                  </p>
                </div>
                
                <div className="pt-6 border-t border-emerald-50 space-y-5 mt-auto">
                   {/* Target Dana & Progress Bar Info */}
                   <div className="space-y-3">
                     <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-emerald-700">
                        <span className="flex items-center gap-2"><Target className="w-3 h-3" /> Target Dana</span>
                        <span className="bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-emerald-600">
                          {o.target_money > 0 ? Math.round(((o.current_money || 0) / o.target_money) * 100) : 0}%
                        </span>
                     </div>
                     <div className="h-2.5 bg-emerald-100 rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${o.target_money > 0 ? Math.min(100, ((o.current_money || 0) / o.target_money) * 100) : 0}%` }}
                           transition={{ duration: 1 }}
                           className="h-full premium-gradient rounded-full"
                        />
                     </div>
                   </div>

                   <div className="flex flex-col gap-4 pt-2">
                     {userRole === 'admin' && (
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           toggleUrgent(o);
                         }}
                         className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${o.is_urgent ? 'bg-red-500 text-white shadow-xl shadow-red-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'}`}
                       >
                          {o.is_urgent ? 'Batalkan Status Mendesak' : 'Atur Sebagai Mendesak'}
                       </button>
                     )}
                     
                     <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 flex flex-col gap-5">
                        <div>
                           <div className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest mb-2">Dana Terkumpul</div>
                           <div className="text-2xl font-black text-emerald-900 leading-none">
                               Rp{(o.current_money || 0).toLocaleString('id-ID')}
                           </div>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Link 
                            to={`/app/orphanage/${o.id}`}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 group"
                          >
                             Lihat Detail Program 
                             <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                          </Link>
                        </motion.div>
                     </div>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredOrphanages.length === 0 && (
            <div className="col-span-full py-20 text-center glass rounded-[3rem]">
               <Search className="w-16 h-16 text-emerald-100 mx-auto mb-6" />
               <h3 className="text-xl font-bold text-emerald-900 mb-2">Program Tidak Ditemukan</h3>
               <p className="text-emerald-800/60">Coba gunakan kata kunci pencarian yang berbeda.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Management */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-4xl max-h-[90vh] flex flex-col"
            >
              <div className="p-8 sm:p-12 overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                       <h2 className="text-2xl font-display font-black text-emerald-900">{editingId ? 'Edit Program Kebaikan' : 'Program Kebaikan Baru'}</h2>
                       <p className="text-sm text-emerald-800/40 font-bold uppercase tracking-widest mt-1">Lengkapi informasi lembaga mitra</p>
                    </div>
                    <motion.button 
                      whileHover={{ rotate: 180, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsModalOpen(false)}
                      className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors shrink-0"
                    >
                       <X className="w-6 h-6" />
                    </motion.button>
                 </div>

                 <form onSubmit={handleSave} className="space-y-6">
                    {formError && (
                      <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
                         <AlertCircle className="w-4 h-4 shrink-0" />
                         {formError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60 ml-2">Nama Lembaga</label>
                          <input 
                            required
                            type="text" 
                            className="w-full px-6 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-600/10 focus:bg-white transition-all text-emerald-900 font-bold"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60 ml-2">Lokasi</label>
                          <input 
                            required
                            type="text" 
                            className="w-full px-6 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-600/10 focus:bg-white transition-all text-emerald-900 font-bold"
                            value={formData.location}
                            onChange={e => setFormData({...formData, location: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60 ml-2">Tautan Foto (Unsplash / Tautan Langsung)</label>
                       <input 
                         required
                         type="url" 
                         className="w-full px-6 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-600/10 focus:bg-white transition-all text-emerald-900 font-bold"
                         value={formData.image_url}
                         onChange={e => setFormData({...formData, image_url: e.target.value})}
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60 ml-2">Deskripsi Ringkas</label>
                       <textarea 
                         required
                         rows={2}
                         className="w-full px-6 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-600/10 focus:bg-white transition-all text-emerald-900 font-medium"
                         value={formData.description}
                         onChange={e => setFormData({...formData, description: e.target.value})}
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60 ml-2">Target Dana (Rp)</label>
                          <input 
                            required
                            type="text" 
                            className="w-full px-6 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-600/10 focus:bg-white transition-all text-emerald-900 font-bold"
                            value={displayTarget}
                            onChange={e => {
                               const rawVal = e.target.value.replace(/\D/g, '');
                               setDisplayTarget(formatRupiah(rawVal));
                               setFormData({...formData, target_money: rawVal ? parseInt(rawVal) : 0});
                            }}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60 ml-2">Kebutuhan Mendesak</label>
                          <input 
                            required
                            type="text" 
                            className="w-full px-6 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-600/10 focus:bg-white transition-all text-emerald-900 font-bold"
                            value={formData.urgent_needs}
                            onChange={e => setFormData({...formData, urgent_needs: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                       <button
                         type="button"
                         onClick={() => setFormData({...formData, is_urgent: !formData.is_urgent})}
                         className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${formData.is_urgent ? 'bg-red-500 border-red-500' : 'bg-white border-emerald-200'}`}
                       >
                          {formData.is_urgent && <Check className="w-4 h-4 text-white" />}
                       </button>
                       <span className="text-sm font-bold text-emerald-900">Tandai sebagai program yang sangat mendesak membutuhkan bantuan</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                       <button 
                         type="button"
                         onClick={() => setIsModalOpen(false)}
                         className="flex-1 py-5 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-100 transition-all"
                       >
                          Batalkan
                       </button>
                       <button 
                         type="submit"
                         disabled={formLoading}
                         className="flex-[2] py-5 premium-gradient text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-600/30 flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                       >
                          {formLoading ? 'Memproses...' : (editingId ? 'Simpan Pembaruan' : 'Publikasikan Lembaga')}
                       </button>
                    </div>
                 </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

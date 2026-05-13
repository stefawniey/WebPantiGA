import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Search, 
  History, 
  Heart, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck,
  BarChart3,
  Users,
  Bell
} from 'lucide-react';
import { User } from '../types';
import { useState } from 'react';

interface AppLayoutProps {
  user: User;
  setUser: (user: User | null) => void;
}

export default function AppLayout({ user, setUser }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Validasi Kontribusi', msg: 'Terdapat logistik baru dari Budi Santoso yang menanti validasi.', time: '5m', path: '/app', isRead: false },
    { id: 2, title: 'Laporan Mingguan', msg: 'Analisis performa komprehensif untuk periode ini telah tersedia.', time: '2j', path: '/app/reports', isRead: false },
    { id: 3, title: 'Wawasan Strategis', msg: 'Optimalisasi distribusi logistik disarankan bagi wilayah Jawa Barat.', time: '1h', path: '/app', isRead: false },
  ]);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNotifClick = (notif: any) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    setIsNotifOpen(false);
    setSelectedNotif(notif);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    localStorage.removeItem('amanah_user');
    setUser(null);
    navigate('/');
  };

  const navItems = user.role === 'admin' ? [
    { label: 'Dasbor', path: '/app', icon: LayoutDashboard },
    { label: 'Ekosistem Mitra', path: '/app/explore', icon: ShieldCheck },
    { label: 'Manajemen Pengguna', path: '/app/users', icon: Users },
    { label: 'Laporan Donasi', path: '/app/reports', icon: BarChart3 },
  ] : [
    { label: 'Dasbor', path: '/app', icon: LayoutDashboard },
    { label: 'Telusuri Program', path: '/app/explore', icon: Search },
    { label: 'Riwayat Donasi', path: '/app/my-donations', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-beige flex">
      {/* Sidebar */}
      {isSidebarOpen && (
        <aside
          className="fixed lg:relative z-50 w-72 h-screen bg-emerald-900 text-white p-6 flex flex-col shadow-2xl"
        >
          <div className="flex items-center justify-between mb-12 px-2">
            <Link to="/app" className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 rounded">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold tracking-tight">Griya Amanah</span>
            </Link>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="w-10 h-10 flex items-center justify-center hover:bg-emerald-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pb-12 no-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group
                      ${isActive 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 font-bold' 
                        : 'text-emerald-100/60 hover:bg-emerald-800 hover:text-white font-medium'}
                    `}
                  >
                    <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-emerald-100/40'}`} />
                    {item.label}
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="pt-8 border-t border-emerald-800">
             <div className="p-4 bg-emerald-800/40 rounded-2xl mb-4 border border-emerald-800/50">
                <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-1">Status Akun</div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  {user.role === 'admin' ? 'Administrator' : 'Donatur Aktif'}
                </div>
             </div>
             
             <button 
               onClick={handleLogout}
               className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-300 hover:bg-red-500/10 hover:text-red-400 transition-all font-bold group"
              >
                <LogOut className="w-5 h-5 transition-transform" />
                Keluar
             </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen">
        {/* Topbar */}
        <header className="h-20 px-8 flex items-center justify-between bg-white border-b border-emerald-100 shrink-0">
          <div className="flex items-center gap-4">
             {!isSidebarOpen && (
               <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-900"
               >
                 <Menu className="w-6 h-6" />
               </button>
             )}
             <div className="hidden md:block">
                <h2 className="text-lg font-bold text-emerald-900">
                   {user.role === 'admin' ? 'Panel Kendali Utama' : `Selamat Datang, ${user.name}`}
                </h2>
                <p className="text-xs text-emerald-800/50 font-medium">
                  {user.role === 'admin' 
                    ? 'Manajemen ekosistem kemanusiaan, validasi kontribusi, dan pemantauan operasional.' 
                    : 'Apresiasi kami atas dedikasi Anda dalam mendukung nilai-nilai kemanusiaan.'}
                </p>
             </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`p-2.5 rounded-xl transition-all relative ${isNotifOpen ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-emerald-800/60 hover:text-emerald-600 hover:bg-emerald-50 active:scale-95'}`}
            >
               <Bell className="w-5 h-5" />
               {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white rounded-[2rem] shadow-4xl border border-emerald-50 z-50 p-6">
                  <div className="flex items-center justify-between mb-6">
                     <h4 className="font-display font-bold text-emerald-900">Notifikasi Terkini</h4>
                     <button 
                       onClick={markAllRead}
                       className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline disabled:opacity-30"
                       disabled={unreadCount === 0}
                     >
                       Tandai Dibaca
                     </button>
                  </div>

                  <div className="space-y-4">
                     {notifications.map((notif) => (
                       <div 
                         key={notif.id} 
                         onClick={() => handleNotifClick(notif)}
                         className={`p-4 rounded-2xl border transition-all cursor-pointer group relative ${
                           notif.isRead 
                             ? 'bg-white border-emerald-50 opacity-60' 
                             : 'bg-beige/40 border-emerald-100/50 hover:bg-white hover:border-emerald-200 active:scale-[0.99]'
                         }`}
                       >
                          {!notif.isRead && <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-emerald-600 rounded-full shadow-[0_0_8px_rgba(5,150,105,0.6)]"></div>}
                          <div className="flex justify-between items-start mb-1 mr-4">
                             <div className="text-sm font-bold text-emerald-900 group-hover:text-emerald-600 transition-colors">{notif.title}</div>
                             <div className="text-[9px] font-bold text-emerald-800/30 uppercase">{notif.time} Berlalu</div>
                          </div>
                          <div className="text-xs text-emerald-800/60 leading-relaxed font-medium">{notif.msg}</div>
                       </div>
                     ))}
                  </div>
                </div>
              </>
            )}
            <div className="h-8 w-[1px] bg-emerald-100 mx-2"></div>
            
            <div className="relative">
                <button 
                   onClick={() => setIsAccountOpen(!isAccountOpen)}
                   className={`flex items-center gap-3 pl-2 p-1.5 rounded-2xl transition-all active:scale-95 ${isAccountOpen ? 'bg-emerald-50' : 'hover:bg-emerald-50/50'}`}
                >
                   <div className="text-right hidden sm:block">
                      <div className="text-sm font-bold text-emerald-900">{user.name}</div>
                      <div className="text-[10px] font-bold text-gold uppercase tracking-wider">
                         {user.role === 'admin' ? 'Administrator' : 'Pengguna'}
                      </div>
                   </div>
                   <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200 group-hover:shadow-emerald-300">
                      {user.name.charAt(0)}
                   </div>
                </button>

                {isAccountOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsAccountOpen(false)}></div>
                    <div className="absolute right-0 top-14 w-64 bg-white rounded-[2rem] shadow-4xl border border-emerald-50 z-50 p-6">
                      <div className="text-center mb-6">
                         <div className="w-16 h-16 rounded-2xl premium-gradient flex items-center justify-center text-white text-2xl font-black mx-auto mb-3 shadow-xl shadow-emerald-100">
                            {user.name.charAt(0)}
                         </div>
                         <h4 className="font-display font-black text-emerald-900 text-lg leading-tight">{user.name}</h4>
                         <p className="text-xs text-emerald-800/40 font-bold uppercase tracking-widest mt-1">
                            {user.role === 'admin' ? 'Administrator' : 'Pengguna'}
                         </p>
                         <p className="text-[10px] text-emerald-800/30 mt-1 truncate">{user.email}</p>
                      </div>

                      <div className="space-y-2">
                         <div className="pt-2 border-t border-emerald-50">
                            <button 
                              onClick={() => { setIsAccountOpen(false); handleLogout(); }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
                            >
                               <LogOut className="w-4 h-4" />
                               Keluar dari Sistem
                            </button>
                         </div>
                      </div>
                    </div>
                  </>
                )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <section className="flex-1 overflow-y-auto p-8 relative no-scrollbar">
           <Outlet />
        </section>

        {/* Notification Detail Modal */}
        {selectedNotif && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              onClick={() => setSelectedNotif(null)}
              className="absolute inset-0 bg-emerald-900/40 backdrop-blur-sm"
            ></div>
            <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-4xl overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[5rem] -z-10 opacity-50"></div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Bell className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Pemberitahuan Sistem</div>
                  <h3 className="text-2xl font-display font-black text-emerald-900">{selectedNotif.title}</h3>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                  <p className="text-emerald-900 font-medium leading-relaxed italic">
                    "{selectedNotif.msg}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-emerald-800/40 uppercase tracking-wider">
                  <span>Waktu Terbit: {selectedNotif.time} yang lalu</span>
                  <span>Status: Terverifikasi</span>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => setSelectedNotif(null)}
                  className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Building, Building2, Users, Megaphone, Settings, LogOut,
    Briefcase, Shield, BarChart2, Calendar, LayoutTemplate,
    Search, Bell, Menu, Home, Grid, X, FileText, Zap, PanelLeft, Mail, PenTool
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

const AdminLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const { currentUser, setCurrentUser } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isSuperAdmin = currentUser?.role === 'super_admin';

    // Mobile Menu State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        // Buscar tarefas atrasadas para o badge de notificação
        const fetchPending = async () => {
            try {
                const tasks = await api.tasks.list({ completed: 'false' });
                const overdue = tasks.filter((t: any) => new Date(t.dueDate) < new Date());
                setPendingCount(overdue.length);
            } catch { /* silencioso */ }
        };
        fetchPending();
        const interval = setInterval(fetchPending, 5 * 60_000); // atualiza a cada 5min
        return () => clearInterval(interval);
    }, []);

    // Desktop Sidebar States (Toggles)
    const [showLeftSidebar, setShowLeftSidebar] = useState(true);
    const [showRightSidebar, setShowRightSidebar] = useState(true);

    const [teamUsers, setTeamUsers] = useState<any[]>([]);

    useEffect(() => {
        // Buscar usuários reais da equipe
        const fetchTeam = async () => {
            try {
                const users = await api.users.getAll();
                setTeamUsers(users.slice(0, 6));
            } catch { /* silencioso */ }
        };
        if (isAdmin) fetchTeam();
    }, [isAdmin]);

    useEffect(() => {
        // We rely on AuthContext for current user state
        // If context says null, we redirect. 
        if (!currentUser) {
            navigate('/login');
            return;
        }
        if (currentUser.role === 'user') {
            navigate('/buyer/dashboard');
            return;
        }
        setUser({
            ...currentUser,
            avatar: 'https://i.pravatar.cc/150?u=' + currentUser.id
        } as User);
    }, [currentUser, navigate]);

    const handleLogout = () => {
        api.auth.logout();
        setCurrentUser(null);
        navigate('/');
    };

    const toggleLeftSidebar = () => {
        // On mobile, this toggles the overlay menu
        if (window.innerWidth < 768) {
            setIsMobileMenuOpen(!isMobileMenuOpen);
        } else {
            // On desktop, this toggles the sidebar visibility
            setShowLeftSidebar(!showLeftSidebar);
        }
    };

    const NavItem = ({ to, icon: Icon, label, exact = false }: { to: string; icon: any; label: string, exact?: boolean }) => {
        const active = exact ? location.pathname === to : location.pathname.startsWith(to);

        return (
            <Link
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 mb-0.5 group relative ${active
                    ? 'bg-brand-50 shadow-sm'
                    : 'hover:bg-gray-100'
                    }`}
            >
                <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0
            ${active ? 'bg-brand-600 text-white shadow-brand' : 'text-gray-500 group-hover:text-brand-600 group-hover:bg-brand-50'}
        `}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className={`font-medium text-sm truncate transition-opacity duration-200 ${showLeftSidebar ? 'opacity-100' : 'opacity-0 md:hidden'} ${active ? 'text-brand-800 font-semibold' : 'text-gray-600'}`}>
                    {label}
                </span>
                {active && <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-brand-500" />}
            </Link>
        );
    };

    // Header Tab Item (Center Navigation)
    const HeaderTab = ({ to, icon: Icon, activeCheck }: { to: string, icon: any, activeCheck: boolean }) => (
        <Link
            to={to}
            className={`flex-1 md:flex-none h-full flex items-center justify-center px-4 md:px-8 border-b-2 transition-all duration-150 relative group ${activeCheck
                ? 'border-brand-500 text-brand-600 bg-brand-50/50'
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/80'
                }`}
        >
            <Icon className={`w-6 h-6 ${activeCheck ? '' : ''}`} />
            <div className="absolute -bottom-10 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {to.replace('/admin', '').replace('/', '') || 'Início'}
            </div>
        </Link>
    );


    // Scale Effect removed to allow ThemeContext to control global scale


    if (!user) return null;


    return (
        <div className="min-h-screen bg-surface-100 font-sans flex flex-col overflow-hidden">

            {/* --- HEADER (Facebook Style) --- */}
            <header className="h-14 bg-white/90 backdrop-blur-md border-b border-gray-100 fixed top-0 w-full z-50 flex items-center justify-between px-4 shadow-sm">

                {/* Left: Logo & Search */}
                <div className="flex items-center gap-2 md:w-[300px]">
                    {/* Sidebar Toggle Button */}
                    <button
                        onClick={toggleLeftSidebar}
                        className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-600 transition-colors mr-1"
                        title={showLeftSidebar ? "Ocultar Menu" : "Mostrar Menu"}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    <Link to="/admin" className="flex-shrink-0">
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white shadow-brand">
                            <Building className="w-5 h-5" />
                        </div>
                    </Link>
                    <div className="relative hidden lg:block ml-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Pesquisar no sistema..."
                            className="bg-[#F0F2F5] pl-9 pr-4 py-2.5 rounded-full text-sm outline-none focus:ring-1 focus:ring-brand-500 w-60 placeholder-gray-500 text-gray-700"
                        />
                    </div>
                </div>

                {/* Center: Main Navigation Tabs */}
                <nav className="hidden md:flex h-full items-center justify-center flex-1 max-w-2xl gap-1">
                    <HeaderTab to="/admin" icon={Home} activeCheck={location.pathname === '/admin'} />
                    <HeaderTab to="/admin/crm" icon={Users} activeCheck={location.pathname.includes('/admin/crm')} />
                    <HeaderTab to="/admin/properties" icon={LayoutTemplate} activeCheck={location.pathname.includes('/admin/properties')} />
                    <HeaderTab to="/admin/whatsapp" icon={Zap} activeCheck={location.pathname.includes('/admin/whatsapp')} />
                    <HeaderTab to="/admin/calendar" icon={Calendar} activeCheck={location.pathname.includes('/admin/calendar')} />
                </nav>

                {/* Right: User Actions */}
                <div className="flex items-center justify-end gap-2 md:w-[300px]">

                    {/* Right Sidebar Toggle (Grid Icon) */}
                    <button
                        onClick={() => setShowRightSidebar(!showRightSidebar)}
                        className={`hidden md:flex w-9 h-9 rounded-xl items-center justify-center transition-colors text-gray-600 relative ${!showRightSidebar ? 'bg-brand-100 text-brand-600' : 'hover:bg-gray-100'}`}
                        title={showRightSidebar ? "Ocultar Mural" : "Mostrar Mural"}
                    >
                        <Grid className="w-5 h-5" />
                    </button>

                    <button className="w-9 h-9 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-colors text-gray-600 relative">
                        <Bell className="w-5 h-5 fill-black" />
                        {pendingCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center border-2 border-white">{pendingCount > 9 ? "9+" : pendingCount}</span>}
                    </button>

                    {/* Profile Dropdown Trigger */}
                    <div className="relative group ml-1">
                        <button className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        </button>
                        {/* Simple Dropdown */}
                        <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-gray-100 w-60 p-2 hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50">
                            <div className="p-2 border-b border-gray-100 mb-2">
                                <p className="font-bold text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                            </div>
                            <Link to="/admin/settings" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md text-sm text-gray-700">
                                <Settings className="w-4 h-4" /> Configurações
                            </Link>
                            <button onClick={handleLogout} className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md text-sm text-red-600">
                                <LogOut className="w-4 h-4" /> Sair
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- BODY LAYOUT --- */}
            <div className="flex pt-14 h-screen relative">

                {/* LEFT SIDEBAR (Tools) */}
                <aside className={`
            fixed md:static inset-y-0 left-0 z-40 bg-surface-100 md:bg-transparent overflow-y-auto custom-scrollbar transform transition-all duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0 bg-white shadow-2xl pt-14 w-[280px]' : '-translate-x-full md:translate-x-0'}
            ${showLeftSidebar ? 'md:w-[280px]' : 'md:w-0 md:opacity-0 md:overflow-hidden'}
            p-4 hover:overflow-y-auto
          `}>
                    <div className="flex flex-col min-w-[250px]">
                        {/* User Profile Summary (Mobile Only) */}
                        <div className="md:hidden flex items-center gap-3 mb-6 p-2">
                            <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                            <div>
                                <p className="font-bold">{user.name}</p>
                                <Link to="/admin/settings" className="text-xs text-brand-600">Ver Perfil</Link>
                            </div>
                        </div>

                        <NavItem to="/admin" icon={LayoutDashboard} label="Visão Geral" exact />
                        <NavItem to="/admin/crm" icon={Users} label="CRM & Leads" />
                        <NavItem to="/admin/properties" icon={Building} label="Meus Imóveis" />
                        <NavItem to="/admin/gestao-imobiliaria" icon={Building2} label="Gestão Imobiliária" />
                        <NavItem to="/admin/calendar" icon={Calendar} label="Agenda" />

                        <hr className="border-gray-300 my-2 mx-3" />

                        <div className="px-3 mb-1 mt-2 flex justify-between items-center group cursor-pointer">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-500">Comunicação</span>
                        </div>
                        <NavItem to="/admin/whatsapp" icon={Zap} label="WhatsApp Marketing" />
                        <NavItem to="/admin/email-marketing" icon={Mail} label="Email Marketing" />
                        <NavItem to="/admin/marketing" icon={BarChart2} label="Redes Sociais" />
                        <NavItem to="/admin/campaigns" icon={Megaphone} label="Campanhas" />

                        <hr className="border-gray-300 my-2 mx-3" />

                        <div className="px-3 mb-1 mt-2 flex justify-between items-center group cursor-pointer">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Utilitários</span>
                        </div>
                        <NavItem to="/admin/pdf-tools" icon={FileText} label="Ferramentas PDF" />
                        <NavItem to="/admin/assinaturas" icon={PenTool} label="Assinaturas eDocs" />


                        {isAdmin && (
                            <>
                                <hr className="border-gray-300 my-2 mx-3" />
                                <div className="px-3 mb-1 mt-2">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Administração</span>
                                </div>
                                {isSuperAdmin && (
                                    <NavItem to="/admin/saas" icon={PanelLeft} label="Admin Geral (SaaS)" />
                                )}
                                <NavItem to="/admin/users" icon={Shield} label="Usuários" />
                                <NavItem to="/admin/site-content" icon={LayoutTemplate} label="Gestão do Site" />
                                <NavItem to="/admin/jobs" icon={Briefcase} label="RH & Vagas" />
                                <NavItem to="/admin/settings" icon={Settings} label="Configurações" />
                                <NavItem to="/admin/config" icon={Shield} label="Admin & Recuperação" />
                            </>
                        )}
                    </div>

                    <div className="mt-8 px-3 text-xs text-gray-500 min-w-[250px]">
                        <p className="font-semibold text-gray-500">Ivillar CRM</p><p className="text-gray-400">© {new Date().getFullYear()} · v2.0</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                            <a href="#" className="hover:underline">Privacidade</a> •
                            <a href="#" className="hover:underline">Termos</a> •
                            <a href="#" className="hover:underline">Suporte</a>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT (Center Feed) */}
                <main className="flex-1 overflow-y-auto custom-scrollbar px-2 md:px-6 py-6 w-full relative transition-all duration-300" id="main-content">
                    <div className="w-full h-full pb-20">
                        <Outlet />
                    </div>
                </main>

                {/* RIGHT SIDEBAR (Notifications/Mini Blog) */}
                <aside className={`
                hidden xl:block overflow-y-auto custom-scrollbar sticky top-14 h-[calc(100vh-56px)] transition-all duration-300 ease-in-out
                ${showRightSidebar ? 'w-[360px] p-4 pr-4 opacity-100' : 'w-0 p-0 opacity-0 overflow-hidden'}
          `}>
                    <div className="min-w-[320px]">
                        {/* Mural Section */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center px-2 mb-3">
                                <h3 className="text-gray-500 font-semibold text-sm">Mural da Empresa</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                                    <p className="text-xs text-gray-400">Nenhum aviso no momento</p>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-300 my-4 mx-2" />

                        {/* Contacts Section */}
                        <div>
                            <div className="flex justify-between items-center px-2 mb-2">
                                <h3 className="text-gray-500 font-semibold text-sm">Contatos</h3>
                                <div className="flex gap-2">
                                    <Search size={14} className="text-gray-500 cursor-pointer" />
                                    <Settings size={14} className="text-gray-500 cursor-pointer" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                {teamUsers.length > 0 ? teamUsers.map((u: any) => (
                                    <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                                        <div className="relative">
                                            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold border border-gray-200">
                                                {u.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-3 h-3 border-2 border-[#F0F2F5] rounded-full bg-green-500"></div>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-900">{u.name}</span>
                                            <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-xs text-gray-400 px-2">Nenhum usuário encontrado</p>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    );
};

export default AdminLayout;

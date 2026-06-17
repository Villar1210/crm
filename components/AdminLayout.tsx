import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Building, Building2, Users, Megaphone, Settings, LogOut, HelpCircle,
    Briefcase, Shield, BarChart2, Calendar, LayoutTemplate,
    Search, Bell, Menu, Home, X, FileText, Zap, PanelLeft, Mail, PenTool, Moon, Sun
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User } from '../types';

const AdminLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const { currentUser, setCurrentUser } = useAuth();
    const { theme, setTheme, isDarkMode } = useTheme();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isSuperAdmin = currentUser?.role === 'super_admin';

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showLeftSidebar, setShowLeftSidebar] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            navigate('/buyer/login');
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

    const toggleTheme = () => {
        setTheme(isDarkMode ? 'light' : 'dark');
    };

    const toggleLeftSidebar = () => {
        if (window.innerWidth < 768) {
            setIsMobileMenuOpen(!isMobileMenuOpen);
        } else {
            setShowLeftSidebar(!showLeftSidebar);
        }
    };

    const NavItem = ({ to, icon: Icon, label, exact = false }: { to: string; icon: any; label: string, exact?: boolean }) => {
        const active = exact ? location.pathname === to : location.pathname.startsWith(to);

        return (
            <Link
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-1 group relative ${active
                    ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 shadow-sm'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300'
                    }`}
            >
                <div className={`
                    w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                    ${active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400'}
                `}>
                    <Icon className={`w-5 h-5 ${active ? 'fill-brand-600/20 dark:fill-brand-400/20' : ''}`} />
                </div>
                <span className={`font-medium text-sm truncate transition-opacity duration-300 ${showLeftSidebar ? 'opacity-100' : 'opacity-0 md:hidden'} ${active ? 'font-bold' : ''}`}>
                    {label}
                </span>
                
                {/* Tooltip for collapsed mode */}
                {!showLeftSidebar && (
                    <div className="absolute left-14 opacity-0 group-hover:opacity-100 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs px-2 py-1 rounded transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 hidden md:block shadow-lg">
                        {label}
                    </div>
                )}
            </Link>
        );
    };

    const HeaderTab = ({ to, icon: Icon, activeCheck }: { to: string, icon: any, activeCheck: boolean }) => (
        <Link
            to={to}
            className={`flex-1 md:flex-none h-full flex items-center justify-center px-4 md:px-10 border-b-[3px] transition-all relative group ${activeCheck
                ? 'border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg md:rounded-none md:hover:bg-transparent'
                }`}
        >
            <Icon className={`w-6 h-6 ${activeCheck ? 'fill-brand-600/20 dark:fill-brand-400/20' : ''}`} />
            <div className="absolute -bottom-12 opacity-0 group-hover:opacity-100 bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                Ir para o módulo
            </div>
        </Link>
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#0f172a] font-sans flex flex-col overflow-hidden text-gray-900 dark:text-gray-100 transition-colors duration-300">
            {/* --- HEADER (Glassmorphism + Dark Mode Ready) --- */}
            <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm dark:shadow-gray-900/50 fixed top-0 w-full z-50 flex items-center justify-between px-4 border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300">
                <div className="flex items-center gap-2 md:w-[300px]">
                    <button
                        onClick={toggleLeftSidebar}
                        className="w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors mr-1"
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <Link to="/admin" className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                            <Building className="w-5 h-5 fill-white" />
                        </div>
                    </Link>
                    <div className="relative hidden lg:block ml-2 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 w-4 h-4 transition-colors" />
                        <input
                            type="text"
                            placeholder="Pesquisar..."
                            className="bg-gray-100 dark:bg-gray-800 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/50 w-64 placeholder-gray-500 dark:placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all border border-transparent focus:border-brand-500/30"
                        />
                    </div>
                </div>

                {/* Center: Main Navigation Tabs */}
                <nav className="hidden md:flex h-full items-center justify-center flex-1 max-w-2xl gap-1">
                    <HeaderTab to="/admin" icon={Home} activeCheck={location.pathname === '/admin'} />
                    <HeaderTab to="/admin/crm" icon={Users} activeCheck={location.pathname.includes('/admin/crm')} />
                    <HeaderTab to="/admin/gestao-imobiliaria" icon={Building2} activeCheck={location.pathname.includes('/admin/gestao-imobiliaria')} />
                    <HeaderTab to="/admin/whatsapp" icon={Zap} activeCheck={location.pathname.includes('/admin/whatsapp')} />
                    <HeaderTab to="/admin/calendar" icon={Calendar} activeCheck={location.pathname.includes('/admin/calendar')} />
                </nav>

                {/* Right: User Actions */}
                <div className="flex items-center justify-end gap-3 md:w-[300px]">
                    {/* Theme Toggle Button */}
                    <button onClick={toggleTheme} aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'} className="w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center justify-center transition-colors text-gray-600 dark:text-gray-300">
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    <button aria-label="Notificações" className="w-10 h-10 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl flex items-center justify-center transition-colors text-gray-800 dark:text-gray-200 relative border border-transparent dark:border-gray-700">
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm">3</span>
                    </button>

                    <div className="relative group ml-1">
                        <button aria-label="Menu do perfil" className="w-10 h-10 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-400 transition-colors shadow-sm">
                            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        </button>
                        <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 w-64 p-2 hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50">
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700 mb-2 flex items-center gap-3">
                                <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{user.name}</p>
                                    <p className="text-xs text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">{user.role}</p>
                                </div>
                            </div>
                            <Link to="/admin/config" className="flex items-center gap-2 p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors">
                                <Settings className="w-4 h-4" /> Configurações de Conta
                            </Link>
                            <button onClick={handleLogout} className="w-full flex items-center gap-2 p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-sm text-red-600 dark:text-red-400 transition-colors mt-1">
                                <LogOut className="w-4 h-4" /> Finalizar Sessão
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- BODY LAYOUT --- */}
            <div className="flex pt-16 h-screen relative">
                {/* LEFT SIDEBAR (Glassmorphism Panel) */}
                <aside className={`
                    fixed md:static inset-y-0 left-0 z-40 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl md:bg-transparent md:dark:bg-transparent border-r border-gray-200/50 dark:border-gray-800/50
                    overflow-y-auto custom-scrollbar transform transition-all duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl pt-16 w-[280px]' : '-translate-x-full md:translate-x-0'}
                    ${showLeftSidebar ? 'md:w-[280px]' : 'md:w-[72px]'}
                    p-3 hover:overflow-y-auto flex flex-col group/sidebar
                `}>
                    <div className="flex-1">
                        <div className="md:hidden flex items-center gap-3 mb-6 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <img src={user.avatar} alt="" className="w-10 h-10 rounded-xl" />
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                                <Link to="/admin/config" className="text-xs text-brand-600 dark:text-brand-400">Ver Perfil</Link>
                            </div>
                        </div>

                        <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Visão Geral" />
                        <NavItem to="/admin/crm" icon={Users} label="CRM & Leads" />
                        <NavItem to="/admin/properties" icon={Building} label="Meus Imóveis" />
                        <NavItem to="/admin/gestao-imobiliaria" icon={Building2} label="Gestão Imobiliária" />
                        <NavItem to="/admin/calendar" icon={Calendar} label="Agenda" />

                        <div className={`mt-4 mb-2 px-3 transition-opacity duration-300 ${showLeftSidebar ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>
                            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Comunicação</span>
                        </div>
                        <NavItem to="/admin/whatsapp" icon={Zap} label="WhatsApp Marketing" />
                        <NavItem to="/admin/email-marketing" icon={Mail} label="Email Marketing" />
                        <NavItem to="/admin/marketing" icon={BarChart2} label="Redes Sociais" />
                        <NavItem to="/admin/campaigns" icon={Megaphone} label="Campanhas Ativas" />

                        <div className={`mt-4 mb-2 px-3 transition-opacity duration-300 ${showLeftSidebar ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>
                            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Utilitários</span>
                        </div>
                        <NavItem to="/admin/pdf-tools" icon={FileText} label="Ferramentas PDF" />
                        <NavItem to="/admin/assinaturas" icon={PenTool} label="Assinaturas eDocs" />

                        {isAdmin && (
                            <>
                                <div className={`mt-4 mb-2 px-3 transition-opacity duration-300 ${showLeftSidebar ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>
                                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Administração</span>
                                </div>
                                {isSuperAdmin && (
                                    <NavItem to="/admin/saas" icon={PanelLeft} label="Admin SaaS" />
                                )}
                                <NavItem to="/admin/site-content" icon={LayoutTemplate} label="Design Front-end" />
                                <NavItem to="/admin/security" icon={Shield} label="Segurança" />
                                <NavItem to="/admin/config" icon={Settings} label="Ajustes de Conta" />
                                <NavItem to="/admin/help" icon={HelpCircle} label="Ajuda" />
                            </>
                        )}
                    </div>

                    <div className={`mt-8 px-3 text-xs text-gray-400 dark:text-gray-500 pb-4 transition-opacity duration-300 ${showLeftSidebar ? 'opacity-100' : 'opacity-0 hidden'}`}>
                        <div className="p-4 bg-gradient-to-br from-brand-600 to-brand-500 rounded-xl text-white mb-4 shadow-lg shadow-brand-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                            <Shield className="w-5 h-5 mb-2 text-brand-100" />
                            <p className="font-bold relative z-10">Luxe Estate Pro</p>
                            <p className="text-[10px] text-brand-100 relative z-10">Protegido por iVillar Security</p>
                        </div>
                        <p className="font-medium">Ivillar System © 2025</p>
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 overflow-y-auto custom-scrollbar px-2 md:px-6 py-6 w-full relative transition-all duration-300" id="main-content">
                    <div className="w-full h-full pb-20 max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Menu Backdrop */}
                {isMobileMenuOpen && (
                    <div 
                        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 md:hidden" 
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminLayout;


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

    // Desktop Sidebar States (Toggles)
    const [showLeftSidebar, setShowLeftSidebar] = useState(true);
    const [showRightSidebar, setShowRightSidebar] = useState(true);

    // Simulação de Notícias do "Mini-Blog" (Mural da Empresa)
    const systemNews = [
        { id: 1, title: 'Meta do Mês Batida! 🚀', content: 'Parabéns ao time de vendas, alcançamos 110% da meta de Março.', date: '2h atrás', author: 'Diretoria' },
        { id: 2, title: 'Novo Empreendimento', content: 'O material do "Horizon Residence" já está disponível na pasta de arquivos.', date: '5h atrás', author: 'Marketing' },
        { id: 3, title: 'Manutenção no Sistema', content: 'O CRM passará por atualização nesta sexta às 23h.', date: '1d atrás', author: 'Tech' },
    ];

    // Simulação de Contatos Online
    const onlineContacts = [
        { id: 'u1', name: 'Daniel Villar', avatar: 'https://i.pravatar.cc/150?u=admin', status: 'online' },
        { id: 'u2', name: 'Eduardo Santos', avatar: 'https://i.pravatar.cc/150?u=eduardo', status: 'online' },
        { id: 'u3', name: 'Camila Torres', avatar: 'https://i.pravatar.cc/150?u=camila', status: 'busy' },
    ];

    useEffect(() => {
        // We rely on AuthContext for current user state
        // If context says null, we redirect. 
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-1 group relative ${active
                    ? 'bg-[#EAF3FF]'
                    : 'hover:bg-gray-200'
                    }`}
            >
                <div className={`
            w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0
            ${active ? 'text-brand-600' : 'text-brand-600/80 group-hover:text-brand-700'}
        `}>
                    <Icon className={`w-6 h-6 ${active ? 'fill-brand-600' : ''}`} />
                </div>
                <span className={`font-medium text-sm truncate transition-opacity duration-300 ${showLeftSidebar ? 'opacity-100' : 'opacity-0 md:hidden'} ${active ? 'text-brand-900 font-bold' : 'text-gray-700'}`}>
                    {label}
                </span>
            </Link>
        );
    };

    // Header Tab Item (Center Navigation)
    const HeaderTab = ({ to, icon: Icon, activeCheck }: { to: string, icon: any, activeCheck: boolean }) => (
        <Link
            to={to}
            className={`flex-1 md:flex-none h-full flex items-center justify-center px-4 md:px-10 border-b-[3px] transition-all relative group ${activeCheck
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:bg-gray-100 rounded-lg md:rounded-none md:hover:bg-transparent md:hover:bg-gray-50'
                }`}
        >
            <Icon className={`w-7 h-7 ${activeCheck ? 'fill-brand-600' : ''}`} />
            {/* Tooltip on Hover */}
            <div className="absolute -bottom-12 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs px-2 py-1 rounded transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Ir para {to.replace('/admin', '').replace('/', '') || 'Início'}
            </div>
        </Link>
    );


    // Scale Effect removed to allow ThemeContext to control global scale


    if (!user) return null;


    return (
        <div className="min-h-screen bg-[#F0F2F5] font-sans flex flex-col overflow-hidden">

            {/* --- HEADER (Facebook Style) --- */}
            <header className="h-14 bg-white shadow-sm fixed top-0 w-full z-50 flex items-center justify-between px-4">

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
                        <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white">
                            <Building className="w-6 h-6 fill-white" />
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
                        className={`hidden md:flex w-10 h-10 rounded-full items-center justify-center transition-colors text-black relative ${!showRightSidebar ? 'bg-gray-200' : 'bg-[#E4E6EB] hover:bg-[#D8DADF]'}`}
                        title={showRightSidebar ? "Ocultar Mural" : "Mostrar Mural"}
                    >
                        <Grid className="w-5 h-5" />
                    </button>

                    <button className="w-10 h-10 bg-[#E4E6EB] hover:bg-[#D8DADF] rounded-full flex items-center justify-center transition-colors text-black relative">
                        <Bell className="w-5 h-5 fill-black" />
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center border-2 border-white">3</span>
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
            fixed md:static inset-y-0 left-0 z-40 bg-[#F0F2F5] md:bg-transparent overflow-y-auto custom-scrollbar transform transition-all duration-300 ease-in-out
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
                            <span className="text-[14px] font-semibold text-gray-500 group-hover:text-gray-700">Comunicação</span>
                        </div>
                        <NavItem to="/admin/whatsapp" icon={Zap} label="WhatsApp Marketing" />
                        <NavItem to="/admin/email-marketing" icon={Mail} label="Email Marketing" />
                        <NavItem to="/admin/marketing" icon={BarChart2} label="Redes Sociais" />
                        <NavItem to="/admin/campaigns" icon={Megaphone} label="Campanhas" />

                        <hr className="border-gray-300 my-2 mx-3" />

                        <div className="px-3 mb-1 mt-2 flex justify-between items-center group cursor-pointer">
                            <span className="text-[14px] font-semibold text-gray-500 group-hover:text-gray-700">Utilitários</span>
                        </div>
                        <NavItem to="/admin/pdf-tools" icon={FileText} label="Ferramentas PDF" />
                        <NavItem to="/admin/assinaturas" icon={PenTool} label="Assinaturas eDocs" />


                        {isAdmin && (
                            <>
                                <hr className="border-gray-300 my-2 mx-3" />
                                <div className="px-3 mb-1 mt-2">
                                    <span className="text-[14px] font-semibold text-gray-500">Administração</span>
                                </div>
                                {isSuperAdmin && (
                                    <NavItem to="/admin/saas" icon={PanelLeft} label="Admin Geral (SaaS)" />
                                )}
                                <NavItem to="/admin/users" icon={Shield} label="Usuários" />
                                <NavItem to="/admin/site-content" icon={LayoutTemplate} label="Gestão do Site" />
                                <NavItem to="/admin/jobs" icon={Briefcase} label="RH & Vagas" />
                                <NavItem to="/admin/settings" icon={Settings} label="Configurações" />
                            </>
                        )}
                    </div>

                    <div className="mt-8 px-3 text-xs text-gray-500 min-w-[250px]">
                        <p>Ivillar System © 2025</p>
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
                                {systemNews.map(news => (
                                    <div key={news.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${news.author === 'Diretoria' ? 'bg-purple-600' : news.author === 'Tech' ? 'bg-gray-700' : 'bg-brand-600'}`}>
                                                {news.author[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors truncate">{news.title}</p>
                                                <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">{news.content}</p>
                                                <p className="text-[10px] text-gray-400 mt-2 font-medium">{news.date} • {news.author}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                {onlineContacts.map(contact => (
                                    <div key={contact.id} className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                                        <div className="relative">
                                            <img src={contact.avatar} className="w-9 h-9 rounded-full border border-gray-200" alt={contact.name} />
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#F0F2F5] rounded-full ${contact.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                                    </div>
                                ))}

                                {/* Fake extra contacts for visual fill */}
                                <div className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors opacity-60">
                                    <div className="relative">
                                        <div className="w-9 h-9 rounded-full bg-gray-300"></div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 border-2 border-[#F0F2F5] rounded-full bg-gray-400"></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">Roberto Lima</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    );
};

export default AdminLayout;

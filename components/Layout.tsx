
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Building2, User, LogIn, MapPin, Phone, Mail, Clock, Instagram, Facebook, Linkedin, Zap, Search } from 'lucide-react';
import { APP_CONFIG } from '../constants';

const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-brand-600 font-semibold' : 'text-gray-600 hover:text-brand-600 font-medium transition-colors';

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo (Left) */}
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-brand-900 text-white p-2 rounded-lg">
                <Building2 size={24} />
              </div>
              <span className="text-xl font-serif font-bold text-brand-900 tracking-tight">{APP_CONFIG.companyName}</span>
            </Link>

            {/* Right Side Container (Nav + Login) */}
            <div className="hidden md:flex items-center gap-8">
              {/* Desktop Nav */}
              <nav className="flex space-x-8 items-center">
                <Link to="/" className={isActive('/')}>Início</Link>
                <Link to="/properties" className={isActive('/properties')}>Imóveis</Link>
                <Link to="/campaigns" className={isActive('/campaigns')}>Campanhas</Link>
                <Link to="/advertise" className={isActive('/advertise')}>Anunciar</Link>
                <Link to="/contact" className={isActive('/contact')}>Contato</Link>
              </nav>

              {/* Search Bar */}
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Buscar imóveis..."
                  className="pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all w-48 group-hover:w-64"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      window.location.href = `/properties?search=${e.currentTarget.value}`;
                    }
                  }}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>

              <div className="flex items-center gap-3">
                {/* Hub Quick Access Button */}
                <Link to="/funnel" className="flex items-center gap-2 px-4 py-2 rounded-full text-brand-600 font-bold transition-all hover:bg-brand-50 text-sm" title="Acesso Rápido">
                  <Zap size={18} />
                </Link>

                {/* Login Button */}
                <Link to="/buyer/login" className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white bg-brand-900 hover:bg-brand-800 font-bold transition-all text-sm shadow-md shadow-brand-900/10">
                  <User size={18} />
                  <span>Entrar</span>
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t p-4 space-y-4 shadow-lg animate-in slide-in-from-top-5">
            <Link to="/funnel" className="flex items-center gap-2 p-3 bg-brand-50 rounded-xl text-brand-700 font-bold" onClick={() => setIsMobileMenuOpen(false)}>
              <Zap size={18} /> Acesso Rápido (Hub)
            </Link>
            <Link to="/" className="block py-2 text-gray-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Início</Link>
            <Link to="/properties" className="block py-2 text-gray-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Imóveis</Link>
            <Link to="/campaigns" className="block py-2 text-gray-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Campanhas</Link>
            <Link to="/advertise" className="block py-2 text-gray-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Anunciar Imóvel</Link>
            <Link to="/about" className="block py-2 text-gray-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Sobre</Link>
            <Link to="/jobs" className="block py-2 text-gray-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Trabalhe Conosco</Link>
            <Link to="/contact" className="block py-2 text-gray-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Contato</Link>
            <hr />
            <Link to="/buyer/login" className="flex items-center gap-2 py-2 text-brand-900 font-bold" onClick={() => setIsMobileMenuOpen(false)}>
              <LogIn size={18} /> Área do Cliente
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Floating WhatsApp Button - Official Image */}
      <a
        href={`https://wa.me/${APP_CONFIG.whatsapp}?text=Olá! Gostaria de mais informações sobre os imóveis.`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl transition-all hover:scale-110 hover:-translate-y-1 group"
        aria-label="Falar no WhatsApp"
        title="Falar com Consultor"
      >
        <span className="absolute -top-1 -right-1 flex h-4 w-4 z-10">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
        </span>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="WhatsApp"
          className="w-full h-full drop-shadow-lg"
        />
      </a>

      {/* Professional Footer */}
      <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

            {/* Column 1: Brand & Social */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-white">
                <div className="bg-brand-600 p-1.5 rounded-lg">
                  <Building2 size={20} />
                </div>
                <span className="text-xl font-serif font-bold">{APP_CONFIG.companyName}</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">
                Referência em negócios imobiliários. Conectamos pessoas a seus sonhos com transparência, segurança e atendimento exclusivo.
              </p>
              <div className="flex gap-4 pt-2">
                <a href={APP_CONFIG.social.instagram} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all"><Instagram size={16} /></a>
                <a href={APP_CONFIG.social.facebook} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all"><Facebook size={16} /></a>
                <a href={APP_CONFIG.social.linkedin} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all"><Linkedin size={16} /></a>
              </div>
            </div>

            {/* Column 2: Properties */}
            <div>
              <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Imóveis</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/properties" className="hover:text-brand-400 transition-colors">Ver Todos</Link></li>
                <li><Link to="/properties?type=Lançamento" className="hover:text-brand-400 transition-colors">Lançamentos</Link></li>
                <li><Link to="/properties?type=Casa" className="hover:text-brand-400 transition-colors">Casas em Condomínio</Link></li>
                <li><Link to="/properties?type=Apartamento" className="hover:text-brand-400 transition-colors">Apartamentos</Link></li>
                <li><Link to="/properties?type=Comercial" className="hover:text-brand-400 transition-colors">Salas Comerciais</Link></li>
              </ul>
            </div>

            {/* Column 3: Institutional */}
            <div>
              <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Institucional</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/about" className="hover:text-brand-400 transition-colors">Quem Somos</Link></li>
                <li><Link to="/advertise" className="hover:text-brand-400 transition-colors">Anuncie Conosco</Link></li>
                <li><Link to="/contact" className="hover:text-brand-400 transition-colors">Fale Conosco</Link></li>
                <li><Link to="/jobs" className="hover:text-brand-400 transition-colors">Trabalhe Conosco</Link></li>
                {/* Portal do Cliente Moved Here */}
                <li><Link to="/funnel" className="hover:text-brand-400 transition-colors font-bold text-white flex items-center gap-1"><Zap size={12} /> Hub de Acesso Rápido</Link></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>

            {/* Column 4: Contact Info */}
            <div>
              <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Atendimento</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />
                  <span>{APP_CONFIG.address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-brand-600 flex-shrink-0" />
                  <span>{APP_CONFIG.whatsapp}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-brand-600 flex-shrink-0" />
                  <span>{APP_CONFIG.email}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock size={18} className="text-brand-600 flex-shrink-0" />
                  <span>Seg a Sex: 9h às 18h<br />Sáb: 9h às 13h</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} {APP_CONFIG.companyName}. Todos os direitos reservados.</p>
            <p>CRECI: 12.345-J</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

import { useState, useRef, useEffect } from "react";

// ── Icons ──────────────────────────────────────────────────────────────────
const ChevronDown = ({ color = "#1e1e1e", size = 16 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);
const ChevronRight = ({ color = "#130032", size = 16 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);
const IconPlay = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="white" stroke="none" />
    </svg>
);
const IconFile = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
);
const IconEdit = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const IconCheck = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a7a4a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);
const IconInfo = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" /><line x1="12" y1="12" x2="12" y2="16" />
    </svg>
);
const IconSupport = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
);
const IconCommunity = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const IconShield = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);
const IconMenu = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);
const IconHelp = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
    </svg>
);
const IcoEnv = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);
const IcoPlay = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="#130032" />
    </svg>
);
const IcoEditSm = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const IcoGrid = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
);
const IcoFileSm = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
);
const IcoUpload = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

// ── Promo art ──────────────────────────────────────────────────────────────
const PromoArt1 = () => (
    <div style={{ width: 105, flexShrink: 0, background: "#f3f2f8", borderRadius: "10px 0 0 10px", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid rgba(19,0,50,0.06)" }}>
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
            {/* Top-right light purple rectangle */}
            <rect x="50" y="28" width="15" height="30" rx="1" fill="#d5caff" />
            {/* Top-left red/pink quarter circle */}
            <path d="M 50 50 L 50 29 A 21 21 0 0 0 29 50 Z" fill="#ff2e62" />
            {/* Bottom dark purple quarter circle */}
            <path d="M 50 50 L 25 50 A 25 25 0 0 0 50 75 Z" fill="#3a00d8" />
            {/* Bottom-right light lilac sliver */}
            <path d="M 40 60 L 20 60 A 20 20 0 0 0 40 80 Z" fill="#d5caff" />
        </svg>
    </div>
);
const PromoArt2 = () => (
    <div style={{ width: 105, flexShrink: 0, background: "#f3f2f8", borderRadius: "10px 0 0 10px", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid rgba(19,0,50,0.06)" }}>
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
            {/* Left dark purple semi-circle */}
            <path d="M 50 28 A 22 22 0 0 0 50 72 Z" fill="#3a00d8" />
            {/* Right light purple bottom-right quarter circle */}
            <path d="M 50 50 L 72 50 A 22 22 0 0 1 50 72 Z" fill="#d5caff" />
            {/* Center red/pink leaf (lens) */}
            <path d="M 34 34 A 23 23 0 0 0 62 62 A 23 23 0 0 0 34 34 Z" fill="#ff2e62" />
        </svg>
    </div>
);

// ── Dropdown ───────────────────────────────────────────────────────────────
const DropdownItem = ({ icon, label, hasArrow, onHover }: { icon: React.ReactNode, label: string, hasArrow?: boolean, onHover?: () => void }) => {
    const [bg, setBg] = useState("transparent");
    return (
        <div
            onMouseEnter={() => { setBg("rgba(19,0,50,0.06)"); if (onHover) onHover(); }}
            onMouseLeave={() => setBg("transparent")}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", margin: "1px 6px", borderRadius: 5, background: bg, cursor: "pointer" }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "Arial", fontSize: 14.5, color: "#130032" }}>
                {icon} {label}
            </div>
            {hasArrow && <ChevronRight size={13} color="#aaa" />}
        </div>
    );
};

const Dropdown = () => {
    const [hovered, setHovered] = useState<string | null>(null);
    return (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200, display: "flex", alignItems: "flex-start" }}>
            {/* Main panel */}
            <div style={{ background: "white", borderRadius: 8, boxShadow: "0 8px 30px rgba(19,0,50,0.18)", minWidth: 230, border: "1px solid rgba(19,0,50,0.09)", paddingTop: 6, paddingBottom: 6 }}>
                <div style={{ padding: "7px 20px 3px", fontFamily: "Arial", fontWeight: 700, fontSize: 10.5, color: "rgba(19,0,50,0.45)", textTransform: "uppercase", letterSpacing: 0.6 }}>Acordos</div>
                <DropdownItem icon={<IcoEnv />} label="Envelopes" hasArrow onHover={() => setHovered("envelopes")} />
                <div style={{ margin: "4px 0", borderTop: "1px solid rgba(19,0,50,0.07)" }} />
                <div style={{ padding: "7px 20px 3px", fontFamily: "Arial", fontWeight: 700, fontSize: 10.5, color: "rgba(19,0,50,0.45)", textTransform: "uppercase", letterSpacing: 0.6 }}>Modelos</div>
                <DropdownItem icon={<IcoEnv />} label="Modelos de envelopes" hasArrow onHover={() => setHovered("modelos")} />
            </div>

            {/* Envelopes submenu */}
            {hovered === "envelopes" && (
                <div style={{ background: "white", borderRadius: 8, boxShadow: "0 8px 30px rgba(19,0,50,0.18)", minWidth: 215, border: "1px solid rgba(19,0,50,0.09)", paddingTop: 6, paddingBottom: 6, marginLeft: 4 }}>
                    <DropdownItem icon={<IcoPlay />} label="Obter assinaturas" onHover={() => { }} />
                    <DropdownItem icon={<IcoEditSm />} label="Assinar um documento" onHover={() => { }} />
                    <DropdownItem icon={<IcoGrid />} label="Usar um modelo" onHover={() => { }} />
                </div>
            )}

            {/* Modelos submenu */}
            {hovered === "modelos" && (
                <div style={{ background: "white", borderRadius: 8, boxShadow: "0 8px 30px rgba(19,0,50,0.18)", minWidth: 215, border: "1px solid rgba(19,0,50,0.09)", paddingTop: 6, paddingBottom: 6, marginLeft: 4, marginTop: 78 }}>
                    <DropdownItem icon={<IcoFileSm />} label="Criar um modelo" onHover={() => { }} />
                    <DropdownItem icon={<IcoUpload />} label="Fazer upload de um modelo" onHover={() => { }} />
                </div>
            )}
        </div>
    );
};

// ── HeaderSection ──────────────────────────────────────────────────────────
const HeaderSection = () => {
    const [activeTab, setActiveTab] = useState(0);
    const tabs = ["Início", "Acordos", "Modelos", "Relatórios", "Administrador"];
    return (
        <div style={{ background: "#4c00fb" }}>
            <header style={{ display: "flex", height: 64, alignItems: "center", justifyContent: "space-between", padding: "0 16px", background: "white", borderBottom: "1px solid rgba(19,0,50,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <rect width="32" height="32" rx="6" fill="#FF4F00" />
                            <path d="M9 16.5L14 21.5L23 11" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ fontFamily: "Arial", fontWeight: 700, fontSize: 18, color: "#130032", letterSpacing: "-0.5px" }}>docusign</span>
                    </div>
                    <nav style={{ display: "flex", height: 64, alignItems: "stretch" }}>
                        {tabs.map((tab, i) => (
                            <button key={i} onClick={() => setActiveTab(i)} style={{ all: "unset", display: "flex", alignItems: "center", padding: "0 20px", fontFamily: "Arial", fontWeight: i === activeTab ? 700 : 400, fontSize: 14.8, color: i === activeTab ? "rgba(19,0,50,0.9)" : "rgba(19,0,50,0.7)", borderBottom: i === activeTab ? "3px solid #130032" : "3px solid transparent", cursor: "pointer", whiteSpace: "nowrap" }}>
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: "Arial", fontSize: 15, color: "#260559" }}>10 dias restantes</span>
                    <button style={{ all: "unset", background: "#260559", color: "white", borderRadius: 999, padding: "5px 16px", fontFamily: "Arial", fontSize: 14, cursor: "pointer" }}>Exibir planos</button>
                    <button style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", padding: 8 }}><IconMenu /></button>
                    <button style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", padding: 8 }}><IconHelp /></button>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#caf4fc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial", fontSize: 14, color: "#035a6c" }}>CM</div>
                </div>
            </header>
            <div style={{ background: "#63607c", display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: "14px 0" }}>
                <span style={{ fontFamily: "Arial", color: "white", fontSize: 15 }}>Comece agora</span>
                <div style={{ width: 80, height: 6, background: "rgba(255,255,255,0.3)", borderRadius: 99 }}>
                    <div style={{ width: "50%", height: "100%", background: "white", borderRadius: 99 }} />
                </div>
                <span style={{ fontFamily: "Arial", color: "white", fontSize: 15, textDecoration: "underline", cursor: "pointer" }}>2/4 ações concluídas</span>
                <span style={{ fontFamily: "Arial", color: "rgba(255,255,255,0.8)", fontSize: 15 }}>Qual o próximo passo?</span>
                <button style={{ all: "unset", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 4, color: "white", fontFamily: "Arial", fontSize: 15, padding: "7px 16px", cursor: "pointer" }}>Convide sua equipe</button>
            </div>
        </div>
    );
};

// ── DashboardMainSection ───────────────────────────────────────────────────
const DashboardMainSection = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const activities = [
        { id: "1", title: "Complete com o Docusign: Laudo.pdf", timeAgo: "1 semana atrás", sender: "Concluído" },
        { id: "2", title: "Complete com o Docusign: Laudo (1).pdf", timeAgo: "3 semanas atrás", sender: "Concluído" },
    ];
    const overview = [
        { label: "Aguardando outros", count: 0 },
        { label: "Expirando em breve", count: 0 },
        { label: "Concluído", count: 1 },
    ];

    return (
        <main style={{ background: "white" }}>
            {/* Hero */}
            <div style={{ background: "radial-gradient(50% 50% at 50% 75%, rgba(66,0,202,1) 0%, rgba(38,5,89,1) 100%)", display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px 80px" }}>
                <div style={{ width: "100%", maxWidth: 1024, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <h1 style={{ fontFamily: "Arial", color: "white", fontSize: 23, fontWeight: 400, marginBottom: 32, marginTop: 0 }}>
                        Que bom que você voltou, caio mazzei
                    </h1>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start" }}>
                        {/* Primary dropdown button */}
                        <div ref={dropdownRef} style={{ position: "relative" }}>
                            <div
                                onClick={() => setDropdownOpen(o => !o)}
                                style={{ background: "#cac2ff", borderRadius: 4, padding: "7px 16px", display: "flex", alignItems: "center", gap: 8, fontFamily: "Arial", fontSize: 15, color: "#1e1e1e", cursor: "pointer", userSelect: "none" }}
                            >
                                Início <ChevronDown color="#1e1e1e" size={14} />
                            </div>
                            {dropdownOpen && <Dropdown />}
                        </div>
                        {/* Secondary buttons */}
                        {[
                            { icon: <IconPlay />, label: "Obter assinaturas" },
                            { icon: <IconFile />, label: "Criar um modelo de envelope" },
                            { icon: <IconEdit />, label: "Assinar um documento" },
                        ].map((a) => (
                            <button key={a.label} style={{ all: "unset", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 4, padding: "7px 16px", display: "flex", alignItems: "center", gap: 8, fontFamily: "Arial", fontSize: 15, color: "white", cursor: "pointer" }}>
                                {a.icon} {a.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: "48px 24px", width: "100%", maxWidth: 1024, margin: "0 auto", display: "flex", gap: 32, alignItems: "flex-start", boxSizing: "border-box" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 32 }}>
                    {/* Tasks */}
                    <div style={{ border: "1px solid rgba(19,0,50,0.1)", borderRadius: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 24px 0" }}>

                            <ChevronRight />
                        </div>
                        <div style={{ padding: "24px", textAlign: "center" }}>
                            <h2 style={{ fontFamily: "Arial", fontWeight: 400, fontSize: 22, color: "rgba(19,0,50,0.9)", margin: "0 0 8px" }}>Você ainda não tem nenhuma tarefa</h2>
                            <p style={{ fontFamily: "Arial", fontSize: 13.5, color: "rgba(19,0,50,0.9)", margin: 0 }}>Quando novas tarefas são alocadas para você, elas aparecem aqui.</p>
                        </div>
                    </div>
                    {/* Activity */}
                    <div style={{ border: "1px solid rgba(19,0,50,0.1)", borderRadius: 16, padding: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                            <span style={{ fontFamily: "Arial", fontSize: 15, color: "rgba(19,0,50,0.9)" }}>Atividade de</span>
                            <IconInfo />
                        </div>
                        {activities.map((item) => (
                            <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "16px 0 15px", borderTop: "1px solid rgba(19,0,50,0.1)" }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontFamily: "Arial", fontSize: 15.5, color: "rgba(19,0,50,0.9)", margin: "0 0 4px" }}>{item.title}</p>
                                    <span style={{ fontFamily: "Arial", fontSize: 12, color: "rgba(19,0,50,0.7)", borderBottom: "1px dashed #999" }}>{item.timeAgo}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 24 }}>
                                    <IconCheck />
                                    <span style={{ fontFamily: "Arial", fontSize: 15, color: "rgba(19,0,50,0.7)" }}>{item.sender}</span>
                                </div>
                                <ChevronRight color="#999" />
                            </div>
                        ))}
                    </div>
                    {/* Promo */}
                    <div style={{ display: "flex", gap: 16, width: "calc(100% + 332px)" }}>
                        <div style={{ flex: 1, minWidth: 0, display: "flex", border: "1px solid rgba(19,0,50,0.08)", borderRadius: 10, overflow: "hidden" }}>
                            <PromoArt1 />
                            <div style={{ padding: "16px 20px", minWidth: 0 }}>
                                <h3 style={{ margin: "0 0 6px", fontFamily: "Arial", fontSize: 13.5, fontWeight: 700, color: "rgba(19,0,50,0.9)" }}>Quer poupar mais tempo?</h3>
                                <p style={{ margin: 0, fontFamily: "Arial", fontSize: 13, color: "rgba(19,0,50,0.65)", lineHeight: 1.45 }}>
                                    Com rastreamento fácil e modelos reutilizáveis, há um plano para as necessidades da sua empresa.{" "}
                                    <a href="#" style={{ color: "#4c00fb", textDecoration: "none" }}>Exibir planos</a>
                                </p>
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: "flex", border: "1px solid rgba(19,0,50,0.08)", borderRadius: 10, overflow: "hidden" }}>
                            <PromoArt2 />
                            <div style={{ padding: "16px 20px", minWidth: 0 }}>
                                <h3 style={{ margin: "0 0 6px", fontFamily: "Arial", fontSize: 13.5, fontWeight: 700, color: "rgba(19,0,50,0.9)" }}>Precisa de ajuda para começar?</h3>
                                <p style={{ margin: 0, fontFamily: "Arial", fontSize: 13, color: "rgba(19,0,50,0.65)", lineHeight: 1.45 }}>
                                    Obtenha ajuda com questões básicas.{" "}
                                    <a href="#" style={{ color: "#4c00fb", textDecoration: "none" }}>Veja o nosso guia</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Sidebar */}
                <div style={{ width: 300, flexShrink: 0 }}>
                    <div style={{ border: "1px solid rgba(19,0,50,0.1)", borderRadius: 16 }}>
                        <div style={{ padding: "24px 32px 8px" }}>
                            <h2 style={{ fontFamily: "Arial", fontWeight: 400, fontSize: 15, color: "rgba(19,0,50,0.9)", margin: 0 }}>Visão geral</h2>
                        </div>
                        <div style={{ padding: "0 24px 8px" }}>
                            {overview.map((item, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: i < overview.length - 1 ? "1px solid rgba(19,0,50,0.1)" : "none" }}>
                                    <span style={{ fontFamily: "Arial", fontSize: 13.5, color: "rgba(19,0,50,0.9)" }}>{item.label}</span>
                                    <span style={{ fontFamily: "Arial", fontSize: 15, color: "rgba(19,0,50,0.9)" }}>{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

// ── Support links ────────────────────────────────────────────────────────────
const SupportLinksSection = () => (
    <section style={{ background: "#f7f6f7", padding: "48px 24px 80px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 1024, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ padding: "18px 0 24px", flex: 1, paddingRight: 40, borderRight: "1px solid rgba(19,0,50,0.1)" }}>
                <p style={{ fontFamily: "Arial", fontSize: 15.5, color: "#130032", margin: "0 0 18px", lineHeight: 1.5 }}>
                    Quer participar de estudos de pesquisa da Docusign, como pesquisas, entrevistas e testes<br />
                    de ideias para novos produtos e recursos?
                </p>
                <a href="#" style={{ fontFamily: "Arial", fontSize: 15.5, color: "#260559", textDecoration: "none" }}>
                    Participe do Painel de Pesquisa de Experiência do Produto
                </a>
            </div>
            <nav style={{ paddingTop: 18, paddingBottom: 50, paddingLeft: 40, display: "flex", flexDirection: "column", gap: 10, width: 260 }}>
                {[{ icon: <IconSupport />, label: "Suporte" }, { icon: <IconCommunity />, label: "Comunidade" }, { icon: <IconShield />, label: "Central de confiança" }].map(link => (
                    <a key={link.label} href="#" style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Arial", fontSize: 15, color: "#130032", textDecoration: "none" }}>
                        {link.icon} {link.label}
                    </a>
                ))}
            </nav>
        </div>
    </section>
);

// ── LegalFooterSection ─────────────────────────────────────────────────────
const LegalFooterSection = () => {
    const links = ["Entre em contato", "Termos de uso", "Privacidade", "Propriedade intelectual", "Confiar"];
    return (
        <footer style={{ background: "white", borderTop: "1px solid #ccc", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
                <button style={{ all: "unset", background: "rgba(19,0,50,0.05)", borderRadius: 2, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, fontFamily: "Arial", fontSize: 11, fontWeight: 700, color: "rgba(19,0,50,0.9)", cursor: "pointer" }}>
                    Português (Brasil) <ChevronDown color="#130032" size={10} />
                </button>
                <div style={{ display: "flex", gap: 24 }}>
                    {links.map((l) => (
                        <a key={l} href="#" style={{ fontFamily: "Arial", fontSize: 11, fontWeight: 700, color: "rgba(19,0,50,0.6)", textDecoration: "none" }}>{l}</a>
                    ))}
                </div>
            </div>
            <p style={{ fontFamily: "Arial", fontSize: 11, color: "rgba(19,0,50,0.6)", whiteSpace: "nowrap", margin: 0 }}>
                Copyright © 2026 Docusign, Inc. Todos os direitos reservados
            </p>
        </footer>
    );
};

// ── App ────────────────────────────────────────────────────────────────────
export default function AssinaturaScreen() {
    return (
        <div style={{ fontFamily: "Arial, sans-serif" }}>
            <HeaderSection />
            <DashboardMainSection />
            <SupportLinksSection />
            <LegalFooterSection />
        </div>
    );
}

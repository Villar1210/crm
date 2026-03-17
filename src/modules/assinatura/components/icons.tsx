

export const ChevronDown = ({ color = "#1e1e1e", size = 16 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

export const ChevronRight = ({ color = "#130032", size = 16 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

export const IconPlay = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" fill="white" stroke="none" />
    </svg>
);

export const IconFile = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

export const IconEdit = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

export const IconCheck = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a7a4a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

export const IconInfo = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" />
        <line x1="12" y1="12" x2="12" y2="16" />
    </svg>
);

export const IconSupport = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
);

export const IconCommunity = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export const IconShield = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

export const IconMenu = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

export const IconHelp = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
    </svg>
);

export const IcoEnv = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

export const IcoPlay = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="#130032" />
    </svg>
);

export const IcoEditSm = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

export const IcoGrid = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
);

export const IcoFileSm = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
);

export const IcoUpload = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

export const DocusignLogo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#FF4F00" />
        <path d="M9 16.5L14 21.5L23 11" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const PromoArt1 = () => (
    <div style={{ width: 140, flexShrink: 0, background: "linear-gradient(135deg,#ede9fb,#c4b5fd)", borderRadius: "16px 0 0 16px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(19,0,50,0.1)", borderRight: "none" }}>
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <ellipse cx="40" cy="55" rx="25" ry="18" fill="#c4b5fd" opacity="0.7" />
            <circle cx="38" cy="38" r="20" fill="#f472b6" opacity="0.8" />
            <rect x="52" y="28" width="20" height="26" rx="5" fill="#7c3aed" opacity="0.6" />
        </svg>
    </div>
);

export const PromoArt2 = () => (
    <div style={{ width: 140, flexShrink: 0, background: "linear-gradient(135deg,#ede9fb,#ddd6fe)", borderRadius: "16px 0 0 16px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(19,0,50,0.1)", borderRight: "none" }}>
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <circle cx="42" cy="42" r="20" fill="#7c3aed" opacity="0.85" />
            <circle cx="56" cy="56" r="18" fill="#f472b6" opacity="0.7" />
        </svg>
    </div>
);

import { useState } from "react";

export const DropdownItem = ({ icon, label, hasArrow, onHover }: { icon: React.ReactNode, label: string, hasArrow?: boolean, onHover?: () => void }) => {
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

export const Dropdown = () => {
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

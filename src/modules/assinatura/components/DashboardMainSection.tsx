import { useState, useRef, useEffect } from "react";
import {
    ChevronDown,
    ChevronRight,
    IconPlay,
    IconFile,
    IconEdit,
    IconCheck,
    IconInfo,
    PromoArt1,
    PromoArt2,
    Dropdown
} from "./icons";

export const DashboardMainSection = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const activities = [
        { id: "1", title: "Complete com o Docusign: Laudo.pdf", timeAgo: "1 semana atrás", sender: "Con concluído" },
        { id: "2", title: "Complete com o Docusign: Laudo (1).pdf", timeAgo: "3 semanas atrás", sender: "Con concluído" },
    ];

    const overview = [
        { label: "Aguardando outros", count: 0 },
        { label: "Expirando em breve", count: 0 },
        { label: "Concluído", count: 1 },
    ];

    return (
        <main style={{ background: "white", paddingBottom: 60 }}>
            {/* Hero */}
            <div style={{ background: "radial-gradient(50% 50% at 50% 75%, rgba(66,0,202,1) 0%, rgba(38,5,89,1) 100%)", display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px 80px" }}>
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

            {/* Content */}
            <div style={{ padding: "48px 80px", display: "flex", gap: 32, alignItems: "flex-start", maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 32 }}>
                    {/* Tasks */}
                    <div style={{ border: "1px solid rgba(19,0,50,0.1)", borderRadius: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 24px 0" }}>
                            <span style={{ fontFamily: "Arial", fontSize: 15, color: "rgba(19,0,50,0.9)" }}>0s</span>
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
                    <div style={{ display: "flex", gap: 24 }}>
                        <div style={{ flex: 1, display: "flex", border: "1px solid rgba(19,0,50,0.1)", borderRadius: 16, overflow: "hidden" }}>
                            <PromoArt1 />
                            <div style={{ padding: 24 }}>
                                <h3 style={{ margin: "0 0 10px", fontFamily: "Arial", fontSize: 15, fontWeight: 400, color: "rgba(19,0,50,0.7)" }}>Quer poupar mais tempo?</h3>
                                <p style={{ margin: 0, fontFamily: "Arial", fontSize: 13.5, color: "rgba(19,0,50,0.7)", lineHeight: 1.5 }}>
                                    Com rastreamento fácil e modelos reutilizáveis, há um plano para as necessidades da sua empresa.{" "}
                                    <a href="#" style={{ color: "#4c00fb", textDecoration: "none" }}>Exibir planos</a>
                                </p>
                            </div>
                        </div>
                        <div style={{ flex: 1, display: "flex", border: "1px solid rgba(19,0,50,0.1)", borderRadius: 16, overflow: "hidden" }}>
                            <PromoArt2 />
                            <div style={{ padding: 24 }}>
                                <h3 style={{ margin: "0 0 10px", fontFamily: "Arial", fontSize: 15, fontWeight: 400, color: "rgba(19,0,50,0.7)" }}>Precisa de ajuda para começar?</h3>
                                <p style={{ margin: 0, fontFamily: "Arial", fontSize: 13.5, color: "rgba(19,0,50,0.7)" }}>
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

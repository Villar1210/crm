import { useState, useRef, useEffect } from "react";

// ── Hook ───────────────────────────────────────────────────────────────────
function useClickOutside(cb: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return ref;
}

// ── Icons ──────────────────────────────────────────────────────────────────
const IcoClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcoHelp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
  </svg>
);
const IcoMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IcoUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const IcoChevronDown = ({ color = "#130032", size = 16 }: { color?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IcoChevronUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(19,0,50,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
const IcoPerson = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IcoInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(19,0,50,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" /><line x1="12" y1="12" x2="12" y2="16" />
  </svg>
);
const IcoPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoFile = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4c00fb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);
const IcoDots = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1" fill="#666" /><circle cx="12" cy="12" r="1" fill="#666" /><circle cx="12" cy="19" r="1" fill="#666" />
  </svg>
);
// Ícones dos dropdowns
const IcoSignatureSm = ({ color = "#130032" }: { color?: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17c3-3 6-6 9-9" /><path d="M7 17c2-4 4-7 6-8s4 0 3 2-4 5-3 7 5-1 7-3" />
  </svg>
);
const IcoPersonCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);
const IcoCCEmail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IcoEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IcoCheckmark = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4c00fb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoKey = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);
const IcoMsg = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" />
  </svg>
);

// ── Dropdown "Assinatura necessária" ──────────────────────────────────────
const sigTypes = [
  { id: "sign", icon: <IcoSignatureSm />, label: "Assinatura necessária" },
  { id: "presencial", icon: <IcoPersonCheck />, label: "Signatário presencial" },
  { id: "cc", icon: <IcoCCEmail />, label: "Receber uma cópia" },
  { id: "view", icon: <IcoEye />, label: "Visualização necessária" },
];

const SignatureDropdown = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const selected = sigTypes.find(t => t.id === value) || sigTypes[0];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ all: "unset", background: "rgba(19,0,50,0.05)", borderRadius: 4, padding: "7px 14px", display: "flex", alignItems: "center", gap: 8, fontFamily: "Arial", fontSize: 15, color: "rgba(19,0,50,0.9)", cursor: "pointer" }}
      >
        <IcoSignatureSm />
        {selected.label}
        <IcoChevronDown color="rgba(19,0,50,0.7)" size={15} />
      </button>
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, background: "white", borderRadius: 8, boxShadow: "0 6px 24px rgba(19,0,50,0.15)", minWidth: 230, zIndex: 400, border: "1px solid rgba(19,0,50,0.09)", padding: "5px 0" }}>
          {sigTypes.map(type => (
            <div
              key={type.id}
              onClick={() => { onChange(type.id); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer", fontFamily: "Arial", fontSize: 14, color: "#130032" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(76,0,251,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ width: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {type.id === value && <IcoCheckmark />}
              </span>
              {type.icon}
              {type.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Dropdown "Personalizar" ────────────────────────────────────────────────
const PersonalizarDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ all: "unset", background: "rgba(19,0,50,0.05)", borderRadius: 4, padding: "7px 14px", display: "flex", alignItems: "center", gap: 8, fontFamily: "Arial", fontSize: 15, color: "rgba(19,0,50,0.9)", cursor: "pointer" }}
      >
        Personalizar
        <IcoChevronDown color="rgba(19,0,50,0.7)" size={15} />
      </button>
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, background: "white", borderRadius: 10, boxShadow: "0 6px 28px rgba(19,0,50,0.15)", minWidth: 320, zIndex: 400, border: "1px solid rgba(19,0,50,0.09)", padding: "5px 0" }}>
          {[
            { icon: <IcoKey />, label: "Adicionar código de acesso", desc: "Insira um código que apenas você e esse destinatário sabe." },
            { icon: <IcoMsg />, label: "Adicionar mensagem privada", desc: "Inclua uma observação pessoal com esse destinatário." },
          ].map((item, i, arr) => (
            <div key={item.label}>
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(19,0,50,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ flexShrink: 0, marginTop: 1 }}>{item.icon}</div>
                <div>
                  <div style={{ fontFamily: "Arial", fontSize: 14, color: "#130032", fontWeight: 600, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontFamily: "Arial", fontSize: 12.5, color: "rgba(19,0,50,0.5)", lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              </div>
              {i < arr.length - 1 && <div style={{ borderTop: "1px solid rgba(19,0,50,0.07)", margin: "0 12px" }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Navbar ─────────────────────────────────────────────────────────────────
const EnvelopeConfigurationSection = () => (
  <div style={{ background: "white", borderBottom: "1px solid rgba(19,0,50,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 64, flexShrink: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ borderRight: "1px solid rgba(19,0,50,0.1)", paddingRight: 8, display: "flex" }}>
        <button style={{ all: "unset", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <IcoClose />
        </button>
      </div>
      <span style={{ fontFamily: "Arial", fontSize: 14, color: "rgba(19,0,50,0.9)" }}>Configurar envelope</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button style={{ all: "unset", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><IcoHelp /></button>
      <button style={{ all: "unset", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><IcoMenu /></button>
      <button style={{ all: "unset", background: "#260559", color: "white", borderRadius: 999, padding: "5px 12px", fontFamily: "Arial", fontSize: 14, cursor: "pointer" }}>Exibir planos</button>
      <button style={{ all: "unset", background: "#4c00fb", color: "white", borderRadius: 4, padding: "5px 12px", fontFamily: "Arial", fontSize: 14, cursor: "pointer" }}>Seguinte: adicionar campos</button>
    </div>
  </div>
);

// ── Seção: Adicionar documentos ────────────────────────────────────────────
const DocumentUploadHeaderSection = ({ files, setFiles }: { files: { id: number, name: string, pages: number }[], setFiles: React.Dispatch<React.SetStateAction<{ id: number, name: string, pages: number }[]>> }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles = Array.from(incoming).map(f => ({
      id: Date.now() + Math.random(),
      name: f.name,
      pages: Math.floor(Math.random() * 8) + 1,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  return (
    <div style={{ paddingBottom: 24, borderBottom: "1px solid #a9a9a9", marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "Arial", fontWeight: 400, fontSize: 20, color: "rgba(19,0,50,0.9)", margin: 0 }}>Adicionar documentos</h1>
        <button style={{ all: "unset", cursor: "pointer" }}><IcoChevronUp /></button>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Cards dos arquivos adicionados */}
        {files.map(f => (
          <div key={f.id} style={{ width: 220, border: "1px solid rgba(19,0,50,0.12)", borderRadius: 8, overflow: "hidden", background: "white" }}>
            <div style={{ height: 180, background: "#f5f4f8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, borderBottom: "1px solid rgba(19,0,50,0.08)" }}>
              <IcoFile />
              <span style={{ fontFamily: "Arial", fontSize: 10.5, color: "rgba(19,0,50,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>
                {f.name.split(".").pop()}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
              <div>
                <div style={{ fontFamily: "Arial", fontSize: 13.5, fontWeight: 600, color: "rgba(19,0,50,0.9)" }}>{f.name}</div>
                <div style={{ fontFamily: "Arial", fontSize: 12, color: "rgba(19,0,50,0.45)", marginTop: 2 }}>{f.pages} páginas</div>
              </div>
              <button style={{ all: "unset", cursor: "pointer", padding: 4 }}><IcoDots /></button>
            </div>
          </div>
        ))}

        {/* Dropzone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          style={{ flex: "1 1 320px", minHeight: 230, background: isDragging ? "rgba(76,0,251,0.05)" : "rgba(19,0,50,0.04)", borderRadius: 8, border: `2px dashed ${isDragging ? "#4c00fb" : "transparent"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}
        >
          <div style={{ background: "rgba(26,29,32,0.1)", borderRadius: 12, padding: 10 }}>
            <IcoUpload />
          </div>
          <p style={{ fontFamily: "Arial", fontSize: 15.5, color: "rgba(19,0,50,0.7)", margin: 0 }}>Solte seus arquivos aqui ou</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ all: "unset", background: "#4c00fb", color: "white", borderRadius: 4, padding: "8px 18px", fontFamily: "Arial", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            Fazer upload <IcoChevronDown color="white" size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={e => { handleFiles(e.target.files); e.target.value = ""; }}
          />
        </div>
      </div>
    </div>
  );
};

// ── Botão "Adicionar destinatário" com dropdown ────────────────────────────
const IcoContact = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#130032" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const AddRecipientButton = () => {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  return (
    <div ref={ref} style={{ display: "flex", position: "relative" }}>
      <button style={{ all: "unset", border: "1px solid rgba(19,0,50,0.5)", borderRight: "none", borderRadius: "4px 0 0 4px", padding: "7px 16px", display: "flex", alignItems: "center", gap: 8, fontFamily: "Arial", fontSize: 15, color: "rgba(19,0,50,0.9)", cursor: "pointer" }}>
        <IcoPlus /> Adicionar destinatário
      </button>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ all: "unset", border: "1px solid rgba(19,0,50,0.5)", borderRadius: "0 4px 4px 0", padding: "7px 10px", display: "flex", alignItems: "center", cursor: "pointer", background: open ? "rgba(19,0,50,0.05)" : "white" }}
      >
        <IcoChevronDown color="rgba(19,0,50,0.7)" size={16} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "white", borderRadius: 8, boxShadow: "0 6px 24px rgba(19,0,50,0.15)", minWidth: 210, zIndex: 400, border: "1px solid rgba(19,0,50,0.09)", padding: "5px 0" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer", fontFamily: "Arial", fontSize: 14, color: "#130032" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(19,0,50,0.04)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            onClick={() => setOpen(false)}
          >
            <IcoContact /> Adicionar contatos
          </div>
        </div>
      )}
    </div>
  );
};

// ── Seção: Adicionar destinatários ─────────────────────────────────────────
const RecipientFormSection = ({ hasFiles }: { hasFiles: boolean }) => {
  const [isSoleSignatory, setIsSoleSignatory] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sigType, setSigType] = useState("sign");

  return (
    <div style={{ paddingBottom: 24, borderBottom: "1px solid #a9a9a9", marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "Arial", fontWeight: 400, fontSize: 20, color: "rgba(19,0,50,0.9)", margin: 0 }}>Adicionar destinatários</h2>
        <button style={{ all: "unset", cursor: "pointer" }}><IcoChevronUp /></button>
      </div>

      {/* Checkboxes */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setIsSoleSignatory(v => !v)}>
          <div style={{ width: 20, height: 20, border: "2px solid rgba(19,0,50,0.5)", borderRadius: 3, background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {isSoleSignatory && <div style={{ width: 10, height: 10, background: "#4c00fb", borderRadius: 1 }} />}
          </div>
          <span style={{ fontFamily: "Arial", fontSize: 13.8, color: "rgba(19,0,50,0.9)" }}>Sou o único signatário</span>
        </label>
        <IcoInfo />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, opacity: 0.3 }}>
        <div style={{ width: 20, height: 20, border: "2px solid rgba(19,0,50,0.5)", borderRadius: 3, background: "white", flexShrink: 0 }} />
        <span style={{ fontFamily: "Arial", fontSize: 13.8, color: "rgba(19,0,50,0.9)" }}>Definir ordem de assinatura</span>
        <a href="#" style={{ fontFamily: "Arial", fontSize: 15, color: "#4c00fb", marginLeft: 16 }}>Visualizar</a>
      </div>

      {/* Recipient card with Order Number */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {/* Signature Order Number Box */}
        {hasFiles && (
          <div style={{ width: 44, height: 44, background: "white", border: "1px solid rgba(19,0,50,0.2)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 32 }}>
            <span style={{ fontFamily: "Arial", fontSize: 14, color: "rgba(19,0,50,0.9)", fontWeight: 600 }}>1</span>
          </div>
        )}

        {/* The Card */}
        <div style={{ flex: 1, border: "1px solid rgba(19,0,50,0.1)", borderRadius: 4, background: "white" }}>
          <div style={{ display: "flex" }}>
            <div style={{ width: 6, background: "#a5edfc", flexShrink: 0, borderRadius: "4px 0 0 4px" }} />
            <div style={{ padding: "20px 24px", flex: 1 }}>
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                {/* Campos */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                      <label style={{ fontFamily: "Arial", fontSize: 13.5, color: "rgba(19,0,50,0.9)" }}>Nome</label>
                      <span style={{ color: "#c70547", fontWeight: 700, fontSize: 14 }}>*</span>
                    </div>
                    <div style={{ display: "flex", border: "1px solid rgba(19,0,50,0.4)", borderRadius: 4, background: "white", height: 40, overflow: "hidden" }}>
                      <div style={{ width: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid rgba(19,0,50,0.1)" }}>
                        <IcoPerson />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{ flex: 1, border: "none", outline: "none", padding: "0 10px", fontFamily: "Arial", fontSize: 14, color: "rgba(19,0,50,0.9)", background: "transparent" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                      <label style={{ fontFamily: "Arial", fontSize: 13.5, color: "rgba(19,0,50,0.9)" }}>E-mail</label>
                      <span style={{ color: "#c70547", fontWeight: 700, fontSize: 14 }}>*</span>
                    </div>
                    <div style={{ border: "1px solid rgba(19,0,50,0.4)", borderRadius: 4, background: "white", height: 40 }}>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{ width: "100%", height: "100%", border: "none", outline: "none", padding: "0 12px", fontFamily: "Arial", fontSize: 14, color: "rgba(19,0,50,0.9)", background: "transparent", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Dropdowns ── */}
                <div style={{ paddingTop: 26, display: "flex", gap: 12, flexShrink: 0 }}>
                  <SignatureDropdown value={sigType} onChange={setSigType} />
                  <PersonalizarDropdown />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adicionar destinatário */}
      <AddRecipientButton />
    </div>
  );
};

// ── Seção: Mensagem ────────────────────────────────────────────────────────
const RecipientOptionsSection = () => {
  const [subject, setSubject] = useState("Complete com o Docusign:");
  const [message, setMessage] = useState("");
  const maxSubjectLength = 100;
  const maxMessageLength = 10000;

  return (
    <div style={{ paddingBottom: 24, borderBottom: "1px solid #a9a9a9", marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "Arial", fontWeight: 400, fontSize: 20, color: "rgba(19,0,50,0.9)", margin: 0 }}>Adicionar mensagem</h2>
        <button style={{ all: "unset", cursor: "pointer" }}><IcoChevronUp /></button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            <label style={{ fontFamily: "Arial", fontSize: 14, color: "rgba(19,0,50,0.9)" }}>Assunto</label>
            <span style={{ color: "#c70547", fontWeight: 700 }}>*</span>
          </div>
          <div style={{ border: "1px solid rgba(19,0,50,0.5)", borderRadius: 4, background: "white", height: 40 }}>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value.slice(0, maxSubjectLength))}
              style={{ width: "100%", height: "100%", border: "none", outline: "none", padding: "0 16px", fontFamily: "Arial", fontSize: 15, color: "rgba(19,0,50,0.7)", background: "transparent", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ textAlign: "right", fontFamily: "Arial", fontSize: 12, color: "rgba(19,0,50,0.5)", marginTop: 4 }}>{subject.length}/{maxSubjectLength}</div>
        </div>
        <div>
          <label style={{ fontFamily: "Arial", fontSize: 14, color: "rgba(19,0,50,0.9)", display: "block", marginBottom: 6 }}>Mensagem</label>
          <div style={{ border: "1px solid rgba(19,0,50,0.5)", borderRadius: 4, background: "white", minHeight: 120, padding: "8px 16px" }}>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, maxMessageLength))}
              placeholder="Inserir mensagem"
              style={{ width: "100%", minHeight: 100, border: "none", outline: "none", fontFamily: "Arial", fontSize: 15, color: "rgba(19,0,50,0.7)", background: "transparent", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ textAlign: "right", fontFamily: "Arial", fontSize: 12, color: "rgba(19,0,50,0.5)", marginTop: 4 }}>{message.length}/{maxMessageLength}</div>
        </div>
      </div>
    </div>
  );
};

// ── Seção: Lembretes ───────────────────────────────────────────────────────
const DocumentUploadSection = () => {
  const [frequency, setFrequency] = useState("todos os dias");
  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ width: 172 }}>
        <label style={{ fontFamily: "Arial", fontSize: 14, color: "rgba(19,0,50,0.9)", display: "block", marginBottom: 6 }}>Frequência de lembretes</label>
        <div style={{ position: "relative" }}>
          <select
            value={frequency}
            onChange={e => setFrequency(e.target.value)}
            style={{ width: "100%", height: 40, border: "1px solid rgba(19,0,50,0.5)", borderRadius: 4, background: "white", padding: "0 40px 0 16px", fontFamily: "Arial", fontSize: 15, color: "rgba(19,0,50,0.7)", appearance: "none", cursor: "pointer" }}
          >
            <option value="todos os dias">todos os dias</option>
            <option value="a cada 2 dias">a cada 2 dias</option>
            <option value="semanalmente">semanalmente</option>
          </select>
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <IcoChevronDown color="#130032" size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── App ────────────────────────────────────────────────────────────────────
export function EnviarScreen() {
  const [files, setFiles] = useState<{ id: number, name: string, pages: number }[]>([]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "white", fontFamily: "Arial, sans-serif" }}>
      <EnvelopeConfigurationSection />
      <div style={{ flex: 1, background: "#f9f9f9", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "center", minHeight: "100%" }}>
          <div style={{ width: "100%", maxWidth: 1200, padding: "40px 24px" }}>
            <DocumentUploadHeaderSection files={files} setFiles={setFiles} />
            <RecipientFormSection hasFiles={files.length > 0} />
            <RecipientOptionsSection />
            <DocumentUploadSection />
          </div>
        </div>
      </div>
    </div>
  );
}

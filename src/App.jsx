import { useState } from "react";

const machines = [
  {
    id: "tour",
    name: "Tour Principale",
    role: "Hyperviseur Principal / Datacenter",
    os: "Proxmox VE (bare-metal)",
    specs: "Ryzen 7 9800X3D · 32GB DDR5 · RX 9070 XT",
    storage: [
      { label: "NVMe Gen5 1TB", usage: "Proxmox OS + VMs critiques" },
      { label: "SSD SATA 2TB", usage: "VMs secondaires + ISOs" },
      { label: "HDD 1TB", usage: "Backups locaux + archives" },
      { label: "NVMe 256GB", usage: "Réserve / swap / temp" },
    ],
    vms: [
      { name: "pfSense", type: "Firewall / Routeur", cpu: "2 vCPU", ram: "2 GB", disk: "20 GB", net: "WAN + LAN + DMZ", color: "#ef4444" },
      { name: "Windows Server AD", type: "AD / DNS / DHCP", cpu: "2 vCPU", ram: "4 GB", disk: "60 GB", net: "VLAN 60 Admin", color: "#3b82f6" },
      { name: "Windows Server FS", type: "Serveur de fichiers", cpu: "2 vCPU", ram: "4 GB", disk: "100 GB", net: "VLAN 10/20", color: "#3b82f6" },
      { name: "Ubuntu Server 1", type: "Serveur métier Linux", cpu: "2 vCPU", ram: "2 GB", disk: "40 GB", net: "VLAN 60 Admin", color: "#22c55e" },
      { name: "Ubuntu Server 2", type: "Serveur applicatif", cpu: "2 vCPU", ram: "2 GB", disk: "40 GB", net: "VLAN 60 Admin", color: "#22c55e" },
    ],
    totalRam: "14 GB / 32 GB utilisés",
    color: "#6366f1",
    project: "Projet 2",
    gpu: "RX 9070 XT → Hashcat (cassage hash NTLM)",
  },
  {
    id: "legion",
    name: "Lenovo Legion Y540",
    role: "Pôle SOC / Supervision",
    os: "Proxmox VE ou Linux direct",
    specs: "i7-9750H · 32GB RAM · RTX 2060",
    storage: [{ label: "NVMe 512GB", usage: "Wazuh + Zabbix + logs" }],
    vms: [
      { name: "Wazuh SIEM", type: "Détection / alertes / logs", cpu: "4 vCPU", ram: "8 GB", disk: "100 GB", net: "LAN Management", color: "#f59e0b" },
      { name: "Zabbix", type: "Supervision infra / graphes", cpu: "2 vCPU", ram: "4 GB", disk: "50 GB", net: "LAN Management", color: "#f59e0b" },
    ],
    totalRam: "12 GB / 32 GB utilisés",
    color: "#f59e0b",
    project: "Projet 3",
    note: "Wazuh = SIEM/détection. Zabbix = graphes CPU/RAM/disk. Les deux ensemble couvrent 100% du Projet 3.",
  },
  {
    id: "dell1",
    name: "Dell 5590 #1",
    role: "Coffre-Fort Sauvegardes",
    os: "Proxmox Backup Server (bare-metal)",
    specs: "8GB DDR4 SODIMM",
    storage: [{ label: "SSD interne", usage: "PBS — Backups VMs Tour" }],
    vms: [],
    totalRam: "OS léger — PBS ne virtualise pas",
    color: "#10b981",
    project: "Projet 2",
    note: "Physiquement isolé de la prod — Règle 3-2-1 — Best practice ANSSI. Argument fort pour le jury.",
  },
  {
    id: "dell5420",
    name: "Dell Latitude 5420",
    role: "Poste Admin / Client domaine",
    os: "Windows 10/11 Pro",
    specs: "8GB DDR4 3200MHz",
    storage: [{ label: "SSD interne", usage: "Windows client" }],
    vms: [],
    totalRam: "Poste physique — client AD",
    color: "#0ea5e9",
    project: "Projet 2",
    note: "Intégré au domaine DATASC.SEA. Tests GPO. RSAT pour administrer l'AD à distance.",
  },
  {
    id: "dell2",
    name: "Dell 5590 #2",
    role: "Machine d'Attaque Red Team",
    os: "Kali Linux",
    specs: "8GB DDR4 SODIMM",
    storage: [{ label: "SSD/HDD", usage: "Kali + outils offensifs" }],
    vms: [],
    totalRam: "Débranchée en temps normal",
    color: "#ef4444",
    project: "Projet 3",
    note: "Allumée UNIQUEMENT lors des simulations. Nmap → brute force → récupère hash NTLM → Hashcat sur GPU tour.",
  },
];

const vlans = [
  { id: "VLAN 10", name: "Commerciaux", subnet: "10.10.10.0/24", color: "#f59e0b", desc: "Postes utilisateurs commerciaux" },
  { id: "VLAN 20", name: "RH", subnet: "10.10.20.0/24", color: "#ec4899", desc: "Postes RH / données sensibles" },
  { id: "VLAN 60", name: "DSI / Admin", subnet: "10.10.60.0/24", color: "#6366f1", desc: "Serveurs, infra, administration" },
  { id: "LAN", name: "Management", subnet: "192.168.1.0/24", color: "#10b981", desc: "Switches HPE + machines physiques" },
  { id: "WAN", name: "Internet", subnet: "DHCP Box / Répéteur WiFi", color: "#64748b", desc: "pfSense WAN — coupure box = seul WAN coupe" },
];

const steps = [
  { phase: "Phase 1 — Concevoir", color: "#6366f1", steps: [
    { n: 1, label: "Figer objectifs de chaque projet (fil rouge DATASC.SEA)", done: true },
    { n: 2, label: "Définir rôle de chaque machine physique", done: true },
    { n: 3, label: "Définir stratégie réseau (autonomie pfSense)", done: true },
    { n: 4, label: "Schéma réseau + plan IP + tableau RAM/vCPU", done: true, current: true },
  ]},
  { phase: "Phase 2 — Construire", color: "#3b82f6", steps: [
    { n: 5, label: "Préparer clés USB bootables (Proxmox, PBS, Kali)" },
    { n: 6, label: "Installer Proxmox sur la Tour (NVMe Gen5 1TB)" },
    { n: 7, label: "Installer PBS bare-metal sur Dell 5590 #1" },
    { n: 8, label: "Déployer pfSense + interfaces VLAN 10/20/60" },
    { n: 9, label: "Déployer Windows Server AD/DNS/DHCP" },
    { n: 10, label: "Déployer Windows Server Fichiers + Ubuntu x2" },
    { n: 11, label: "Intégrer Dell 5420 au domaine DATASC.SEA" },
  ]},
  { phase: "Phase 3 — Sécuriser", color: "#f59e0b", steps: [
    { n: 12, label: "Règles firewall pfSense (isolation DMZ / LAN / Admin)" },
    { n: 13, label: "GPO sécurité (mots de passe, blocage USB, verrouillage)" },
    { n: 14, label: "Sauvegardes automatisées Proxmox → PBS (règle 3-2-1)" },
  ]},
  { phase: "Phase 4 — Superviser & Démontrer", color: "#22c55e", steps: [
    { n: 15, label: "Installer Wazuh sur Legion (agents sur toutes les VMs)" },
    { n: 16, label: "Installer Zabbix sur Legion (CPU/RAM/disk/réseau)" },
    { n: 17, label: "Laisser tourner 3-7 jours (historiques graphes + logs)" },
    { n: 18, label: "Simulation : Kali → Nmap → brute force → hash AD" },
    { n: 19, label: "Hashcat sur GPU tour → casser hash → justifier GPO" },
    { n: 20, label: "Capturer preuves : alertes Wazuh, dashboards, logs" },
  ]},
  { phase: "Phase 5 — Rédiger le dossier RNCP", color: "#ec4899", steps: [
    { n: 21, label: "Projet 1 : réécrire rapport DATASC.SEA à la 1ère personne" },
    { n: 22, label: "Projet 2 : rédiger dossier lab infra (choix, schémas, captures)" },
    { n: 23, label: "Projet 3 : rédiger dossier SOC + incident (preuves, remédiation)" },
    { n: 24, label: "Préparer slides soutenance orale" },
  ]},
];

export default function LabArchi() {
  const [tab, setTab] = useState("machines");
  const [selected, setSelected] = useState(null);

  const sel = machines.find(m => m.id === selected);

  return (
    <div style={{ fontFamily: "monospace", background: "#0a0a0f", minHeight: "100vh", color: "#e2e8f0", padding: "16px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, borderBottom: "1px solid #1e293b", paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
            <span style={{ color: "#64748b", fontSize: 10, letterSpacing: 3, textTransform: "uppercase" }}>RNCP 37680 — AIS</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Infrastructure DATASC.SEA</h1>
          <p style={{ color: "#64748b", fontSize: 12, marginTop: 4, marginBottom: 0 }}>Maquette PoC — Projets 2 & 3</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
          {[["machines","🖥️ Machines"],["reseau","🌐 Réseau"],["plan","📋 Plan"]].map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); setSelected(null); }}
              style={{ padding: "8px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
                fontFamily: "monospace", background: tab === t ? "#6366f1" : "#1e293b",
                color: tab === t ? "#fff" : "#64748b" }}>
              {label}
            </button>
          ))}
        </div>

        {/* MACHINES */}
        {tab === "machines" && (
          <div>
            <p style={{ fontSize: 11, color: "#475569", marginBottom: 14 }}>Clique sur une machine pour voir le détail</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
              {machines.map(m => (
                <div key={m.id} onClick={() => setSelected(selected === m.id ? null : m.id)}
                  style={{ background: selected === m.id ? "#1a2235" : "#111827",
                    border: `1px solid ${selected === m.id ? m.color : "#1e293b"}`,
                    borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                    boxShadow: selected === m.id ? `0 0 16px ${m.color}33` : "none", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 9, background: m.color + "22", color: m.color, padding: "2px 6px", borderRadius: 4, display: "inline-block", marginBottom: 8, letterSpacing: 1 }}>
                    {m.project}
                  </div>
                  <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 12, marginBottom: 4 }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.4 }}>{m.role}</div>
                  <div style={{ marginTop: 8, fontSize: 9, color: m.color, borderTop: "1px solid #1e293b", paddingTop: 6 }}>{m.os}</div>
                </div>
              ))}
            </div>

            {sel && (
              <div style={{ background: "#0f172a", border: `1px solid ${sel.color}55`, borderRadius: 12, padding: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ margin: 0, color: sel.color, fontSize: 16 }}>{sel.name}</h2>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 11 }}>{sel.specs}</p>
                </div>

                {sel.note && (
                  <div style={{ marginBottom: 16, background: sel.color + "11", border: `1px solid ${sel.color}33`, borderRadius: 8, padding: "10px 12px", fontSize: 11, color: sel.color, lineHeight: 1.5 }}>
                    ℹ️ {sel.note}
                  </div>
                )}
                {sel.gpu && (
                  <div style={{ marginBottom: 16, background: "#ef444411", border: "1px solid #ef444433", borderRadius: 8, padding: "10px 12px", fontSize: 11, color: "#ef4444" }}>
                    🔥 GPU : {sel.gpu}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: sel.vms.length > 0 ? "1fr 1fr" : "1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Stockage</div>
                    {sel.storage.map((s, i) => (
                      <div key={i} style={{ background: "#1e293b", borderRadius: 6, padding: "8px 10px", marginBottom: 6 }}>
                        <div style={{ color: "#f1f5f9", fontSize: 11, fontWeight: 600 }}>{s.label}</div>
                        <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>{s.usage}</div>
                      </div>
                    ))}
                    <div style={{ marginTop: 10, fontSize: 10, color: "#475569", fontStyle: "italic" }}>RAM totale : {sel.totalRam}</div>
                  </div>

                  {sel.vms.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>VMs déployées</div>
                      {sel.vms.map((vm, i) => (
                        <div key={i} style={{ background: "#1e293b", borderRadius: 6, padding: "8px 10px", marginBottom: 6, borderLeft: `3px solid ${vm.color}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#f1f5f9", fontSize: 11, fontWeight: 700 }}>{vm.name}</span>
                            <span style={{ fontSize: 9, color: vm.color }}>{vm.type}</span>
                          </div>
                          <div style={{ display: "flex", gap: 10, fontSize: 9, color: "#64748b", marginTop: 4 }}>
                            <span>⚡ {vm.cpu}</span><span>🧠 {vm.ram}</span><span>💾 {vm.disk}</span>
                          </div>
                          <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>🌐 {vm.net}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RÉSEAU */}
        {tab === "reseau" && (
          <div>
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>
                Segmentation 100% virtuelle — pfSense + Linux Bridges Proxmox (switches HPE non manageables)
              </div>
              {vlans.map(v => (
                <div key={v.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "10px 12px",
                  marginBottom: 6, background: "#111827", borderRadius: 8, borderLeft: `4px solid ${v.color}` }}>
                  <div style={{ minWidth: 130 }}>
                    <div style={{ color: v.color, fontWeight: 700, fontSize: 12 }}>{v.id} — {v.name}</div>
                    <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>{v.subnet}</div>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 11 }}>{v.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Flux réseau</div>
              {[
                { from: "Box / Répéteur WiFi", to: "pfSense WAN", arrow: "→", note: "Internet entrant" },
                { from: "pfSense LAN", to: "Switch HPE", arrow: "→", note: "LAN interne lab" },
                { from: "Switch HPE", to: "Tour / Legion / Dells", arrow: "→", note: "Câble RJ45" },
                { from: "Tour (Proxmox)", to: "PBS (Dell 5590 #1)", arrow: "→", note: "Sauvegardes VMs" },
                { from: "Wazuh (Legion)", to: "VMs Tour", arrow: "←", note: "Collecte logs / alertes" },
                { from: "Kali (Dell 5590 #2)", to: "LAN lab", arrow: "⚡", note: "Attaques simulées" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ color: "#6366f1", minWidth: 140 }}>{f.from}</span>
                  <span style={{ color: f.arrow === "⚡" ? "#ef4444" : "#64748b" }}>{f.arrow}</span>
                  <span style={{ color: "#94a3b8", minWidth: 130 }}>{f.to}</span>
                  <span style={{ color: "#475569", fontStyle: "italic", fontSize: 10 }}>{f.note}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Contraintes & solutions</div>
              {[
                { prob: "Switches non manageables", sol: "Segmentation 100% logique via pfSense + Linux Bridges Proxmox", color: "#f59e0b" },
                { prob: "Box éteinte la nuit", sol: "pfSense = routeur autonome. Quand box coupe → seul WAN coupe, LAN reste UP", color: "#22c55e" },
                { prob: "Pas de câblage RJ45 terminé", sol: "Répéteur WiFi en Ethernet suffit. LAN interne autonome sans Internet", color: "#22c55e" },
                { prob: "Kali sur le LAN = risque", sol: "Dell 5590 #2 débranché hors simulations. Allumé uniquement pour les tests", color: "#ef4444" },
              ].map((c, i) => (
                <div key={i} style={{ marginBottom: 10, padding: "10px 12px", background: "#111827", borderRadius: 8, borderLeft: `3px solid ${c.color}` }}>
                  <div style={{ color: "#ef4444", fontSize: 11, marginBottom: 4 }}>⚠ {c.prob}</div>
                  <div style={{ color: "#94a3b8", fontSize: 11 }}>✓ {c.sol}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLAN */}
        {tab === "plan" && (
          <div>
            {steps.map((phase, pi) => (
              <div key={pi} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ height: 2, width: 16, background: phase.color }} />
                  <span style={{ color: phase.color, fontWeight: 700, fontSize: 13 }}>{phase.phase}</span>
                </div>
                {phase.steps.map((s, si) => (
                  <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", marginBottom: 4,
                    background: s.current ? phase.color + "15" : "#111827",
                    border: s.current ? `1px solid ${phase.color}66` : "1px solid #1e293b",
                    borderRadius: 8 }}>
                    <div style={{ minWidth: 24, height: 24, borderRadius: "50%",
                      background: s.done ? phase.color : "#1e293b",
                      border: s.current ? `2px solid ${phase.color}` : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, color: s.done ? "#000" : "#64748b", fontWeight: 700, flexShrink: 0 }}>
                      {s.done ? "✓" : s.n}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, color: s.current ? "#f1f5f9" : s.done ? "#475569" : "#94a3b8" }}>
                        {s.label}
                      </span>
                      {s.current && (
                        <span style={{ marginLeft: 8, fontSize: 9, color: phase.color, background: phase.color + "22", padding: "1px 6px", borderRadius: 4 }}>
                          ← TU ES ICI
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 28, padding: "10px 14px", background: "#111827", borderRadius: 8, fontSize: 10, color: "#475569", borderLeft: "3px solid #6366f1" }}>
          RNCP 37680 — AIS — Lab DATASC.SEA PoC — 3 projets : Audit · Infrastructure · SOC
        </div>
      </div>
    </div>
  );
}
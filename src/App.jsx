import { useState } from "react";

const M = [
  {
    id: "tour", name: "Tour Principale", role: "Hyperviseur principal", os: "Proxmox VE (bare-metal)",
    specs: "Ryzen 7 9800X3D · 32 GB DDR5 · RX 9070 XT · RM850x", proj: "Projet 2", col: "#6366f1",
    note: "Cœur du lab. Héberge toutes les VMs de l'infrastructure DATASC.SEA. Le GPU RX 9070 XT sera utilisé pour Hashcat lors de la simulation d'attaque du Projet 3.",
    gpu: "RX 9070 XT → Hashcat (cassage hash NTLM) — Projet 3",
    storage: [
      { l: "NVMe Gen5 1TB", u: "Proxmox OS + VMs critiques (pfSense, AD, FS)" },
      { l: "SSD SATA 2TB", u: "VMs secondaires + stockage ISOs" },
      { l: "HDD 1TB", u: "Backups locaux + archives" },
      { l: "NVMe 256GB", u: "Réserve / swap / temp" },
    ],
    vms: [
      { n: "pfSense", t: "Firewall · Routeur · DHCP · NAT", cpu: "2 vCPU", ram: "2 GB", disk: "20 GB", ip: "10.0.0.254 (GW)", col: "#ef4444" },
      { n: "Windows Server AD", t: "Active Directory · DNS · GPO", cpu: "2 vCPU", ram: "4 GB", disk: "80 GB", ip: "10.0.99.10", col: "#3b82f6" },
      { n: "Windows Server FS", t: "Serveur de fichiers · AGDLP", cpu: "2 vCPU", ram: "4 GB", disk: "100 GB", ip: "10.0.99.11", col: "#3b82f6" },
      { n: "Ubuntu Server", t: "Service web Apache · logs Linux", cpu: "2 vCPU", ram: "2 GB", disk: "30 GB", ip: "10.0.99.12", col: "#22c55e" },
    ],
    ram: "12 GB alloués / 32 GB disponibles", ramPct: 38,
  },
  {
    id: "legion", name: "Lenovo Legion Y540", role: "SOC / SIEM / Supervision", os: "Ubuntu Server + Wazuh",
    specs: "i7-9750H · 32 GB RAM · RTX 2060 · NVMe 512 GB", proj: "Projet 3", col: "#f59e0b",
    note: "Pôle sécurité du lab. Wazuh reçoit les logs de toutes les VMs, génère les alertes, détecte les attaques Kali. Les dashboards Wazuh = preuves visuelles principales pour le jury. Zabbix en option si temps restant.",
    storage: [{ l: "NVMe 512 GB", u: "Ubuntu + Wazuh + OpenSearch + logs" }],
    vms: [{ n: "Wazuh SIEM", t: "Détection · Alertes · Logs centralisés", cpu: "4 vCPU", ram: "12 GB", disk: "100 GB", ip: "10.0.100.10", col: "#f59e0b" }],
    ram: "12 GB / 32 GB — Wazuh+OpenSearch est gourmand, le Legion tient largement", ramPct: 38,
  },
  {
    id: "dell1", name: "Dell Latitude 5590 #1", role: "Serveur de sauvegardes", os: "Proxmox Backup Server (bare-metal)",
    specs: "8 GB DDR4 SODIMM 2400 MHz", proj: "Projet 2", col: "#10b981",
    note: "PBS bare-metal. Physiquement séparé de la prod = règle 3-2-1. Argument béton pour le jury : sauvegarde sur machine physique distincte, conforme aux bonnes pratiques ANSSI. Si le SSD interne est < 256 GB, ajouter un disque USB 3.0.",
    storage: [{ l: "SSD interne", u: "PBS — stockage des backups VMs" }, { l: "Disque USB 3.0 (si besoin)", u: "Capacité supplémentaire" }],
    vms: [], ram: "PBS est léger — toute la RAM est pour lui", ramPct: 0,
  },
  {
    id: "dell5420", name: "Dell Latitude 5420", role: "Poste client / admin domaine", os: "Windows 11 Pro",
    specs: "8 GB DDR4 3200 MHz", proj: "Projet 2", col: "#0ea5e9",
    note: "Poste de démonstration. Joint au domaine DATASC.SEA. Tests GPO en conditions réelles. Administration AD à distance via les RSAT. Preuve que l'infra fonctionne côté utilisateur.",
    storage: [{ l: "SSD interne", u: "Windows 11 Pro — client domaine" }],
    vms: [], ram: "8 GB — suffisant", ramPct: 0,
  },
  {
    id: "dell2", name: "Dell Latitude 5590 #2", role: "Machine d'attaque — Red Team", os: "Kali Linux",
    specs: "8 GB DDR4 SODIMM 2400 MHz", proj: "Projet 3", col: "#ef4444",
    note: "DÉBRANCHÉE en temps normal. Connectée uniquement lors des simulations d'attaque. Séquence : Nmap → brute force → récupération hash NTLM → Hashcat sur le GPU de la tour. Les alertes Wazuh doivent remonter en live.",
    storage: [{ l: "SSD/HDD interne", u: "Kali Linux + outils offensifs" }],
    vms: [], ram: "8 GB — suffisant", ramPct: 0,
  },
];

const VLANS = [
  { id: "LAN Management", subnet: "10.0.0.0/24", col: "#64748b", desc: "Réseau de base — pfSense GW 10.0.0.254" },
  { id: "VLAN 10 — Commerciaux", subnet: "10.0.10.0/24", col: "#f59e0b", desc: "Postes utilisateurs (héritage rapport DATASC.SEA)" },
  { id: "VLAN 20 — RH", subnet: "10.0.20.0/24", col: "#ec4899", desc: "Postes RH — données sensibles" },
  { id: "VLAN 60 — DSI / Admin", subnet: "10.0.60.0/24", col: "#6366f1", desc: "Dell 5420 Admin → 10.0.60.10" },
  { id: "VLAN 99 — Serveurs", subnet: "10.0.99.0/24", col: "#3b82f6", desc: "AD .10 · FS .11 · Ubuntu .12 · PBS .50" },
  { id: "VLAN 100 — SOC", subnet: "10.0.100.0/24", col: "#f59e0b", desc: "Wazuh → 10.0.100.10" },
  { id: "Kali — Isolé", subnet: "192.168.66.0/24", col: "#ef4444", desc: "Dell 5590 #2 → 192.168.66.10 — branché en simulation seulement" },
];

const FLUX = [
  { a: "Box / répéteur WiFi", b: "→", c: "pfSense WAN", n: "Internet entrant", atk: false },
  { a: "pfSense", b: "→", c: "Switch HPE", n: "LAN lab — tous VLANs", atk: false },
  { a: "Switch HPE", b: "→", c: "Tour · Legion · Dells", n: "Câbles RJ45", atk: false },
  { a: "Tour Proxmox", b: "→", c: "PBS (Dell #1)", n: "Jobs backup automatiques", atk: false },
  { a: "Wazuh (Legion)", b: "←", c: "Toutes les VMs", n: "Agents Wazuh — collecte logs", atk: false },
  { a: "Kali (Dell #2)", b: "⚡", c: "VMs Tour", n: "Attaques simulées — Nmap · brute force", atk: true },
  { a: "Hash NTLM", b: "→", c: "GPU tour (Hashcat)", n: "Cassage → justifie les GPO AD", atk: true },
];

const CSTS = [
  { p: "Switches HPE non manageables (pas de VLANs 802.1q)", s: "Segmentation 100% logique via pfSense + Linux Bridges Proxmox. Le switch = multiprise RJ45.", col: "#f59e0b" },
  { p: "Box internet éteinte la nuit", s: "pfSense = routeur autonome. Quand la box coupe, seul le WAN coupe. Le LAN lab reste 100% opérationnel.", col: "#22c55e" },
  { p: "Câblage RJ45 pas encore terminé", s: "Le répéteur WiFi en Ethernet suffit. Le lab fonctionne entièrement en LAN local sans Internet permanent.", col: "#22c55e" },
  { p: "Kali sur le LAN = risque de propagation", s: "Dell 5590 #2 physiquement débranché hors simulations. Branché uniquement lors des tests d'attaque contrôlés.", col: "#ef4444" },
];

const PHASES = [
  {
    ph: "Phase 1 — Préparer le matériel", col: "#6366f1", steps: [
      { n: 1, l: "Télécharger Proxmox VE 8.x sur proxmox.com/downloads", cur: true },
      { n: 2, l: "Télécharger Proxmox Backup Server sur proxmox.com/downloads" },
      { n: 3, l: "Télécharger Kali Linux (Installer 64-bit) sur kali.org/get-kali" },
      { n: 4, l: "Télécharger Rufus sur rufus.ie" },
      { n: 5, l: "Flasher clé USB #1 avec Proxmox VE (mode DD dans Rufus)" },
      { n: 6, l: "Flasher clé USB #2 avec PBS (mode DD dans Rufus)" },
    ]
  },
  {
    ph: "Phase 2 — Installer les hyperviseurs", col: "#3b82f6", steps: [
      { n: 7, l: "BIOS tour MSI B850 : activer SVM Mode + désactiver Secure Boot" },
      { n: 8, l: "Installer Proxmox VE sur le NVMe Gen5 1TB · IP temp 192.168.1.100" },
      { n: 9, l: "Vérifier accès interface web : https://192.168.1.100:8006" },
      { n: 10, l: "Installer PBS bare-metal sur Dell 5590 #1 · IP temp 192.168.1.101" },
      { n: 11, l: "Vérifier accès interface web PBS : https://192.168.1.101:8007" },
    ]
  },
  {
    ph: "Phase 3 — Construire le SI", col: "#0ea5e9", steps: [
      { n: 12, l: "Créer VM pfSense → configurer WAN + LAN + VLANs 10/20/60/99/100" },
      { n: 13, l: "Créer VM Windows Server → AD, DNS, domaine DATASC.SEA" },
      { n: 14, l: "Créer VM Windows Server → Serveur de fichiers, partages, AGDLP" },
      { n: 15, l: "Créer VM Ubuntu Server → Apache, logs activés, IP 10.0.99.12" },
      { n: 16, l: "Joindre Dell 5420 au domaine → tester GPO de base" },
    ]
  },
  {
    ph: "Phase 4 — Sécuriser", col: "#f59e0b", steps: [
      { n: 17, l: "Règles firewall pfSense : isoler VLANs, bloquer flux non nécessaires" },
      { n: 18, l: "GPO : complexité mots de passe, verrouillage session, blocage USB" },
      { n: 19, l: "Connecter Proxmox au PBS → créer jobs backup automatiques" },
      { n: 20, l: "Faire une restauration test → capturer la preuve pour le dossier" },
    ]
  },
  {
    ph: "Phase 5 — SOC & simulation d'attaque", col: "#22c55e", steps: [
      { n: 21, l: "Installer Wazuh sur Legion · déployer agents sur toutes les VMs" },
      { n: 22, l: "Configurer alertes : échecs connexion, scan réseau, service down" },
      { n: 23, l: "Laisser tourner 5-7 jours → accumuler logs, graphes, historique" },
      { n: 24, l: "Installer Kali sur Dell 5590 #2" },
      { n: 25, l: "Simulation : Nmap → brute force → récupérer hash NTLM depuis AD" },
      { n: 26, l: "Hashcat sur GPU tour (RX 9070 XT) → casser hash → justifier GPO" },
      { n: 27, l: "Capturer tout : alertes Wazuh, résultats Hashcat, logs, dashboards" },
      { n: 28, l: "(Optionnel) Installer Zabbix si temps restant → graphes CPU/RAM" },
    ]
  },
  {
    ph: "Phase 6 — Dossier RNCP", col: "#ec4899", steps: [
      { n: 29, l: "Projet 1 : adapter rapport DATASC.SEA 69p → réécrire à la 1ère personne (rôle S1/S4/S8/S9)" },
      { n: 30, l: "Projet 2 : rédiger dossier lab infra — contexte, choix techniques, schémas, captures" },
      { n: 31, l: "Projet 3 : rédiger dossier SOC + incident — boucle Red→Blue→remédiation, preuves" },
      { n: 32, l: "Préparer slides soutenance orale" },
    ]
  },
];

export default function App() {
  const [tab, setTab] = useState("machines");
  const [sel, setSel] = useState(null);
  const m = M.find(x => x.id === sel);

  return (
    <div style={{ fontFamily: "monospace", padding: 16, maxWidth: 880, margin: "0 auto", color: "#e2e8f0", background: "#0a0a0f", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e293b", paddingBottom: 14, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 10, letterSpacing: 2, color: "#64748b", textTransform: "uppercase" }}>RNCP 37680 — AIS — Architecture finale</span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: "#f1f5f9", margin: 0 }}>Lab DATASC.SEA</h1>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Version définitive · Projets 2 & 3 · On commence demain</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 18 }}>
        {[["machines", "🖥 Machines"], ["reseau", "🌐 Réseau & VLANs"], ["plan", "📋 Plan d'installation"]].map(([t, l]) => (
          <button key={t} onClick={() => { setTab(t); setSel(null); }}
            style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #1e293b", background: tab === t ? "#f1f5f9" : "transparent", color: tab === t ? "#0a0a0f" : "#94a3b8", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>
            {l}
          </button>
        ))}
      </div>

      {/* MACHINES */}
      {tab === "machines" && (
        <div>
          <p style={{ fontSize: 11, color: "#475569", marginBottom: 12 }}>Clique sur une machine pour le détail complet</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10, marginBottom: 18 }}>
            {M.map(mc => (
              <div key={mc.id} onClick={() => setSel(sel === mc.id ? null : mc.id)}
                style={{ border: `1px solid ${sel === mc.id ? mc.col : "#1e293b"}`, borderRadius: 10, padding: 12, cursor: "pointer", background: sel === mc.id ? "#111827" : "transparent", transition: "all .15s" }}>
                <span style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, background: mc.col + "18", color: mc.col, display: "inline-block", marginBottom: 8 }}>{mc.proj}</span>
                <div style={{ fontWeight: 500, fontSize: 12, marginBottom: 3, color: "#f1f5f9" }}>{mc.name}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.4 }}>{mc.role}</div>
                <div style={{ fontSize: 9, color: mc.col, marginTop: 8, paddingTop: 7, borderTop: "1px solid #1e293b" }}>{mc.os}</div>
              </div>
            ))}
          </div>

          {m && (
            <div style={{ border: `1px solid ${m.col}44`, borderRadius: 12, padding: 18, background: "#0f172a" }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: m.col, marginBottom: 3 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>{m.specs}</div>
              {m.note && <div style={{ borderLeft: `3px solid ${m.col}`, borderRadius: "0 7px 7px 0", padding: "9px 11px", fontSize: 11, lineHeight: 1.5, marginBottom: 10, background: "#111827", color: "#94a3b8" }}>ℹ {m.note}</div>}
              {m.gpu && <div style={{ borderLeft: "3px solid #ef4444", borderRadius: "0 7px 7px 0", padding: "9px 11px", fontSize: 11, marginBottom: 10, background: "#111827", color: "#ef4444" }}>🔥 {m.gpu}</div>}
              <div style={{ display: "grid", gridTemplateColumns: m.vms.length ? "1fr 1fr" : "1fr", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Stockage</div>
                  {m.storage.map((s, i) => (
                    <div key={i} style={{ border: "1px solid #1e293b", borderRadius: 6, padding: "7px 10px", marginBottom: 5 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: "#f1f5f9" }}>{s.l}</div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{s.u}</div>
                    </div>
                  ))}
                  {!m.vms.length && <div style={{ fontSize: 10, color: "#475569", marginTop: 6, fontStyle: "italic" }}>{m.ram}</div>}
                </div>
                {m.vms.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>VMs hébergées</div>
                    {m.vms.map((v, i) => (
                      <div key={i} style={{ borderLeft: `3px solid ${v.col}`, borderRadius: 6, padding: "8px 10px", marginBottom: 5, background: "#111827" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, fontWeight: 500, color: "#f1f5f9" }}>{v.n}</span>
                          <span style={{ fontSize: 9, color: "#64748b" }}>{v.t}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, fontSize: 9, color: "#64748b", marginTop: 4, flexWrap: "wrap" }}>
                          <span>⚡ {v.cpu}</span><span>🧠 {v.ram}</span><span>💾 {v.disk}</span><span>🌐 {v.ip}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 6, fontStyle: "italic" }}>{m.ram}</div>
                    {m.ramPct > 0 && (
                      <div style={{ height: 6, borderRadius: 3, background: "#1e293b", marginTop: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: m.ramPct + "%", background: m.col, borderRadius: 3 }} />
                      </div>
                    )}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#64748b", marginBottom: 10 }}>Plan réseau — VLANs logiques via pfSense</div>
              {VLANS.map((v, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 8, marginBottom: 5, borderLeft: `4px solid ${v.col}`, background: "#111827", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 90 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#f1f5f9" }}>{v.id}</div>
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{v.subnet}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{v.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#64748b", marginBottom: 10 }}>Flux entre les machines</div>
              {FLUX.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, padding: "6px 0", borderBottom: "1px solid #1e293b", flexWrap: "wrap" }}>
                  <span style={{ color: "#94a3b8", minWidth: 110 }}>{f.a}</span>
                  <span style={{ color: f.atk ? "#ef4444" : "#64748b", minWidth: 18, textAlign: "center" }}>{f.b}</span>
                  <span style={{ color: "#94a3b8", minWidth: 110 }}>{f.c}</span>
                  <span style={{ fontSize: 9, color: "#475569", fontStyle: "italic" }}>{f.n}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#64748b", marginBottom: 10 }}>Contraintes & solutions retenues</div>
            {CSTS.map((c, i) => (
              <div key={i} style={{ borderLeft: `3px solid ${c.col}`, borderRadius: 8, padding: "9px 11px", marginBottom: 8, background: "#111827" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>⚠ {c.p}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>✓ {c.s}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PLAN */}
      {tab === "plan" && (
        <div>
          {PHASES.map((ph, pi) => (
            <div key={pi} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ height: 2, width: 16, background: ph.col, borderRadius: 1 }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: ph.col }}>{ph.ph}</span>
              </div>
              {ph.steps.map((s, si) => (
                <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", borderRadius: 8, marginBottom: 4, border: `1px solid ${s.cur ? "#334155" : "#1e293b"}`, background: s.cur ? "#111827" : "transparent" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 500, flexShrink: 0, border: `${s.cur ? 2 : 1}px solid ${s.cur ? ph.col : "#334155"}`, background: s.done ? "#f1f5f9" : "transparent", color: s.done ? "#0a0a0f" : "#64748b" }}>
                    {s.done ? "✓" : s.n}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, lineHeight: 1.5, color: s.cur ? "#f1f5f9" : s.done ? "#475569" : "#94a3b8" }}>{s.l}</span>
                    {s.cur && <span style={{ fontSize: 9, color: ph.col, background: ph.col + "18", padding: "1px 6px", borderRadius: 4, marginLeft: 6 }}>← TU ES ICI</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, padding: "10px 14px", borderRadius: 8, fontSize: 10, color: "#475569", borderLeft: "3px solid #334155" }}>
        RNCP 37680 · AIS · Lab DATASC.SEA PoC · Projet 1 : Audit/Gouvernance · Projet 2 : Infrastructure · Projet 3 : SOC/Incident
      </div>
    </div>
  );
}
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";
import { 
  AlertCircle, Clock, CheckCircle2, Wrench, FileText, Search, Plus, 
  Building2, Calendar, Loader2, ArchiveRestore, BellRing
} from "lucide-react";
import { ClaimSheet } from "@/components/ClaimSheet";
import { ClaimFormDialog } from "@/components/ClaimFormDialog";
import { supabase } from "@/lib/supabase";

export type ClaimStatus = "Attente Devis" | "Attente Assurance" | "Expertise Prévue" | "Attente Réparation" | "En Travaux" | "Clôturé";
const STATUS_ORDER: ClaimStatus[] = ["Attente Devis", "Attente Assurance", "Expertise Prévue", "Attente Réparation", "En Travaux"];

export interface Claim {
  id: string; status: ClaimStatus; last_followup_date: string; incident_date: string;
  claim_number: string; owner: string; tenant: string; address: string; damage_nature: string;
  damage_origin: string; craftsman: string | null; quote_amount: number | null;
  documents?: string[]; urgency: number; syndic_name?: string; syndic_contact?: string; tenant_contact?: string; insurer_name?: string;
  next_reminder_date?: string | null; next_reminder_note?: string | null;
  is_constat_done?: boolean; is_declaration_done?: boolean;
  tenant_email?: string; insurer_phone?: string; insurer_email?: string;
  expert_name?: string; expert_phone?: string; expert_email?: string;
  expertise_date?: string | null;
}

const getStatusConfig = (status: ClaimStatus) => {
  switch (status) {
    case "Attente Devis": return { text: "text-amber-800", bg: "bg-amber-200/50", border: "border-amber-300", cardBase: "bg-gradient-to-br from-amber-100 to-orange-50 border-amber-300", cardHover: "hover:border-amber-400 hover:shadow-[0_15px_40px_rgba(245,158,11,0.2)] -translate-y-1", icon: Clock };
    case "Attente Assurance": return { text: "text-fuchsia-800", bg: "bg-fuchsia-200/50", border: "border-fuchsia-300", cardBase: "bg-gradient-to-br from-fuchsia-100 to-pink-50 border-fuchsia-300", cardHover: "hover:border-fuchsia-400 hover:shadow-[0_15px_40px_rgba(217,70,239,0.2)] -translate-y-1", icon: AlertCircle };
    case "Expertise Prévue": return { text: "text-cyan-800", bg: "bg-cyan-200/50", border: "border-cyan-300", cardBase: "bg-gradient-to-br from-cyan-100 to-blue-50 border-cyan-300", cardHover: "hover:border-cyan-400 hover:shadow-[0_15px_40px_rgba(6,182,212,0.2)] -translate-y-1", icon: Calendar };
    case "Attente Réparation": return { text: "text-rose-800", bg: "bg-rose-200/50", border: "border-rose-300", cardBase: "bg-gradient-to-br from-rose-100 to-red-50 border-rose-300", cardHover: "hover:border-rose-400 hover:shadow-[0_15px_40px_rgba(225,29,72,0.2)] -translate-y-1", icon: Wrench };
    case "En Travaux": return { text: "text-indigo-800", bg: "bg-indigo-200/50", border: "border-indigo-300", cardBase: "bg-gradient-to-br from-indigo-100 to-violet-50 border-indigo-300", cardHover: "hover:border-indigo-400 hover:shadow-[0_15px_40px_rgba(99,102,241,0.2)] -translate-y-1", icon: Wrench };
    case "Clôturé": return { text: "text-emerald-800", bg: "bg-emerald-200/50", border: "border-emerald-300", cardBase: "bg-gradient-to-br from-emerald-100 to-teal-50 border-emerald-300", cardHover: "hover:border-emerald-400 hover:shadow-[0_15px_40px_rgba(16,185,129,0.2)] -translate-y-1", icon: CheckCircle2 };
    default: return { text: "text-indigo-600", bg: "bg-indigo-100/50", border: "border-indigo-200", cardBase: "bg-gradient-to-br from-white/60 to-white/30 border-white/60", cardHover: "hover:shadow-2xl -translate-y-1", icon: FileText };
  }
};

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function NexusDashboard() {
  const [activeTab, setActiveTab] = useState<"Actifs" | "Archives">("Actifs");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClaims = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('claims').select('*').order('last_followup_date', { ascending: true });
      if (error) throw error;
      setClaims(data);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const filteredClaims = claims.filter(c => {
    const matchesSearch = c.claim_number.toLowerCase().includes(searchQuery.toLowerCase()) || c.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "Actifs" ? c.status !== "Clôturé" : c.status === "Clôturé";
    return matchesSearch && matchesTab;
  });

  const ClaimCard = ({ claim }: { claim: Claim }) => {
    const st = getStatusConfig(claim.status);
    const StatusIcon = st.icon;
    const currentUrgency = claim.urgency || 1;
    const today = new Date().toISOString().split('T')[0];
    const isReminderDue = claim.next_reminder_date && claim.next_reminder_date <= today;
    
    return (
      <motion.div
        layoutId={claim.id} variants={itemVariants} initial="hidden" animate="show"
        onClick={() => { setSelectedClaim(claim); setIsSheetOpen(true); }}
        className={`relative group cursor-pointer border-4 shadow-lg rounded-[2.5rem] p-10 transition-all duration-500 flex flex-col justify-between backdrop-blur-sm ${st.cardBase} ${st.cardHover} ${isReminderDue ? 'ring-4 ring-rose-400 ring-offset-4' : ''}`}
      >
        <div>
          <div className="flex items-start justify-between mb-10 relative z-10">
            <div className="flex-1 pr-4">
              <span className="text-sm uppercase tracking-[0.3em] text-indigo-900/50 font-black mb-3 block">{claim.claim_number}</span>
              <h3 className="text-3xl font-black text-indigo-950 leading-[1.1] tracking-tight group-hover:scale-[1.02] origin-left transition-transform">{claim.damage_origin}</h3>
            </div>
            <div className="flex flex-col items-end gap-5 shrink-0">
               <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black tracking-wide border-2 shadow-sm backdrop-blur-md ${st.bg} ${st.text} ${st.border}`}>
                <StatusIcon className="w-5 h-5" /> {claim.status}
              </div>
              <div className="flex gap-1.5" title={`Urgence : ${currentUrgency}/5`}>
                {[1,2,3,4,5].map(i => {
                  let colorClass = "bg-white/50 border border-white/60";
                  if (i <= currentUrgency) {
                    if (currentUrgency <= 2) colorClass = "bg-emerald-400 border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.6)]";
                    else if (currentUrgency === 3) colorClass = "bg-amber-400 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.6)]";
                    else colorClass = "bg-rose-500 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]";
                  }
                  return <div key={i} className={`w-3 h-7 rounded-full transition-all duration-300 ${colorClass}`} />;
                })}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-10 mb-8 relative z-10 bg-white/40 group-hover:bg-white/60 transition-colors p-8 rounded-3xl border-2 border-white/50 shadow-inner">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-indigo-900/60 mb-3 block flex items-center gap-2.5"><Building2 className="w-5 h-5 text-indigo-400" /> Propriété</span>
              <p className="text-xl font-bold text-indigo-950 truncate" title={claim.owner}>{claim.owner}</p>
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-indigo-900/60 mb-3 block flex items-center gap-2.5"><Calendar className="w-5 h-5 text-indigo-400" /> Déclaration</span>
              <p className="text-xl font-bold text-indigo-950">{new Date(claim.incident_date).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>

        <div>
          {isReminderDue && (
            <div className="mb-8 bg-gradient-to-r from-rose-400 to-pink-500 border-2 border-rose-300 rounded-3xl p-6 flex items-start gap-5 shadow-xl shadow-rose-500/20 text-white">
              <div className="bg-white/20 p-3 rounded-2xl shrink-0 backdrop-blur-md">
                <BellRing className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-black text-rose-100 uppercase tracking-widest mb-1">Relance Prioritaire</p>
                <p className="text-lg font-bold text-white leading-snug">{claim.next_reminder_note || "Une action immédiate est requise."}</p>
              </div>
            </div>
          )}

          <div className="pt-8 border-t-4 border-white/40 flex items-center justify-between relative z-10">
            <span className="text-sm font-bold text-indigo-900/60">Dernière maj : {new Date(claim.last_followup_date).toLocaleDateString('fr-FR')}</span>
            {!isReminderDue && claim.next_reminder_date && (
              <span className="text-sm font-black text-indigo-700 bg-white/50 border-2 border-white/80 px-4 py-2 rounded-xl shadow-sm">
                Relance le {new Date(claim.next_reminder_date).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-indigo-950 font-sans pb-20 selection:bg-fuchsia-300 selection:text-fuchsia-900 relative">
      
      {/* HALOS ULTRA-VIBRANTS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-80">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[50%] bg-fuchsia-400/30 blur-[150px] rounded-full mix-blend-multiply animate-pulse duration-[8s]" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[40%] bg-cyan-400/30 blur-[130px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-amber-400/30 blur-[160px] rounded-full mix-blend-multiply" />
      </div>
      
      <div className="relative z-10 max-w-[1600px] mx-auto px-10 py-16">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
          <div className="flex items-center gap-10 hover:scale-105 transition-transform duration-500 cursor-default">
            <div className="relative w-40 h-40 drop-shadow-2xl">
              <Image src="/logo.png" alt="Stormy Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-900 via-fuchsia-900 to-indigo-900 mb-2">Stormy</h1>
              <p className="text-2xl text-indigo-600/80 font-bold tracking-tight">Plateforme de gestion opérationnelle</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group hidden sm:block">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-fuchsia-500 group-focus-within:text-fuchsia-600 transition-colors" />
              <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-96 bg-white/60 backdrop-blur-xl border-4 border-white/80 rounded-[2rem] py-5 pl-16 pr-6 text-lg font-bold text-indigo-950 shadow-[0_10px_40px_rgb(0,0,0,0.05)] focus:outline-none focus:border-fuchsia-400 focus:bg-white/90 focus:ring-4 focus:ring-fuchsia-500/20 transition-all placeholder:text-indigo-400" />
            </div>
            <button onClick={() => setIsFormOpen(true)} className="bg-gradient-to-br from-fuchsia-600 to-pink-500 text-white hover:from-fuchsia-500 hover:to-pink-400 px-12 py-6 rounded-[2.5rem] text-xl font-black tracking-wide transition-all duration-300 flex items-center gap-4 shadow-xl shadow-fuchsia-500/30 hover:shadow-2xl hover:-translate-y-1 active:scale-95 border-2 border-fuchsia-400/50">
              <Plus className="w-7 h-7 stroke-[4]" /> <span>Nouveau dossier</span>
            </button>
          </div>
        </header>

        <div className="flex items-center gap-4 mb-16 bg-white/40 backdrop-blur-md w-fit p-3 rounded-[2.5rem] border-4 border-white/60 shadow-lg shadow-indigo-900/5">
          <button onClick={() => setActiveTab("Actifs")} className={`px-12 py-5 rounded-[1.5rem] text-xl font-black transition-all duration-300 ${activeTab === "Actifs" ? "bg-white text-fuchsia-600 shadow-md scale-105 border-2 border-fuchsia-100" : "text-indigo-500 hover:text-indigo-800 hover:bg-white/50"}`}>Dossiers en cours</button>
          <button onClick={() => setActiveTab("Archives")} className={`px-12 py-5 rounded-[1.5rem] text-xl font-black transition-all duration-300 flex items-center gap-4 ${activeTab === "Archives" ? "bg-white text-indigo-900 shadow-md scale-105 border-2 border-indigo-100" : "text-indigo-500 hover:text-indigo-800 hover:bg-white/50"}`}><ArchiveRestore className="w-7 h-7" /> Archives</button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40"><Loader2 className="w-20 h-20 text-fuchsia-500 animate-spin mb-8 drop-shadow-lg" /><p className="text-3xl text-indigo-600 font-black tracking-tight">Chargement de la magie...</p></div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-32 bg-white/40 backdrop-blur-md border-4 border-dashed border-white/80 rounded-[4rem] text-4xl text-indigo-400 font-black shadow-inner">Aucun sinistre trouvé.</div>
        ) : activeTab === "Archives" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12"><AnimatePresence>{filteredClaims.map(claim => <ClaimCard key={claim.id} claim={claim} />)}</AnimatePresence></div>
        ) : (
          <div className="space-y-32">
            {STATUS_ORDER.map(status => {
              const claimsInStatus = filteredClaims.filter(c => c.status === status).sort((a, b) => (b.urgency || 1) - (a.urgency || 1)); 
              if (claimsInStatus.length === 0) return null;
              const st = getStatusConfig(status);
              return (
                <div key={status} className="relative">
                  <div className="flex items-center gap-6 mb-12 pl-4">
                    <h2 className="text-5xl font-black text-indigo-950 tracking-tight drop-shadow-sm">{status}</h2>
                    <span className={`px-6 py-2.5 rounded-2xl ${st.bg} ${st.text} border-2 ${st.border} text-xl font-black shadow-sm backdrop-blur-md`}>{claimsInStatus.length}</span>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 items-stretch relative z-10">
                    <AnimatePresence>{claimsInStatus.map(claim => <ClaimCard key={claim.id} claim={claim} />)}</AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ClaimSheet claim={selectedClaim} isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} onClaimUpdated={(updatedClaim) => { setSelectedClaim(updatedClaim); fetchClaims(); }} onClaimDeleted={() => { setIsSheetOpen(false); fetchClaims(); }} />
      <ClaimFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={() => fetchClaims()} />
    </div>
  );
}
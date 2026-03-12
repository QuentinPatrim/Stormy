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
}

const getStatusConfig = (status: ClaimStatus) => {
  switch (status) {
    case "Attente Devis": return { text: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200", cardBase: "bg-amber-50/50 border-amber-200", cardHover: "hover:bg-amber-100/50 hover:border-amber-300 hover:shadow-amber-500/10", icon: Clock };
    case "Attente Assurance": return { text: "text-purple-700", bg: "bg-purple-100", border: "border-purple-200", cardBase: "bg-purple-50/50 border-purple-200", cardHover: "hover:bg-purple-100/50 hover:border-purple-300 hover:shadow-purple-500/10", icon: AlertCircle };
    case "Expertise Prévue": return { text: "text-indigo-700", bg: "bg-indigo-100", border: "border-indigo-200", cardBase: "bg-indigo-50/50 border-indigo-200", cardHover: "hover:bg-indigo-100/50 hover:border-indigo-300 hover:shadow-indigo-500/10", icon: Calendar };
    case "Attente Réparation": return { text: "text-orange-700", bg: "bg-orange-100", border: "border-orange-200", cardBase: "bg-orange-50/50 border-orange-200", cardHover: "hover:bg-orange-100/50 hover:border-orange-300 hover:shadow-orange-500/10", icon: Wrench };
    case "En Travaux": return { text: "text-blue-700", bg: "bg-blue-100", border: "border-blue-200", cardBase: "bg-blue-50/50 border-blue-200", cardHover: "hover:bg-blue-100/50 hover:border-blue-300 hover:shadow-blue-500/10", icon: Wrench };
    case "Clôturé": return { text: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-200", cardBase: "bg-emerald-50/50 border-emerald-200", cardHover: "hover:bg-emerald-100/50 hover:border-emerald-300 hover:shadow-emerald-500/10", icon: CheckCircle2 };
    default: return { text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", cardBase: "bg-white border-slate-200", cardHover: "hover:bg-slate-50 hover:border-slate-300", icon: FileText };
  }
};

const itemVariants: Variants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

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
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        onClick={() => { setSelectedClaim(claim); setIsSheetOpen(true); }}
        className={`relative group cursor-pointer border shadow-sm hover:shadow-xl rounded-[2rem] p-10 transition-all duration-300 flex flex-col justify-between ${st.cardBase} ${st.cardHover} ${isReminderDue ? 'ring-2 ring-red-400' : ''}`}
      >
        <div>
          <div className="flex items-start justify-between mb-10 relative z-10">
            <div className="flex-1 pr-4">
              <span className="text-sm uppercase tracking-[0.2em] text-slate-500 font-black mb-3 block">{claim.claim_number}</span>
              <h3 className="text-3xl font-black text-slate-900 leading-[1.1] tracking-tight">{claim.damage_origin}</h3>
            </div>
            <div className="flex flex-col items-end gap-5 shrink-0">
               <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black tracking-wide border shadow-sm ${st.bg} ${st.text} ${st.border}`}>
                <StatusIcon className="w-5 h-5" /> {claim.status}
              </div>
              <div className="flex gap-1.5" title={`Urgence : ${currentUrgency}/5`}>
                {[1,2,3,4,5].map(i => {
                  let colorClass = "bg-slate-200/50";
                  if (i <= currentUrgency) {
                    if (currentUrgency <= 2) colorClass = "bg-emerald-500";
                    else if (currentUrgency === 3) colorClass = "bg-amber-400";
                    else colorClass = "bg-red-500";
                  }
                  return <div key={i} className={`w-2.5 h-6 rounded-full shadow-sm ${colorClass}`} />;
                })}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-10 mb-8 relative z-10 bg-white/70 p-8 rounded-3xl border border-white/50 shadow-inner">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 block flex items-center gap-2.5"><Building2 className="w-5 h-5 text-slate-300" /> Propriété</span>
              <p className="text-xl font-bold text-slate-800 truncate" title={claim.owner}>{claim.owner}</p>
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 block flex items-center gap-2.5"><Calendar className="w-5 h-5 text-slate-300" /> Déclaration</span>
              <p className="text-xl font-bold text-slate-800">{new Date(claim.incident_date).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>

        <div>
          {isReminderDue && (
            <div className="mb-8 bg-red-50 border-2 border-red-100 rounded-3xl p-6 flex items-start gap-5 shadow-sm">
              <div className="bg-red-500 p-3 rounded-2xl shrink-0">
                <BellRing className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-black text-red-800 uppercase tracking-widest mb-1">Relance Prioritaire</p>
                <p className="text-lg font-bold text-red-600 leading-snug">{claim.next_reminder_note || "Une action immédiate est requise sur ce dossier."}</p>
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-slate-900/5 flex items-center justify-between relative z-10">
            <span className="text-sm font-bold text-slate-400">Dernière mise à jour : {new Date(claim.last_followup_date).toLocaleDateString('fr-FR')}</span>
            {!isReminderDue && claim.next_reminder_date && (
              <span className="text-sm font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                Relance le {new Date(claim.next_reminder_date).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20 selection:bg-blue-100">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden"><div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-300/20 blur-[120px] rounded-full" /><div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-300/20 blur-[120px] rounded-full" /></div>
      
      <div className="relative z-10 max-w-[1600px] mx-auto px-15 py-21">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
          <div className="flex items-center gap-10">
            {/* LOGO GROSSI ICI (w-40 h-40) */}
            <div className="relative w-40 h-40 drop-shadow-2xl">
              <Image 
                src="/logo.png" 
                alt="Stormy Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-8xl font-black tracking-tighter text-slate-900 mb-2">Stormy</h1>
              <p className="text-2xl text-slate-500 font-bold">Plateforme de gestion de sinistre</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group hidden sm:block">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-96 bg-white border-2 border-slate-200 rounded-[2rem] py-5 pl-14 pr-6 text-lg font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
            </div>
            <button onClick={() => setIsFormOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800 px-12 py-6 rounded-[2rem] text-xl font-black tracking-wide transition-all flex items-center gap-4 shadow-xl hover:shadow-2xl active:scale-95">
              <Plus className="w-7 h-7 stroke-[3]" /> <span>Nouveau</span>
            </button>
          </div>
        </header>

        <div className="flex items-center gap-4 mb-16 bg-slate-200/50 w-fit p-2.5 rounded-[2rem] border border-slate-200 shadow-inner">
          <button onClick={() => setActiveTab("Actifs")} className={`px-12 py-5 rounded-[1.5rem] text-xl font-black transition-all ${activeTab === "Actifs" ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-800"}`}>Dossiers en cours</button>
          <button onClick={() => setActiveTab("Archives")} className={`px-12 py-5 rounded-[1.5rem] text-xl font-black transition-all flex items-center gap-4 ${activeTab === "Archives" ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-800"}`}><ArchiveRestore className="w-7 h-7" /> Archives</button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40"><Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-8" /><p className="text-3xl text-slate-500 font-black">Chargement des dossiers...</p></div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-32 bg-white border-4 border-dashed border-slate-200 rounded-[3rem] text-3xl text-slate-400 font-bold">Aucun sinistre trouvé.</div>
        ) : activeTab === "Archives" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12"><AnimatePresence>{filteredClaims.map(claim => <ClaimCard key={claim.id} claim={claim} />)}</AnimatePresence></div>
        ) : (
          <div className="space-y-28">
            {STATUS_ORDER.map(status => {
              const claimsInStatus = filteredClaims.filter(c => c.status === status).sort((a, b) => (b.urgency || 1) - (a.urgency || 1)); 
              if (claimsInStatus.length === 0) return null;
              const st = getStatusConfig(status);
              return (
                <div key={status}>
                  <div className="flex items-center gap-6 mb-12 pl-4">
                    <h2 className="text-5xl font-black text-slate-900 tracking-tight">{status}</h2>
                    <span className={`px-6 py-2.5 rounded-full ${st.bg} ${st.text} border-2 ${st.border} text-xl font-black shadow-sm`}>{claimsInStatus.length}</span>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 items-stretch">
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
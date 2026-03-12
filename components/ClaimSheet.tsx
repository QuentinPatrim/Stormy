"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { 
  MapPin, User, Building2, Wrench, UploadCloud, FileText, 
  Euro, Loader2, FileImage, Trash2, X, Shield, Phone, Flame, CheckCircle2, BellRing, CalendarClock, Check, Zap,
  CheckSquare, Square, Mail, Briefcase, CalendarPlus
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ClaimSheetProps {
  claim: any | null; isOpen: boolean; onClose: () => void;
  onClaimUpdated: (updatedClaim: any) => void; onClaimDeleted: () => void;
}

export function ClaimSheet({ claim, isOpen, onClose, onClaimUpdated, onClaimDeleted }: ClaimSheetProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localData, setLocalData] = useState<any>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => { if (claim) setLocalData(claim); }, [claim]);

  if (!claim) return null;

  const handleSave = async (field: string, value: any) => {
    if (claim[field] === value) return;
    setSaveStatus("saving");
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = { [field]: value, last_followup_date: today };
      const { error } = await supabase.from('claims').update(payload).eq('id', claim.id);
      if (error) throw error;
      onClaimUpdated({ ...claim, ...payload });
      setLocalData((prev: any) => ({ ...prev, ...payload }));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) { setSaveStatus("idle"); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { setLocalData({ ...localData, [e.target.name]: e.target.value }); };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { handleSave(e.target.name, e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value); };
  const handleUrgencyChange = (newUrgency: number) => { setLocalData({ ...localData, urgency: newUrgency }); handleSave('urgency', newUrgency); };
  const toggleChecklist = (field: string) => { const newValue = !localData[field]; setLocalData({ ...localData, [field]: newValue }); handleSave(field, newValue); };

  const setQuickReminder = (days: number) => {
    const date = new Date(); date.setDate(date.getDate() + days);
    const dateString = date.toISOString().split('T')[0];
    setLocalData({ ...localData, next_reminder_date: dateString }); handleSave('next_reminder_date', dateString);
  };

  const markReminderAsDone = async () => {
    setSaveStatus("saving");
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = { next_reminder_date: null, next_reminder_note: null, last_followup_date: today };
      await supabase.from('claims').update(payload).eq('id', claim.id);
      setLocalData({ ...localData, ...payload }); onClaimUpdated({ ...claim, ...payload });
      setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) { setSaveStatus("idle"); }
  };

  const handleDeleteClaim = async () => {
    if (!confirm("Supprimer définitivement ce sinistre ?")) return;
    setIsDeleting(true);
    try { await supabase.from('claims').delete().eq('id', claim.id); onClaimDeleted(); } finally { setIsDeleting(false); }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setIsUploading(true);
    try {
      const filePath = `${claim.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      await supabase.storage.from('documents').upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
      const updatedDocs = [...(claim.documents || []), publicUrl];
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('claims').update({ documents: updatedDocs, last_followup_date: today }).eq('id', claim.id);
      onClaimUpdated({ ...claim, documents: updatedDocs, last_followup_date: today });
    } finally { setIsUploading(false); }
  };

  const handleDeleteDocument = async (urlToDelete: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    try {
      const filePath = urlToDelete.split('/documents/')[1];
      if (filePath) await supabase.storage.from('documents').remove([filePath]);
      const updatedDocs = claim.documents.filter((url: string) => url !== urlToDelete);
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('claims').update({ documents: updatedDocs, last_followup_date: today }).eq('id', claim.id);
      onClaimUpdated({ ...claim, documents: updatedDocs, last_followup_date: today });
    } catch (e) {}
  };

  const getGoogleCalendarUrl = () => {
    if (!localData.expertise_date) return "#";
    const dateStr = localData.expertise_date.replace(/-/g, '');
    const d = new Date(localData.expertise_date); d.setDate(d.getDate() + 1);
    const nextDayStr = d.toISOString().split('T')[0].replace(/-/g, '');
    const text = encodeURIComponent(`Expertise Sinistre - ${claim.claim_number}`);
    const details = encodeURIComponent(`Rendez-vous d'expertise :\n${localData.address || 'Adresse non renseignée'}`);
    const location = encodeURIComponent(localData.address || "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dateStr}/${nextDayStr}&details=${details}&location=${location}`;
  };

  // NOUVEAUX STYLES 100% PEPS ET GLASSMORPHISM
  const inputClass = "w-full bg-white/30 hover:bg-white/50 focus:bg-white/70 border-2 border-white/40 focus:border-white focus:ring-4 focus:ring-white/20 rounded-2xl px-5 py-3 -ml-5 text-xl font-black text-indigo-950 transition-all outline-none placeholder:text-indigo-950/40";
  const smallInputClass = "w-full bg-white/40 hover:bg-white/60 focus:bg-white/80 border-2 border-white/50 focus:border-white focus:ring-4 focus:ring-white/30 rounded-xl px-4 py-2 -ml-4 text-base font-bold text-indigo-900 transition-all outline-none placeholder:text-indigo-900/40";
  const labelClass = "text-xs font-black uppercase tracking-[0.2em] text-indigo-600/80 mb-3 flex items-center gap-3 pl-1";

  const currentUrgency = localData.urgency || 1;
  const flameColor = currentUrgency <= 2 ? 'text-emerald-500' : currentUrgency === 3 ? 'text-amber-500' : 'text-rose-500';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="!max-w-[90vw] w-full sm:w-[1300px] bg-gradient-to-br from-indigo-50/95 via-fuchsia-50/95 to-cyan-50/95 backdrop-blur-3xl border-l-8 border-white/50 text-indigo-950 p-0 flex flex-col shadow-[-20px_0_100px_rgba(217,70,239,0.15)]">
        
        {/* HEADER GLASS */}
        <div className="p-12 border-b-4 border-white/40 bg-white/30 shrink-0">
          <SheetHeader>
            <SheetTitle className="sr-only">Gestion Sinistre</SheetTitle>
            <SheetDescription className="sr-only">Panneau de contrôle.</SheetDescription>

            <div className="flex items-center justify-between mb-8">
              <span className="text-base uppercase tracking-[0.4em] text-indigo-500 font-black bg-white/50 px-6 py-2 rounded-full border-2 border-white/60">{claim.claim_number}</span>
              <div className="flex items-center gap-6">
                <div className="text-sm font-black text-indigo-500 flex items-center gap-3 mr-4">
                  {saveStatus === "saving" && <><Loader2 className="w-6 h-6 animate-spin text-fuchsia-500"/> Sync...</>}
                  {saveStatus === "saved" && <><CheckCircle2 className="w-6 h-6 text-emerald-500"/> Enregistré</>}
                </div>
                <select name="status" value={localData.status || ""} onChange={(e) => { handleChange(e as any); handleSave('status', e.target.value); }} className="px-8 py-4 rounded-[2rem] text-sm font-black uppercase tracking-widest bg-white/60 backdrop-blur-md text-indigo-900 border-4 border-white/80 outline-none cursor-pointer hover:bg-white hover:shadow-[0_10px_30px_rgba(217,70,239,0.2)] transition-all">
                  <option value="Attente Devis">Attente Devis</option><option value="Attente Assurance">Attente Assurance</option><option value="Expertise Prévue">Expertise Prévue</option><option value="Attente Réparation">Attente Réparation</option><option value="En Travaux">En Travaux</option><option value="Clôturé">Clôturé</option>
                </select>
                <button onClick={handleDeleteClaim} disabled={isDeleting} className="p-4 rounded-2xl bg-rose-500/10 border-4 border-rose-200/50 hover:bg-rose-500 hover:text-white text-rose-500 transition-all hover:shadow-lg">
                  {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trash2 className="w-6 h-6" />}
                </button>
              </div>
            </div>
            
            <input 
              name="damage_origin" value={localData.damage_origin || ""} onChange={handleChange} onBlur={handleBlur}
              className="text-6xl font-black text-indigo-950 bg-transparent hover:bg-white/40 focus:bg-white/60 border border-transparent focus:border-white focus:ring-8 focus:ring-white/30 rounded-[2rem] px-5 py-4 -ml-5 w-full transition-all outline-none tracking-tight"
            />
            
            <div className="flex items-center gap-10 mt-8">
              <div className="flex items-center gap-5">
                <span className="text-xl text-indigo-600/70 font-bold uppercase tracking-widest">Sinistre du</span>
                <input type="date" name="incident_date" value={localData.incident_date || ""} onChange={(e) => { handleChange(e); handleSave('incident_date', e.target.value); }} className="bg-white/50 border-4 border-white/60 hover:bg-white rounded-2xl px-6 py-3 text-xl font-black text-indigo-900 outline-none cursor-pointer transition-all shadow-sm" />
              </div>
              <div className="flex items-center gap-6 px-8 py-3.5 rounded-3xl bg-white/50 border-4 border-white/60 shadow-sm">
                <Flame className={`w-8 h-8 ${flameColor}`} />
                <span className="text-lg font-black text-indigo-900 uppercase tracking-widest mr-2">Urgence</span>
                <div className="flex gap-2.5 cursor-pointer">
                  {[1,2,3,4,5].map(i => {
                    let dotColor = "bg-indigo-950/10";
                    if (i <= currentUrgency) {
                      if (currentUrgency <= 2) dotColor = "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]";
                      else if (currentUrgency === 3) dotColor = "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]";
                      else dotColor = "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]";
                    }
                    return <div key={i} onClick={() => handleUrgencyChange(i)} className={`w-5 h-8 rounded-full hover:scale-125 transition-all ${dotColor}`} />
                  })}
                </div>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* BODY TRANSPARENT */}
        <div className="flex-1 overflow-y-auto p-16">
          <div className="flex flex-col gap-16 max-w-7xl mx-auto">
            
            {/* CHECKLIST */}
            <div>
              <h3 className="text-lg font-black uppercase tracking-[0.2em] text-emerald-600 mb-6 flex items-center gap-4"><CheckSquare className="w-8 h-8" /> Workflow du dossier</h3>
              <div className="flex flex-wrap gap-6">
                <button onClick={() => toggleChecklist('is_constat_done')} className={`flex items-center gap-5 px-10 py-6 rounded-3xl border-4 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 ${localData.is_constat_done ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300 text-white shadow-emerald-500/30' : 'bg-white/40 border-white/60 text-indigo-500 hover:bg-white/60'}`}>
                  {localData.is_constat_done ? <CheckSquare className="w-8 h-8"/> : <Square className="w-8 h-8"/>}
                  <span className="text-xl font-black">Constat amiable effectué</span>
                </button>
                <button onClick={() => toggleChecklist('is_declaration_done')} className={`flex items-center gap-5 px-10 py-6 rounded-3xl border-4 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 ${localData.is_declaration_done ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300 text-white shadow-emerald-500/30' : 'bg-white/40 border-white/60 text-indigo-500 hover:bg-white/60'}`}>
                  {localData.is_declaration_done ? <CheckSquare className="w-8 h-8"/> : <Square className="w-8 h-8"/>}
                  <span className="text-xl font-black">Déclaration assurance envoyée</span>
                </button>
              </div>
            </div>

            {/* RELANCE */}
            <div>
              <h3 className="text-lg font-black uppercase tracking-[0.2em] text-rose-500 mb-6 flex items-center gap-4"><BellRing className="w-8 h-8" /> Action Programmée</h3>
              <div className="bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-lg border-4 border-white/60 rounded-[3rem] p-12 shadow-xl shadow-indigo-900/5">
                <div className="flex flex-col lg:flex-row gap-12 items-end">
                  <div className="flex-1 w-full">
                    <span className={labelClass}>Consigne de relance</span>
                    <input name="next_reminder_note" value={localData.next_reminder_note || ""} onChange={handleChange} onBlur={handleBlur} className={inputClass} placeholder="Quelle est la priorité actuelle ?" />
                  </div>
                  <div className="w-full lg:w-auto">
                    <span className={labelClass}>Date prévue</span>
                    <div className="flex items-center gap-6">
                      <input type="date" name="next_reminder_date" value={localData.next_reminder_date || ""} onChange={(e) => { handleChange(e); handleSave('next_reminder_date', e.target.value); }} className="bg-white/60 hover:bg-white border-4 border-white/80 rounded-3xl px-8 py-5 text-2xl font-black text-rose-600 outline-none focus:border-rose-400 transition-all cursor-pointer shadow-sm" />
                      <div className="flex items-center gap-3 bg-white/40 p-3 rounded-3xl border-2 border-white/60">
                        <button onClick={() => setQuickReminder(3)} className="px-6 py-4 text-lg font-black text-indigo-600 hover:bg-white hover:shadow-md hover:text-rose-500 rounded-2xl transition-all">+3j</button>
                        <button onClick={() => setQuickReminder(7)} className="px-6 py-4 text-lg font-black text-indigo-600 hover:bg-white hover:shadow-md hover:text-rose-500 rounded-2xl transition-all">+7j</button>
                      </div>
                    </div>
                  </div>
                </div>
                {localData.next_reminder_date && (
                  <div className="mt-12 pt-10 border-t-4 border-white/40 flex items-center justify-between">
                    <div className="flex items-center gap-6 text-2xl font-black text-amber-700 bg-amber-200/50 px-8 py-5 rounded-3xl border-4 border-amber-300">
                      <CalendarClock className="w-8 h-8" /> Prévue le {new Date(localData.next_reminder_date).toLocaleDateString('fr-FR')}
                    </div>
                    <button onClick={markReminderAsDone} className="flex items-center gap-4 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white px-12 py-5 rounded-3xl text-2xl font-black transition-all shadow-xl shadow-emerald-500/30 active:scale-95">
                      <Check className="w-8 h-8 stroke-[4]" /> Marquer comme traitée
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* DÉTAILS DOSSIER */}
            <div>
              <h3 className="text-lg font-black uppercase tracking-[0.2em] text-indigo-600 mb-6 flex items-center gap-4"><FileText className="w-8 h-8" /> Annuaire & Informations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                
                {/* ADRESSE */}
                <div className="lg:col-span-4 bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md border-4 border-white/60 rounded-[3rem] p-12 shadow-xl shadow-indigo-900/5 flex items-start gap-10">
                  <MapPin className="w-12 h-12 text-fuchsia-500 shrink-0 mt-3" />
                  <div className="flex-1">
                    <span className={labelClass}>Adresse complète du bien</span>
                    <input name="address" value={localData.address || ""} onChange={handleChange} onBlur={handleBlur} className={inputClass} placeholder="Saisir l'adresse..." />
                  </div>
                </div>

                {/* ACTEURS */}
                <div className="bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md border-4 border-white/60 rounded-[2.5rem] p-10 shadow-xl shadow-indigo-900/5">
                  <span className={labelClass}><Building2 className="w-6 h-6 text-fuchsia-400"/> Propriétaire</span>
                  <input name="owner" value={localData.owner || ""} onChange={handleChange} onBlur={handleBlur} className={inputClass} placeholder="Nom..." />
                </div>
                
                <div className="bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md border-4 border-white/60 rounded-[2.5rem] p-10 shadow-xl shadow-indigo-900/5">
                  <span className={labelClass}><User className="w-6 h-6 text-fuchsia-400"/> Locataire</span>
                  <input name="tenant" value={localData.tenant || ""} onChange={handleChange} onBlur={handleBlur} className={inputClass} placeholder="Nom locataire..." />
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-4 bg-white/40 p-3 rounded-2xl border-2 border-white/50"><Phone className="w-5 h-5 text-indigo-400"/><input name="tenant_contact" value={localData.tenant_contact || ""} onChange={handleChange} onBlur={handleBlur} className={smallInputClass} placeholder="Téléphone..." /></div>
                    <div className="flex items-center gap-4 bg-white/40 p-3 rounded-2xl border-2 border-white/50"><Mail className="w-5 h-5 text-indigo-400"/><input name="tenant_email" value={localData.tenant_email || ""} onChange={handleChange} onBlur={handleBlur} className={smallInputClass} placeholder="Email..." /></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md border-4 border-white/60 rounded-[2.5rem] p-10 shadow-xl shadow-indigo-900/5">
                  <span className={labelClass}><Building2 className="w-6 h-6 text-fuchsia-400"/> Syndic</span>
                  <input name="syndic_name" value={localData.syndic_name || ""} onChange={handleChange} onBlur={handleBlur} className={inputClass} placeholder="Nom syndic..." />
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-4 bg-white/40 p-3 rounded-2xl border-2 border-white/50"><Phone className="w-5 h-5 text-indigo-400"/><input name="syndic_contact" value={localData.syndic_contact || ""} onChange={handleChange} onBlur={handleBlur} className={smallInputClass} placeholder="Téléphone..." /></div>
                    <div className="flex items-center gap-4 bg-white/40 p-3 rounded-2xl border-2 border-white/50"><Mail className="w-5 h-5 text-indigo-400"/><input name="syndic_email" value={localData.syndic_email || ""} onChange={handleChange} onBlur={handleBlur} className={smallInputClass} placeholder="Email..." /></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md border-4 border-white/60 rounded-[2.5rem] p-10 shadow-xl shadow-indigo-900/5">
                  <span className={labelClass}><Shield className="w-6 h-6 text-fuchsia-400"/> Assureur</span>
                  <input name="insurer_name" value={localData.insurer_name || ""} onChange={handleChange} onBlur={handleBlur} className={inputClass} placeholder="Compagnie..." />
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-4 bg-white/40 p-3 rounded-2xl border-2 border-white/50"><Phone className="w-5 h-5 text-indigo-400"/><input name="insurer_phone" value={localData.insurer_phone || ""} onChange={handleChange} onBlur={handleBlur} className={smallInputClass} placeholder="Téléphone..." /></div>
                    <div className="flex items-center gap-4 bg-white/40 p-3 rounded-2xl border-2 border-white/50"><Mail className="w-5 h-5 text-indigo-400"/><input name="insurer_email" value={localData.insurer_email || ""} onChange={handleChange} onBlur={handleBlur} className={smallInputClass} placeholder="Email..." /></div>
                  </div>
                </div>

                {/* EXPERTISE & CALENDRIER */}
                <div className="lg:col-span-2 bg-gradient-to-br from-purple-200/50 to-fuchsia-200/50 backdrop-blur-md border-4 border-purple-300/50 rounded-[3rem] p-12 shadow-xl shadow-purple-900/5">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-purple-700 mb-6 flex items-center gap-4 pl-1"><Briefcase className="w-8 h-8"/> Cabinet d'Expertise</span>
                  <input name="expert_name" value={localData.expert_name || ""} onChange={handleChange} onBlur={handleBlur} className={`${inputClass} focus:border-purple-400 focus:ring-purple-400/20 text-purple-950`} placeholder="Nom de l'expert..." />
                  <div className="mt-6 grid grid-cols-2 gap-5">
                    <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border-2 border-purple-200"><Phone className="w-6 h-6 text-purple-500"/><input name="expert_phone" value={localData.expert_phone || ""} onChange={handleChange} onBlur={handleBlur} className={smallInputClass} placeholder="Téléphone..." /></div>
                    <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border-2 border-purple-200"><Mail className="w-6 h-6 text-purple-500"/><input name="expert_email" value={localData.expert_email || ""} onChange={handleChange} onBlur={handleBlur} className={smallInputClass} placeholder="Email..." /></div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-[3rem] p-12 shadow-2xl shadow-cyan-500/30 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100 mb-6 flex items-center gap-4 pl-1 relative z-10"><CalendarClock className="w-8 h-8"/> Date d'expertise</span>
                  <div className="flex flex-col sm:flex-row items-center gap-6 mt-8 relative z-10">
                    <input 
                      type="date" name="expertise_date" value={localData.expertise_date || ""} onChange={(e) => { handleChange(e); handleSave('expertise_date', e.target.value); }} 
                      className="w-full bg-black/20 hover:bg-black/30 border-4 border-white/30 rounded-[2rem] px-8 py-6 text-3xl font-black text-white outline-none cursor-pointer transition-all focus:ring-4 focus:ring-white/20 [color-scheme:dark]" 
                    />
                    {localData.expertise_date && (
                      <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex items-center justify-center gap-4 bg-white text-cyan-600 hover:bg-cyan-50 px-10 py-6 rounded-[2rem] text-xl font-black transition-all shadow-xl active:scale-95 shrink-0">
                        <CalendarPlus className="w-8 h-8" /> Agenda
                      </a>
                    )}
                  </div>
                </div>

                {/* ORIGINE & NATURE */}
                <div className="lg:col-span-4 bg-gradient-to-br from-amber-200/50 to-orange-200/50 backdrop-blur-md border-4 border-amber-300/50 rounded-[3rem] p-12 shadow-xl shadow-amber-900/5 mt-4">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-amber-700 mb-6 flex items-center gap-4 pl-1"><Zap className="w-8 h-8"/> Origine du sinistre</span>
                  <input name="damage_origin" value={localData.damage_origin || ""} onChange={handleChange} onBlur={handleBlur} className={`${inputClass} text-3xl text-amber-950 focus:border-amber-400 focus:ring-amber-500/20`} placeholder="Ex: Rupture canalisation..." />
                </div>

                <div className="lg:col-span-4 bg-gradient-to-br from-rose-200/50 to-pink-200/50 backdrop-blur-md border-4 border-rose-300/50 rounded-[3rem] p-12 shadow-xl shadow-rose-900/5">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-rose-700 mb-6 flex items-center gap-4 pl-1"><Wrench className="w-8 h-8"/> Conséquences & Dégâts</span>
                  <textarea name="damage_nature" value={localData.damage_nature || ""} onChange={handleChange} onBlur={handleBlur} rows={3} className={`${inputClass} resize-none text-3xl leading-relaxed text-rose-950 focus:border-rose-400 focus:ring-rose-500/20`} placeholder="Description précise..." />
                </div>

                {/* ARTISAN */}
                <div className="lg:col-span-4 bg-gradient-to-br from-blue-200/50 to-indigo-200/50 backdrop-blur-md border-4 border-blue-300/50 rounded-[3.5rem] p-16 shadow-xl shadow-blue-900/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-16">
                  <div className="flex-1 w-full">
                    <span className="text-base font-black uppercase tracking-[0.2em] text-blue-700 mb-6 block pl-1">Artisan mandaté</span>
                    <input name="craftsman" value={localData.craftsman || ""} onChange={handleChange} onBlur={handleBlur} className={`${inputClass} text-4xl focus:border-blue-400 focus:ring-blue-500/20 text-blue-950`} placeholder="Nom de l'entreprise..." />
                  </div>
                  <div className="sm:text-right w-full sm:w-[450px] shrink-0">
                    <span className="text-base font-black uppercase tracking-[0.2em] text-blue-700 mb-6 block sm:pr-8">Montant du Devis (TTC)</span>
                    <div className="flex items-center sm:justify-end gap-6">
                      <input type="number" name="quote_amount" value={localData.quote_amount || ""} onChange={handleChange} onBlur={handleBlur} className={`${inputClass} text-8xl font-black text-blue-800 sm:text-right w-full tracking-tighter focus:border-blue-400`} placeholder="0" />
                      <Euro className="w-20 h-20 text-blue-600 shrink-0 stroke-[3]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* DOCUMENTS */}
            <div className="pb-10">
              <h3 className="text-lg font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-8 flex items-center gap-4"><UploadCloud className="w-8 h-8" /> Gestion documentaire</h3>
              <label className="group relative bg-white/40 backdrop-blur-md border-[6px] border-dashed border-white/80 hover:border-fuchsia-400 hover:bg-white/60 rounded-[4rem] p-24 text-center transition-all cursor-pointer block overflow-hidden shadow-xl shadow-indigo-900/5">
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={isUploading} />
                {isUploading ? (
                  <div className="flex flex-col items-center"><Loader2 className="w-24 h-24 text-fuchsia-500 animate-spin mb-8" /><p className="text-4xl font-black text-fuchsia-600 tracking-tight">Téléchargement...</p></div>
                ) : (
                  <>
                    <div className="w-32 h-32 rounded-[3rem] bg-white/80 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-fuchsia-500 transition-all duration-500 shadow-lg"><UploadCloud className="w-16 h-16 text-indigo-400 group-hover:text-white transition-colors" /></div>
                    <p className="text-5xl font-black text-indigo-950 tracking-tight">Déposer un fichier</p>
                    <p className="text-2xl text-indigo-500 mt-6 font-bold">Photos HD, Devis PDF ou Rapports</p>
                  </>
                )}
              </label>

              {claim.documents && claim.documents.length > 0 && (
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {claim.documents.map((url: string, idx: number) => {
                    const fileName = url.split('/').pop()?.split('-').slice(1).join('-') || `Fichier ${idx + 1}`;
                    return (
                      <div key={idx} className="flex items-center gap-6 p-8 rounded-[3rem] bg-white/60 backdrop-blur-md border-4 border-white/80 shadow-lg hover:shadow-2xl hover:border-fuchsia-300 transition-all group">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 flex-1 min-w-0">
                          <div className="w-20 h-20 rounded-[2rem] bg-white/80 flex items-center justify-center shrink-0 border-2 border-white group-hover:bg-fuchsia-100 transition-colors shadow-inner">{url.match(/\.(jpeg|jpg|gif|png)$/i) ? <FileImage className="w-10 h-10 text-fuchsia-500" /> : <FileText className="w-10 h-10 text-cyan-600" />}</div>
                          <p className="text-2xl font-black text-indigo-950 truncate group-hover:text-fuchsia-600 transition-colors">{fileName}</p>
                        </a>
                        <button onClick={() => handleDeleteDocument(url)} className="p-5 text-indigo-300 hover:text-rose-500 hover:bg-rose-100 rounded-2xl transition-all"><X className="w-8 h-8 stroke-[4]" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
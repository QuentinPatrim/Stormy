"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { 
  MapPin, User, Building2, Wrench, UploadCloud, FileText, 
  Euro, Loader2, FileImage, Trash2, X, Shield, Phone, Flame, CheckCircle2, BellRing, Check, Zap,
  CheckSquare, Square, Mail, Briefcase, CalendarPlus, History, Clock, Calendar, PlusCircle,
  CalendarClock
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ClaimSheetProps {
  claim: any | null; isOpen: boolean; onClose: () => void;
  onClaimUpdated: (updatedClaim: any) => void; onClaimDeleted: () => void;
}

const getLocalTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function ClaimSheet({ claim, isOpen, onClose, onClaimUpdated, onClaimDeleted }: ClaimSheetProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localData, setLocalData] = useState<any>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // State pour la NOUVELLE relance à ajouter
  const [newReminderNote, setNewReminderNote] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");

  useEffect(() => { 
    if (claim) {
      setLocalData(claim);
      setNewReminderNote("");
      setNewReminderDate("");
    }
  }, [claim]);

  if (!claim) return null;

  const handleSave = async (field: string, value: any) => {
    if (claim[field] === value) return;
    setSaveStatus("saving");
    try {
      const today = getLocalTodayString();
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

  // --- LOGIQUE MULTI-RELANCES ---
  const handleAddReminder = async () => {
    if (!newReminderNote || !newReminderDate) {
      alert("Veuillez saisir une consigne et une date.");
      return;
    }
    setSaveStatus("saving");
    try {
      const today = getLocalTodayString();
      const newReminder = { id: Date.now(), note: newReminderNote, date: newReminderDate, created_at: today };
      const updatedActive = [...(localData.active_reminders || []), newReminder];

      const payload = { active_reminders: updatedActive, last_followup_date: today };
      await supabase.from('claims').update(payload).eq('id', claim.id);

      setLocalData({ ...localData, ...payload });
      onClaimUpdated({ ...claim, ...payload });
      
      setNewReminderNote(""); setNewReminderDate("");
      setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) { setSaveStatus("idle"); }
  };

  const handleCompleteReminder = async (reminderId: number) => {
    setSaveStatus("saving");
    try {
      const today = getLocalTodayString();
      const activeReminders = localData.active_reminders || [];
      const reminderToComplete = activeReminders.find((r:any) => r.id === reminderId);
      const remainingActive = activeReminders.filter((r:any) => r.id !== reminderId);

      const newHistoryItem = { note: reminderToComplete.note, date: reminderToComplete.date, completed_at: today };
      const updatedHistory = [...(localData.reminder_history || []), newHistoryItem];

      const payload = { active_reminders: remainingActive, reminder_history: updatedHistory, last_followup_date: today };

      await supabase.from('claims').update(payload).eq('id', claim.id);
      setLocalData({ ...localData, ...payload });
      onClaimUpdated({ ...claim, ...payload });
      setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000);
    } catch(e) { setSaveStatus("idle"); }
  };

  const setQuickNewReminder = (days: number) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    setNewReminderDate(d.toISOString().split('T')[0]);
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
      const today = getLocalTodayString();
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
      const today = getLocalTodayString();
      await supabase.from('claims').update({ documents: updatedDocs, last_followup_date: today }).eq('id', claim.id);
      onClaimUpdated({ ...claim, documents: updatedDocs, last_followup_date: today });
    } catch (e) {}
  };

  const getExpertiseCalendarUrl = () => {
    if (!localData.expertise_date) return "#";
    const dateStrRaw = localData.expertise_date.replace(/-/g, '');
    const text = encodeURIComponent(`Expertise Sinistre - ${claim.claim_number}`);
    const details = encodeURIComponent(`Rendez-vous d'expertise :\n${localData.address || 'Adresse non renseignée'}`);
    const location = encodeURIComponent(localData.address || "");

    if (localData.expertise_time) {
      const timeStr = localData.expertise_time.replace(':', '') + '00';
      const [hours, minutes] = localData.expertise_time.split(':');
      const endHours = String(parseInt(hours) + 1).padStart(2, '0');
      const endTimeStr = endHours + minutes + '00';
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dateStrRaw}T${timeStr}/${dateStrRaw}T${endTimeStr}&details=${details}&location=${location}`;
    } else {
      const d = new Date(localData.expertise_date); d.setDate(d.getDate() + 1);
      const nextDayStr = d.toISOString().split('T')[0].replace(/-/g, '');
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dateStrRaw}/${nextDayStr}&details=${details}&location=${location}`;
    }
  };

  const getReminderCalendarUrl = (reminder: any) => {
    const dateStrRaw = reminder.date.replace(/-/g, '');
    const d = new Date(reminder.date); d.setDate(d.getDate() + 1);
    const nextDayStr = d.toISOString().split('T')[0].replace(/-/g, '');
    const text = encodeURIComponent(`Relance Sinistre - ${claim.claim_number}`);
    const details = encodeURIComponent(`Action requise : ${reminder.note}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dateStrRaw}/${nextDayStr}&details=${details}`;
  };

  const inputClass = "w-full bg-white/30 hover:bg-white/50 focus:bg-white/70 border-2 border-white/40 focus:border-white focus:ring-4 focus:ring-white/20 rounded-2xl px-5 py-3 -ml-5 text-xl font-black text-indigo-950 transition-all outline-none placeholder:text-indigo-950/40";
  const smallInputClass = "w-full bg-white/40 hover:bg-white/60 focus:bg-white/80 border-2 border-white/50 focus:border-white focus:ring-4 focus:ring-white/30 rounded-xl px-4 py-2 -ml-4 text-base font-bold text-indigo-900 transition-all outline-none placeholder:text-indigo-900/40";
  const labelClass = "text-xs font-black uppercase tracking-[0.2em] text-indigo-600/80 mb-3 flex items-center gap-3 pl-1";

  const currentUrgency = localData.urgency || 1;
  const flameColor = currentUrgency <= 2 ? 'text-emerald-500' : currentUrgency === 3 ? 'text-amber-500' : 'text-rose-500';

  const activeReminders = localData.active_reminders || [];
  const historyReminders = localData.reminder_history || [];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="!max-w-[90vw] w-full sm:w-[1300px] bg-gradient-to-br from-indigo-50/95 via-fuchsia-50/95 to-cyan-50/95 backdrop-blur-3xl border-l-8 border-white/50 text-indigo-950 p-0 flex flex-col shadow-[-20px_0_100px_rgba(217,70,239,0.15)]">
        
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
            
            <div className="flex flex-wrap items-center gap-10 mt-8">
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

        <div className="flex-1 overflow-y-auto p-16">
          <div className="flex flex-col gap-16 max-w-7xl mx-auto">
            
            {/* WORKFLOW */}
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

            {/* GESTIONNAIRE DE RELANCES (TODO LIST) */}
            <div>
              <h3 className="text-lg font-black uppercase tracking-[0.2em] text-rose-500 mb-6 flex items-center gap-4"><BellRing className="w-8 h-8" /> Centre d'actions & Historique</h3>
              <div className="bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-lg border-4 border-white/60 rounded-[3rem] p-12 shadow-xl shadow-indigo-900/5 grid grid-cols-1 lg:grid-cols-2 gap-16">
                
                {/* Colonne Gauche : Ajout & Actives */}
                <div className="flex flex-col gap-10">
                  
                  {/* Ajouter une nouvelle relance */}
                  <div className="bg-white/50 p-8 rounded-[2rem] border-2 border-white/80 shadow-sm">
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 mb-5 block"><PlusCircle className="w-5 h-5 inline-block mr-2 -mt-1"/> Nouvelle relance</span>
                    <input value={newReminderNote} onChange={(e) => setNewReminderNote(e.target.value)} className="w-full bg-white/60 focus:bg-white border-2 border-white/60 rounded-2xl px-5 py-4 text-lg font-bold text-indigo-950 outline-none focus:border-rose-400 transition-all mb-4 placeholder:text-indigo-400" placeholder="Ex: Appeler l'expert pour le rapport..." />
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <input type="date" value={newReminderDate} onChange={(e) => setNewReminderDate(e.target.value)} className="flex-1 min-w-[200px] bg-white/60 focus:bg-white border-2 border-white/60 rounded-2xl px-5 py-4 text-lg font-bold text-indigo-950 outline-none focus:border-rose-400 transition-all cursor-pointer" />
                      <div className="flex items-center gap-2 bg-white/40 p-2 rounded-2xl border border-white/60 shrink-0">
                        <button onClick={() => setQuickNewReminder(3)} className="px-4 py-2 text-base font-black text-indigo-600 hover:bg-white rounded-xl transition-all">+3j</button>
                        <button onClick={() => setQuickNewReminder(7)} className="px-4 py-2 text-base font-black text-indigo-600 hover:bg-white rounded-xl transition-all">+7j</button>
                      </div>
                    </div>
                    <button onClick={handleAddReminder} className="w-full mt-6 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white px-8 py-4 rounded-2xl text-lg font-black transition-all shadow-lg shadow-rose-500/20 active:scale-95">Ajouter à la liste</button>
                  </div>

                  {/* Liste des relances ACTIVES */}
                  <div>
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-rose-500 mb-6 flex items-center gap-2">Actions en cours ({activeReminders.length})</span>
                    {activeReminders.length === 0 ? (
                      <p className="text-lg font-bold text-indigo-400/60 bg-white/30 p-6 rounded-2xl border-2 border-white/50 text-center">Aucune action en attente.</p>
                    ) : (
                      <div className="space-y-4">
                        {activeReminders.sort((a:any, b:any) => a.date.localeCompare(b.date)).map((rem:any) => {
                          const isDue = rem.date <= getLocalTodayString();
                          return (
                            <div key={rem.id} className={`p-6 rounded-3xl border-4 transition-all shadow-sm ${isDue ? 'bg-rose-50/80 border-rose-300' : 'bg-white/60 border-white/80'}`}>
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <p className="text-xl font-bold text-indigo-950 leading-snug">{rem.note}</p>
                                <span className={`shrink-0 text-sm font-black px-3 py-1.5 rounded-xl border-2 ${isDue ? 'bg-rose-500 text-white border-rose-400' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                  {new Date(rem.date).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-6">
                                <a href={getReminderCalendarUrl(rem)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:text-rose-500 font-black text-sm transition-colors">
                                  <CalendarPlus className="w-5 h-5"/> Agenda
                                </a>
                                <button onClick={() => handleCompleteReminder(rem.id)} className="flex items-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-md active:scale-95">
                                  <Check className="w-4 h-4 stroke-[4]"/> Fait
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Colonne Droite : Historique */}
                <div className="lg:border-l-4 border-rose-200/50 lg:pl-12 flex flex-col">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400 mb-8 flex items-center gap-3"><History className="w-6 h-6"/> Frise d'historique</span>
                  
                  {historyReminders.length === 0 ? (
                    <div className="bg-white/40 p-8 rounded-3xl border-2 border-white/60 text-center flex-1 flex items-center justify-center">
                      <p className="text-lg font-bold text-indigo-300">L'historique est vide.</p>
                    </div>
                  ) : (
                    <div className="space-y-8 border-l-4 border-indigo-200/50 pl-8 ml-2 flex-1 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                      {[...historyReminders].reverse().map((item: any, i: number) => (
                        <div key={i} className="relative">
                          <span className="absolute -left-[44px] top-2 w-5 h-5 rounded-full bg-emerald-400 ring-4 ring-white shadow-sm" />
                          <div className="bg-white/50 p-6 rounded-2xl border-2 border-white/80 shadow-sm">
                            <p className="text-xs font-black text-emerald-600 mb-2 uppercase tracking-wider flex justify-between">
                              Fait le {new Date(item.completed_at).toLocaleDateString('fr-FR')}
                              <span className="text-indigo-400">Prévu le {new Date(item.date).toLocaleDateString('fr-FR')}</span>
                            </p>
                            <p className="text-lg font-bold text-indigo-900/80 line-through decoration-2 decoration-emerald-400/40">{item.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* DÉTAILS DOSSIER */}
            <div>
              <h3 className="text-lg font-black uppercase tracking-[0.2em] text-indigo-600 mb-6 flex items-center gap-4"><FileText className="w-8 h-8" /> Annuaire & Informations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                
                <div className="lg:col-span-4 bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md border-4 border-white/60 rounded-[3rem] p-12 shadow-xl shadow-indigo-900/5 flex items-start gap-10">
                  <MapPin className="w-12 h-12 text-fuchsia-500 shrink-0 mt-3" />
                  <div className="flex-1">
                    <span className={labelClass}>Adresse complète du bien</span>
                    <input name="address" value={localData.address || ""} onChange={handleChange} onBlur={handleBlur} className={inputClass} placeholder="Saisir l'adresse..." />
                  </div>
                </div>

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

                {/* DATES ET HEURE D'EXPERTISE */}
                <div className="lg:col-span-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-[3rem] p-12 shadow-2xl shadow-cyan-500/30 text-white relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100 mb-6 flex items-center gap-4 pl-1 relative z-10"><CalendarClock className="w-8 h-8"/> Programmation de l'expertise</span>
                  
                  <div className="flex flex-col gap-6 relative z-10 w-full">
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                      <div className="flex-1 bg-black/20 hover:bg-black/30 border-4 border-white/30 rounded-[2rem] px-6 py-4 flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-white/20">
                        <Calendar className="w-6 h-6 text-cyan-100 shrink-0"/>
                        <input type="date" name="expertise_date" value={localData.expertise_date || ""} onChange={(e) => { handleChange(e); handleSave('expertise_date', e.target.value); }} className="w-full bg-transparent text-xl font-black text-white outline-none cursor-pointer [color-scheme:dark]" />
                      </div>
                      
                      <div className="sm:w-1/3 bg-black/20 hover:bg-black/30 border-4 border-white/30 rounded-[2rem] px-6 py-4 flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-white/20">
                        <Clock className="w-6 h-6 text-cyan-100 shrink-0"/>
                        <input type="time" name="expertise_time" value={localData.expertise_time || ""} onChange={(e) => { handleChange(e); handleSave('expertise_time', e.target.value); }} className="w-full bg-transparent text-xl font-black text-white outline-none cursor-pointer [color-scheme:dark]" />
                      </div>
                    </div>

                    {localData.expertise_date && (
                      <a href={getExpertiseCalendarUrl()} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-4 bg-white text-cyan-600 hover:bg-cyan-50 px-8 py-5 rounded-[2rem] text-xl font-black transition-all shadow-xl active:scale-95 shrink-0 mt-2">
                        <CalendarPlus className="w-8 h-8" /> Ajouter à l'agenda
                      </a>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-4 bg-gradient-to-br from-amber-200/50 to-orange-200/50 backdrop-blur-md border-4 border-amber-300/50 rounded-[3rem] p-12 shadow-xl shadow-amber-900/5 mt-4">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-amber-700 mb-6 flex items-center gap-4 pl-1"><Zap className="w-8 h-8"/> Origine du sinistre</span>
                  <input name="damage_origin" value={localData.damage_origin || ""} onChange={handleChange} onBlur={handleBlur} className={`${inputClass} text-3xl text-amber-950 focus:border-amber-400 focus:ring-amber-500/20`} placeholder="Ex: Rupture canalisation..." />
                </div>

                <div className="lg:col-span-4 bg-gradient-to-br from-rose-200/50 to-pink-200/50 backdrop-blur-md border-4 border-rose-300/50 rounded-[3rem] p-12 shadow-xl shadow-rose-900/5">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-rose-700 mb-6 flex items-center gap-4 pl-1"><Wrench className="w-8 h-8"/> Conséquences & Dégâts</span>
                  <textarea name="damage_nature" value={localData.damage_nature || ""} onChange={handleChange} onBlur={handleBlur} rows={3} className={`${inputClass} resize-none text-3xl leading-relaxed text-rose-950 focus:border-rose-400 focus:ring-rose-500/20`} placeholder="Description précise..." />
                </div>

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
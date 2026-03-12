"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, User, Building2, Wrench, UploadCloud, FileText, 
  Euro, Loader2, FileImage, Trash2, X, Shield, Phone, Flame, CheckCircle2, BellRing, CalendarClock, Check, Zap
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
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      alert("Erreur de sauvegarde auto.");
      setLocalData({ ...localData, [field]: claim[field] });
      setSaveStatus("idle");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setLocalData({ ...localData, [e.target.name]: e.target.value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    handleSave(e.target.name, value);
  };

  const handleUrgencyChange = (newUrgency: number) => {
    setLocalData({ ...localData, urgency: newUrgency });
    handleSave('urgency', newUrgency);
  };

  const setQuickReminder = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const dateString = date.toISOString().split('T')[0];
    setLocalData({ ...localData, next_reminder_date: dateString });
    handleSave('next_reminder_date', dateString);
  };

  const markReminderAsDone = async () => {
    setSaveStatus("saving");
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = { next_reminder_date: null, next_reminder_note: null, last_followup_date: today };
      await supabase.from('claims').update(payload).eq('id', claim.id);
      setLocalData({ ...localData, ...payload });
      onClaimUpdated({ ...claim, ...payload });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) { alert("Erreur."); setSaveStatus("idle"); }
  };

  const handleDeleteClaim = async () => {
    if (!confirm("Supprimer définitivement ce sinistre ?")) return;
    setIsDeleting(true);
    try { await supabase.from('claims').delete().eq('id', claim.id); onClaimDeleted(); } 
    catch (error) { alert("Erreur."); } finally { setIsDeleting(false); }
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
    } catch (error) { alert("Erreur."); } finally { setIsUploading(false); }
  };

  const handleDeleteDocument = async (urlToDelete: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const filePath = urlToDelete.split('/documents/')[1];
      if (filePath) await supabase.storage.from('documents').remove([filePath]);
      const updatedDocs = claim.documents.filter((url: string) => url !== urlToDelete);
      await supabase.from('claims').update({ documents: updatedDocs, last_followup_date: today }).eq('id', claim.id);
      onClaimUpdated({ ...claim, documents: updatedDocs, last_followup_date: today });
    } catch (error) { alert("Erreur."); }
  };

  const inputClass = "w-full bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 focus:ring-8 focus:ring-blue-500/5 rounded-2xl px-4 py-2.5 -ml-4 text-xl font-bold text-slate-800 transition-all outline-none";
  const labelClass = "text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-3 pl-1";

  const currentUrgency = localData.urgency || 1;
  const flameColor = currentUrgency <= 2 ? 'text-emerald-500' : currentUrgency === 3 ? 'text-amber-500' : 'text-red-500';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="!max-w-[90vw] w-full sm:w-[1250px] bg-white border-l-8 border-slate-100 text-slate-900 p-0 flex flex-col shadow-[0_0_120px_rgba(0,0,0,0.15)]">
        
        {/* HEADER PLUS COMPACT */}
        <div className="p-10 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <SheetHeader>
            <SheetTitle className="sr-only">Gestion Sinistre</SheetTitle>
            <SheetDescription className="sr-only">Panneau de contrôle.</SheetDescription>

            <div className="flex items-center justify-between mb-6">
              <span className="text-sm uppercase tracking-[0.3em] text-slate-400 font-black">{claim.claim_number}</span>
              <div className="flex items-center gap-6">
                <div className="text-sm font-black text-slate-400 flex items-center gap-3 mr-4">
                  {saveStatus === "saving" && <><Loader2 className="w-5 h-5 animate-spin text-blue-600"/> Sync...</>}
                  {saveStatus === "saved" && <><CheckCircle2 className="w-5 h-5 text-emerald-500"/> Enregistré</>}
                </div>
                <select name="status" value={localData.status || ""} onChange={(e) => { handleChange(e as any); handleSave('status', e.target.value); }} className="px-6 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest bg-white text-slate-700 border-2 border-slate-200 outline-none cursor-pointer hover:border-slate-400 transition-all shadow-sm">
                  <option value="Attente Devis">Attente Devis</option>
                  <option value="Attente Assurance">Attente Assurance</option>
                  <option value="Expertise Prévue">Expertise Prévue</option>
                  <option value="Attente Réparation">Attente Réparation</option>
                  <option value="En Travaux">En Travaux</option>
                  <option value="Clôturé">Clôturé (Archiver)</option>
                </select>
                <button onClick={handleDeleteClaim} disabled={isDeleting} className="p-3.5 rounded-2xl bg-white border-2 border-red-100 hover:bg-red-50 text-red-500 transition-all shadow-sm">
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* Titre réduit à text-4xl */}
            <input 
              name="damage_origin" value={localData.damage_origin || ""} onChange={handleChange} onBlur={handleBlur}
              className="text-4xl font-black text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 focus:ring-8 focus:ring-blue-500/5 rounded-[1.5rem] px-5 py-3 -ml-5 w-full transition-all outline-none tracking-tight"
            />
            
            <div className="flex items-center gap-10 mt-6">
              <div className="flex items-center gap-4">
                <span className="text-lg text-slate-500 font-bold">Sinistre du</span>
                <input type="date" name="incident_date" value={localData.incident_date || ""} onChange={(e) => { handleChange(e); handleSave('incident_date', e.target.value); }} className="bg-white border-2 border-slate-100 hover:border-blue-400 rounded-xl px-4 py-2 text-lg font-black text-slate-800 outline-none cursor-pointer transition-all shadow-sm" />
              </div>
              <div className="flex items-center gap-5 px-6 py-2.5 rounded-2xl bg-white border-2 border-slate-100 shadow-sm">
                <Flame className={`w-6 h-6 ${flameColor}`} />
                <span className="text-base font-black text-slate-700 mr-2">Urgence</span>
                <div className="flex gap-2.5 cursor-pointer">
                  {[1,2,3,4,5].map(i => {
                    let dotColor = "bg-slate-200";
                    if (i <= currentUrgency) {
                      if (currentUrgency <= 2) dotColor = "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]";
                      else if (currentUrgency === 3) dotColor = "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]";
                      else dotColor = "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
                    }
                    return <div key={i} onClick={() => handleUrgencyChange(i)} className={`w-4 h-6 rounded-full hover:scale-125 transition-all ${dotColor}`} />
                  })}
                </div>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-12 bg-[#FAFAFA]">
          <div className="flex flex-col gap-14 max-w-6xl mx-auto">
            
            {/* RELANCE */}
            <div>
              <h3 className="text-base font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-4"><BellRing className="w-7 h-7" /> Prochaine action de relance</h3>
              <div className="bg-white border-4 border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-10 items-end">
                  <div className="flex-1 w-full">
                    <span className={labelClass}>Consigne de relance</span>
                    <input name="next_reminder_note" value={localData.next_reminder_note || ""} onChange={handleChange} onBlur={handleBlur} className={inputClass} placeholder="Quelle est la priorité actuelle ?" />
                  </div>
                  <div className="w-full lg:w-auto">
                    <span className={labelClass}>Date prévue</span>
                    <div className="flex items-center gap-4">
                      <input type="date" name="next_reminder_date" value={localData.next_reminder_date || ""} onChange={(e) => { handleChange(e); handleSave('next_reminder_date', e.target.value); }} className="bg-slate-50 border-4 border-slate-200 rounded-3xl px-8 py-4 text-lg font-black text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer" />
                      <div className="flex items-center gap-3 bg-slate-100 p-2.5 rounded-3xl border-2 border-slate-200 shadow-inner">
                        <button onClick={() => setQuickReminder(3)} className="px-5 py-3 text-sm font-black text-slate-600 hover:bg-white hover:shadow-md rounded-2xl transition-all">+3j</button>
                        <button onClick={() => setQuickReminder(7)} className="px-5 py-3 text-sm font-black text-slate-600 hover:bg-white hover:shadow-md rounded-2xl transition-all">+7j</button>
                      </div>
                    </div>
                  </div>
                </div>
                {localData.next_reminder_date && (
                  <div className="mt-8 pt-8 border-t-2 border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-5 text-xl font-black text-amber-600 bg-amber-50 px-6 py-3 rounded-2xl border-4 border-amber-200">
                      <CalendarClock className="w-7 h-7" /> Prévue le {new Date(localData.next_reminder_date).toLocaleDateString('fr-FR')}
                    </div>
                    <button onClick={markReminderAsDone} className="flex items-center gap-4 bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-2xl text-lg font-black transition-all shadow-xl active:scale-95">
                      <Check className="w-7 h-7 stroke-[4]" /> Traitée
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* DÉTAILS DOSSIER */}
            <div>
              <h3 className="text-base font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-4"><FileText className="w-7 h-7" /> Informations structurées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-4 bg-white border-4 border-slate-200 rounded-[2.5rem] p-10 shadow-sm flex items-start gap-10">
                  <MapPin className="w-8 h-8 text-slate-300 shrink-0 mt-3" />
                  <div className="flex-1">
                    <span className={labelClass}>Adresse complète du bien</span>
                    <input name="address" value={localData.address || ""} onChange={handleChange} onBlur={handleBlur} className={inputClass} placeholder="Saisir l'adresse..." />
                  </div>
                </div>

                <div className="bg-white border-4 border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                  <span className={labelClass}><Building2 className="w-5 h-5 text-slate-300"/> Propriétaire</span>
                  <input name="owner" value={localData.owner || ""} onChange={handleChange} onBlur={handleBlur} className={inputClass} placeholder="Nom..." />
                </div>
                
                <div className="bg-white border-4 border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                  <span className={labelClass}><User className="w-5 h-5 text-slate-300"/> Locataire</span>
                  <input name="tenant" value={localData.tenant || ""} onChange={handleChange} onBlur={handleBlur} className={inputClass} placeholder="Nom..." />
                  <input name="tenant_contact" value={localData.tenant_contact || ""} onChange={handleChange} onBlur={handleBlur} className={`${inputClass} text-base font-bold text-slate-500 mt-4`} placeholder="Tél / Email..." />
                </div>

                <div className="bg-white border-4 border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                  <span className={labelClass}><Building2 className="w-5 h-5 text-slate-300"/> Syndic</span>
                  <input name="syndic_name" value={localData.syndic_name || ""} onChange={handleChange} onBlur={handleBlur} className={inputClass} placeholder="Nom..." />
                  <input name="syndic_contact" value={localData.syndic_contact || ""} onChange={handleChange} onBlur={handleBlur} className={`${inputClass} text-base font-bold text-slate-500 mt-4`} placeholder="Tél / Email..." />
                </div>

                <div className="bg-white border-4 border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                  <span className={labelClass}><Shield className="w-5 h-5 text-slate-300"/> Assureur</span>
                  <input name="insurer_name" value={localData.insurer_name || ""} onChange={handleChange} onBlur={handleBlur} className={inputClass} placeholder="Compagnie..." />
                </div>

                <div className="lg:col-span-4 bg-amber-50/30 border-4 border-amber-100 rounded-[2.5rem] p-10 shadow-sm">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 mb-4 flex items-center gap-3 pl-1"><Zap className="w-7 h-7"/> Origine du sinistre (Cause)</span>
                  <input name="damage_origin" value={localData.damage_origin || ""} onChange={handleChange} onBlur={handleBlur} className={`${inputClass} text-xl text-amber-900 focus:ring-amber-500/10`} placeholder="Ex: Rupture canalisation encastrée..." />
                </div>

                <div className="lg:col-span-4 bg-red-50/30 border-4 border-red-100 rounded-[2.5rem] p-10 shadow-sm">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-red-500 mb-4 flex items-center gap-3 pl-1"><Wrench className="w-7 h-7"/> Nature des dommages (Conséquences)</span>
                  <textarea name="damage_nature" value={localData.damage_nature || ""} onChange={handleChange} onBlur={handleBlur} rows={3} className={`${inputClass} resize-none text-xl leading-relaxed text-red-900 focus:ring-red-500/10`} placeholder="Description précise..." />
                </div>

                <div className="lg:col-span-4 bg-blue-50/50 border-4 border-blue-100 rounded-[3rem] p-12 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10">
                  <div className="flex-1 w-full">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-4 block pl-1">Artisan mandaté</span>
                    <input name="craftsman" value={localData.craftsman || ""} onChange={handleChange} onBlur={handleBlur} className={`${inputClass} text-2xl focus:ring-blue-500/10 text-blue-950`} placeholder="Entreprise..." />
                  </div>
                  <div className="sm:text-right w-full sm:w-96 shrink-0">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-4 block sm:pr-6">Montant total (TTC)</span>
                    <div className="flex items-center sm:justify-end gap-4">
                      <input type="number" name="quote_amount" value={localData.quote_amount || ""} onChange={handleChange} onBlur={handleBlur} className={`${inputClass} text-6xl font-black text-blue-700 sm:text-right w-full tracking-tighter`} placeholder="0" />
                      <Euro className="w-14 h-14 text-blue-500 shrink-0 stroke-[3]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* DOCUMENTS */}
            <div>
              <h3 className="text-base font-black uppercase tracking-widest text-slate-400 mb-10 flex items-center gap-4"><UploadCloud className="w-7 h-7" /> Gestion documentaire</h3>
              <label className="group relative bg-white border-[6px] border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-[4rem] p-16 text-center transition-all cursor-pointer block overflow-hidden shadow-inner">
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={isUploading} />
                {isUploading ? (
                  <div className="flex flex-col items-center"><Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" /><p className="text-2xl font-black text-blue-600 tracking-tight">Sync...</p></div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500 shadow-sm"><UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-white transition-colors" /></div>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">Déposer des fichiers</p>
                    <p className="text-lg text-slate-400 mt-4 font-bold">Photos, Devis ou Rapports</p>
                  </>
                )}
              </label>

              {claim.documents && claim.documents.length > 0 && (
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {claim.documents.map((url: string, idx: number) => {
                    const fileName = url.split('/').pop()?.split('-').slice(1).join('-') || `Fichier ${idx + 1}`;
                    return (
                      <div key={idx} className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-white border-4 border-slate-100 shadow-md hover:shadow-2xl hover:border-blue-200 transition-all group">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 flex-1 min-w-0">
                          <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center shrink-0 border-2 border-slate-100 shadow-inner group-hover:bg-blue-50 transition-colors">{url.match(/\.(jpeg|jpg|gif|png)$/i) ? <FileImage className="w-9 h-9 text-purple-600" /> : <FileText className="w-9 h-9 text-blue-600" />}</div>
                          <p className="text-lg font-black text-slate-800 truncate">{fileName}</p>
                        </a>
                        <button onClick={() => handleDeleteDocument(url)} className="p-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><X className="w-7 h-7 stroke-[4]" /></button>
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
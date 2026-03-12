"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Loader2, Flame, User, Building2, Shield, Briefcase } from "lucide-react";

interface ClaimFormDialogProps {
  isOpen: boolean; onClose: () => void; onSuccess: () => void;
}

export function ClaimFormDialog({ isOpen, onClose, onSuccess }: ClaimFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    claim_number: `SIN-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    incident_date: new Date().toISOString().split('T')[0], status: "Attente Devis",
    owner: "", tenant: "", tenant_contact: "", tenant_email: "", address: "", damage_origin: "", damage_nature: "", craftsman: "", quote_amount: "",
    urgency: 1, syndic_name: "", syndic_contact: "", syndic_email: "", insurer_name: "", insurer_phone: "", insurer_email: "",
    expert_name: "", expert_phone: "", expert_email: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    const payload = { ...formData, quote_amount: formData.quote_amount ? parseFloat(formData.quote_amount) : null, last_followup_date: new Date().toISOString().split('T')[0] };
    try { await supabase.from('claims').insert([payload]); onSuccess(); onClose(); } 
    catch (error) { alert("Erreur lors de l'enregistrement."); } finally { setIsLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  // Style Glassmorphism pour les inputs
  const inputClass = "w-full bg-white/40 hover:bg-white/60 focus:bg-white/80 border-2 border-white/50 rounded-2xl px-5 py-3 text-indigo-950 font-bold focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 outline-none transition-all shadow-sm placeholder:text-indigo-400";
  const smallInputClass = "w-full bg-white/40 hover:bg-white/60 focus:bg-white/80 border-2 border-white/50 rounded-xl px-4 py-2 text-sm text-indigo-950 font-bold focus:border-fuchsia-400 outline-none transition-all placeholder:text-indigo-400 mt-2";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-gradient-to-br from-indigo-100 via-fuchsia-100 to-rose-100 border-4 border-white/60 shadow-[0_20px_60px_rgba(217,70,239,0.2)] rounded-[3rem] max-h-[90vh] overflow-y-auto p-10">
        <DialogHeader><DialogTitle className="text-4xl font-black mb-4 text-indigo-950">Nouveau dossier</DialogTitle></DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 mt-4">
          
          <div className="bg-white/40 backdrop-blur-md border-2 border-white/60 rounded-3xl p-6 shadow-sm">
            <label className="text-sm font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 mb-4"><Flame className="w-6 h-6 text-rose-500" /> Priorité d'intervention</label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((level) => {
                let activeClass = "bg-white/40 border-white/50 text-indigo-400 hover:bg-white/60";
                if (level <= formData.urgency) {
                  if (formData.urgency <= 2) activeClass = "bg-emerald-400 border-emerald-300 text-white shadow-lg shadow-emerald-500/30";
                  else if (formData.urgency === 3) activeClass = "bg-amber-400 border-amber-300 text-white shadow-lg shadow-amber-500/30";
                  else activeClass = "bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30";
                }
                return (<button type="button" key={level} onClick={() => setFormData(prev => ({ ...prev, urgency: level }))} className={`flex-1 py-4 rounded-2xl text-xl font-black border-2 transition-all ${activeClass}`}>{level}</button>);
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest text-indigo-500">N° Sinistre</label><input required name="claim_number" value={formData.claim_number} onChange={handleChange} className={inputClass} /></div>
            <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest text-indigo-500">Statut initial</label>
              <select name="status" value={formData.status} onChange={handleChange} className={`${inputClass} appearance-none`}><option value="Attente Devis">Attente Devis</option><option value="Attente Assurance">Attente Assurance</option><option value="Expertise Prévue">Expertise Prévue</option><option value="Attente Réparation">Attente Réparation</option><option value="En Travaux">En Travaux</option><option value="Clôturé">Clôturé</option></select>
            </div>
            <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest text-indigo-500">Origine du sinistre</label><input required name="damage_origin" value={formData.damage_origin} onChange={handleChange} className={inputClass} /></div>
            <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest text-indigo-500">Nature des dégâts</label><input required name="damage_nature" value={formData.damage_nature} onChange={handleChange} className={inputClass} /></div>
            <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest text-indigo-500">Adresse complète</label><input required name="address" value={formData.address} onChange={handleChange} className={inputClass} /></div>
            <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest text-indigo-500">Date du sinistre</label><input required type="date" name="incident_date" value={formData.incident_date} onChange={handleChange} className={inputClass} /></div>
          </div>

          <div className="border-t-4 border-white/50 pt-8"><h4 className="text-xl font-black uppercase tracking-widest text-fuchsia-600 mb-6">Annuaire du dossier (Facultatif)</h4></div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/30 p-5 rounded-3xl border-2 border-white/50"><label className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 mb-3"><Building2 className="w-4 h-4"/> Propriétaire</label><input required name="owner" value={formData.owner} onChange={handleChange} className={smallInputClass} placeholder="Nom..." /></div>
            <div className="bg-white/30 p-5 rounded-3xl border-2 border-white/50"><label className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 mb-3"><User className="w-4 h-4"/> Locataire</label><input name="tenant" value={formData.tenant} onChange={handleChange} className={smallInputClass} placeholder="Nom..." /><div className="flex gap-2"><input name="tenant_contact" value={formData.tenant_contact} onChange={handleChange} className={smallInputClass} placeholder="Téléphone..." /><input name="tenant_email" value={formData.tenant_email} onChange={handleChange} className={smallInputClass} placeholder="Email..." /></div></div>
            <div className="bg-white/30 p-5 rounded-3xl border-2 border-white/50"><label className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 mb-3"><Building2 className="w-4 h-4"/> Syndic</label><input name="syndic_name" value={formData.syndic_name} onChange={handleChange} className={smallInputClass} placeholder="Nom..." /><div className="flex gap-2"><input name="syndic_contact" value={formData.syndic_contact} onChange={handleChange} className={smallInputClass} placeholder="Téléphone..." /><input name="syndic_email" value={formData.syndic_email} onChange={handleChange} className={smallInputClass} placeholder="Email..." /></div></div>
            <div className="bg-white/30 p-5 rounded-3xl border-2 border-white/50"><label className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 mb-3"><Shield className="w-4 h-4"/> Assureur</label><input name="insurer_name" value={formData.insurer_name} onChange={handleChange} className={smallInputClass} placeholder="Compagnie..." /><div className="flex gap-2"><input name="insurer_phone" value={formData.insurer_phone} onChange={handleChange} className={smallInputClass} placeholder="Téléphone..." /><input name="insurer_email" value={formData.insurer_email} onChange={handleChange} className={smallInputClass} placeholder="Email..." /></div></div>
            <div className="col-span-2 bg-white/30 p-5 rounded-3xl border-2 border-white/50"><label className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 mb-3"><Briefcase className="w-4 h-4"/> Cabinet d'Expertise</label><input name="expert_name" value={formData.expert_name} onChange={handleChange} className={smallInputClass} placeholder="Nom de l'expert..." /><div className="flex gap-2"><input name="expert_phone" value={formData.expert_phone} onChange={handleChange} className={smallInputClass} placeholder="Téléphone..." /><input name="expert_email" value={formData.expert_email} onChange={handleChange} className={smallInputClass} placeholder="Email..." /></div></div>
          </div>

          <div className="pt-10 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-8 py-4 text-xl font-black text-indigo-500 hover:text-indigo-800 transition-colors">Annuler</button>
            <button type="submit" disabled={isLoading} className="bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white px-10 py-4 rounded-2xl text-xl font-black hover:from-fuchsia-400 hover:to-pink-400 transition-all shadow-xl shadow-fuchsia-500/30 active:scale-95 flex items-center gap-3">
              {isLoading && <Loader2 className="w-6 h-6 animate-spin" />} Créer le dossier
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
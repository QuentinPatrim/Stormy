"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Loader2, Flame } from "lucide-react";

interface ClaimFormDialogProps {
  isOpen: boolean; onClose: () => void; onSuccess: () => void;
}

export function ClaimFormDialog({ isOpen, onClose, onSuccess }: ClaimFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    claim_number: `SIN-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    incident_date: new Date().toISOString().split('T')[0], status: "Attente Devis",
    owner: "", tenant: "", address: "", damage_origin: "", damage_nature: "", craftsman: "", quote_amount: "",
    urgency: 1, syndic_name: "", syndic_contact: "", tenant_contact: "", insurer_name: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    const payload = { ...formData, quote_amount: formData.quote_amount ? parseFloat(formData.quote_amount) : null, last_followup_date: new Date().toISOString().split('T')[0] };
    try {
      await supabase.from('claims').insert([payload]);
      onSuccess(); onClose();
    } catch (error) { alert("Erreur lors de l'enregistrement."); } finally { setIsLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white border-slate-200 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-2xl font-black">Nouveau sinistre</DialogTitle></DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-3"><Flame className={`w-4 h-4 ${formData.urgency <= 2 ? 'text-emerald-500' : formData.urgency === 3 ? 'text-amber-500' : 'text-red-500'}`} /> Niveau d'urgence</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => {
                let activeClass = "bg-white border-slate-200 text-slate-400 hover:bg-slate-50";
                if (level <= formData.urgency) {
                  if (formData.urgency <= 2) activeClass = "bg-emerald-50 border-emerald-200 text-emerald-600";
                  else if (formData.urgency === 3) activeClass = "bg-amber-50 border-amber-200 text-amber-600";
                  else activeClass = "bg-red-50 border-red-200 text-red-600";
                }
                return (
                  <button type="button" key={level} onClick={() => setFormData(prev => ({ ...prev, urgency: level }))} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${activeClass}`}>{level}</button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">N° Sinistre</label><input required name="claim_number" value={formData.claim_number} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Statut</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none"><option value="Attente Devis">Attente Devis</option><option value="Attente Assurance">Attente Assurance</option><option value="Expertise Prévue">Expertise Prévue</option><option value="Attente Réparation">Attente Réparation</option><option value="En Travaux">En Travaux</option><option value="Clôturé">Clôturé</option></select>
            </div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Origine (Ex: Fuite)</label><input required name="damage_origin" value={formData.damage_origin} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dégâts (Ex: Plafond)</label><input required name="damage_nature" value={formData.damage_nature} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Adresse</label><input required name="address" value={formData.address} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date du sinistre</label><input required type="date" name="incident_date" value={formData.incident_date} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
          </div>

          <div className="border-t border-slate-100 pt-6"><h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5">Informations Acteurs</h4></div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Propriétaire / SCI *</label><input required name="owner" value={formData.owner} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nom Syndic</label><input name="syndic_name" value={formData.syndic_name} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Locataire *</label><input required name="tenant" value={formData.tenant} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contact Locataire</label><input name="tenant_contact" value={formData.tenant_contact} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nom Assureur</label><input name="insurer_name" value={formData.insurer_name} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contact Syndic</label><input name="syndic_contact" value={formData.syndic_contact} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
          </div>

          <div className="border-t border-slate-100 pt-6"><h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5">Artisan & Devis</h4></div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Artisan</label><input name="craftsman" value={formData.craftsman} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Devis (TTC)</label><input type="number" step="0.01" name="quote_amount" value={formData.quote_amount} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
          </div>

          <div className="pt-8 flex justify-end gap-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Annuler</button>
            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />} Créer le sinistre
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
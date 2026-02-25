"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@lessence/supabase";
import { MapPin, Plus, Trash2, Edit2, CheckCircle2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

type Address = {
  id: string;
  user_id: string;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
};

export default function AddressBook() {
  const { user } = useAuth();
  const t = useTranslations('profile');
  const locale = useLocale();
  const rtl = locale === 'ar';
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [form, setForm] = useState<Partial<Address>>({
    full_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    phone: "",
    is_default: false
  });

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      
      if (!error && data) {
        setAddresses(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // If setting as default, we should optimally unset others, 
    // but a DB trigger usually handles this. If not, we do it client side.
    if (form.is_default) {
      const defaultAddr = addresses.find(a => a.is_default);
      if (defaultAddr && defaultAddr.id !== editId) {
        await supabase.from("addresses").update({ is_default: false }).eq("id", defaultAddr.id);
      }
    }

    if (editId) {
      await supabase.from("addresses").update(form).eq("id", editId);
    } else {
      await supabase.from("addresses").insert([{ ...form, user_id: user.id }]);
    }
    
    setIsEditing(false);
    setEditId(null);
    setForm({
      full_name: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "", phone: "", is_default: false
    });
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    await supabase.from("addresses").delete().eq("id", id);
    fetchAddresses();
  };

  const handleEdit = (addr: Address) => {
    setEditId(addr.id);
    setForm(addr);
    setIsEditing(true);
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    const defaultAddr = addresses.find(a => a.is_default);
    if (defaultAddr) {
      await supabase.from("addresses").update({ is_default: false }).eq("id", defaultAddr.id);
    }
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    fetchAddresses();
  };

  if (loading) return <div className="h-24 animate-pulse bg-white/5 rounded-2xl"></div>;

  return (
    <div className="glass-effect p-8 rounded-2xl border border-white/5">
      <div className={`flex items-center gap-3 mb-6 ${rtl ? 'flex-row-reverse' : ''}`}>
        <MapPin size={20} className="text-white/60" />
        <h3 className="text-lg font-display text-white">{t('saved_addresses')}</h3>
      </div>
      
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="full_name" className={`text-[10px] text-white/40 uppercase tracking-widest block mb-2 ${rtl ? 'text-right' : 'text-left'}`}>Full Name</label>
              <input id="full_name" required value={form.full_name || ""} onChange={e => setForm({...form, full_name: e.target.value})} className={`w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary ${rtl ? 'text-right' : 'text-left'}`} />
            </div>
            <div>
              <label htmlFor="phone" className={`text-[10px] text-white/40 uppercase tracking-widest block mb-2 ${rtl ? 'text-right' : 'text-left'}`}>Phone</label>
              <input id="phone" value={form.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} className={`w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary ${rtl ? 'text-right' : 'text-left'}`} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address_line1" className={`text-[10px] text-white/40 uppercase tracking-widest block mb-2 ${rtl ? 'text-right' : 'text-left'}`}>Address Line 1</label>
              <input id="address_line1" required value={form.address_line1 || ""} onChange={e => setForm({...form, address_line1: e.target.value})} className={`w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary ${rtl ? 'text-right' : 'text-left'}`} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address_line2" className={`text-[10px] text-white/40 uppercase tracking-widest block mb-2 ${rtl ? 'text-right' : 'text-left'}`}>Address Line 2 (Optional)</label>
              <input id="address_line2" value={form.address_line2 || ""} onChange={e => setForm({...form, address_line2: e.target.value})} className={`w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary ${rtl ? 'text-right' : 'text-left'}`} />
            </div>
            <div>
              <label htmlFor="city" className={`text-[10px] text-white/40 uppercase tracking-widest block mb-2 ${rtl ? 'text-right' : 'text-left'}`}>City</label>
              <input id="city" required value={form.city || ""} onChange={e => setForm({...form, city: e.target.value})} className={`w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary ${rtl ? 'text-right' : 'text-left'}`} />
            </div>
            <div>
              <label htmlFor="state" className={`text-[10px] text-white/40 uppercase tracking-widest block mb-2 ${rtl ? 'text-right' : 'text-left'}`}>State/Province</label>
              <input id="state" required value={form.state || ""} onChange={e => setForm({...form, state: e.target.value})} className={`w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary ${rtl ? 'text-right' : 'text-left'}`} />
            </div>
            <div>
              <label htmlFor="postal_code" className={`text-[10px] text-white/40 uppercase tracking-widest block mb-2 ${rtl ? 'text-right' : 'text-left'}`}>Postal Code</label>
              <input id="postal_code" required value={form.postal_code || ""} onChange={e => setForm({...form, postal_code: e.target.value})} className={`w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary ${rtl ? 'text-right' : 'text-left'}`} />
            </div>
            <div>
              <label htmlFor="country" className={`text-[10px] text-white/40 uppercase tracking-widest block mb-2 ${rtl ? 'text-right' : 'text-left'}`}>Country</label>
              <input id="country" required value={form.country || "Egypt"} onChange={e => setForm({...form, country: e.target.value})} className={`w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary ${rtl ? 'text-right' : 'text-left'}`} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input id="is_default" type="checkbox" checked={form.is_default || false} onChange={e => setForm({...form, is_default: e.target.checked})} className="accent-primary" />
            <label htmlFor="is_default" className="text-white text-xs">Set as default address</label>
          </div>
          
          <div className={`flex gap-3 mt-6 ${rtl ? 'flex-row-reverse' : ''}`}>
            <button type="submit" className="bg-primary text-black px-6 py-2 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors">Save</button>
            <button type="button" onClick={() => setIsEditing(false)} className="border border-white/20 text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <p className={`text-white/40 text-sm ${rtl ? 'text-right' : 'text-left'}`}>{t('addresses_empty')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <div key={addr.id} className="p-5 rounded-xl border border-white/10 bg-white/5 relative group">
                  {addr.is_default && (
                    <div className={`absolute top-4 ${rtl ? 'left-4' : 'right-4'} flex items-center gap-1 text-primary text-[10px] uppercase font-bold tracking-widest`}>
                      <CheckCircle2 size={12} />
                      Default
                    </div>
                  )}
                  <h4 className={`text-white font-bold mb-1 ${rtl ? 'text-right' : 'text-left'}`}>{addr.full_name}</h4>
                  <p className={`text-white/60 text-sm ${rtl ? 'text-right' : 'text-left'}`}>{addr.address_line1}</p>
                  {addr.address_line2 && <p className={`text-white/60 text-sm ${rtl ? 'text-right' : 'text-left'}`}>{addr.address_line2}</p>}
                  <p className={`text-white/60 text-sm ${rtl ? 'text-right' : 'text-left'}`}>{addr.city}, {addr.state} {addr.postal_code}</p>
                  <p className={`text-white/60 text-sm ${rtl ? 'text-right' : 'text-left'}`}>{addr.country}</p>
                  
                  <div className={`flex gap-3 mt-4 ${rtl ? 'flex-row-reverse' : ''}`}>
                    <button title="Edit Address" onClick={() => handleEdit(addr)} className="text-white/40 hover:text-white transition-colors"><Edit2 size={14} /></button>
                    <button title="Delete Address" onClick={() => handleDelete(addr.id)} className="text-white/40 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    {!addr.is_default && (
                      <button onClick={() => handleSetDefault(addr.id)} className="text-[10px] uppercase tracking-widest text-primary hover:text-white transition-colors ml-auto">Set Default</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button 
            onClick={() => {
              setForm({ full_name: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "Egypt", phone: "", is_default: addresses.length === 0 });
              setEditId(null);
              setIsEditing(true);
            }} 
            className={`mt-4 border border-white/20 text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:text-black transition-colors ${rtl ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
          >
            <Plus size={14} />
            {t('add_new_address')}
          </button>
        </div>
      )}
    </div>
  );
}

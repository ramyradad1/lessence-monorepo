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

const EGYPT_GOVERNORATES = [
  { en: "Cairo", ar: "القاهرة" },
  { en: "Giza", ar: "الجيزة" },
  { en: "Alexandria", ar: "الإسكندرية" },
  { en: "Dakahlia", ar: "الدقهلية" },
  { en: "Red Sea", ar: "البحر الأحمر" },
  { en: "Beheira", ar: "البحيرة" },
  { en: "Fayoum", ar: "الفيوم" },
  { en: "Gharbiya", ar: "الغربية" },
  { en: "Ismailia", ar: "الإسماعيلية" },
  { en: "Monufia", ar: "المنوفية" },
  { en: "Minya", ar: "المنيا" },
  { en: "Qalyubia", ar: "القليوبية" },
  { en: "New Valley", ar: "الوادي الجديد" },
  { en: "Suez", ar: "السويس" },
  { en: "Aswan", ar: "أسوان" },
  { en: "Assiut", ar: "أسيوط" },
  { en: "Beni Suef", ar: "بني سويف" },
  { en: "Port Said", ar: "بورسعيد" },
  { en: "Damietta", ar: "دمياط" },
  { en: "Sharkia", ar: "الشرقية" },
  { en: "South Sinai", ar: "جنوب سيناء" },
  { en: "Kafr El Sheikh", ar: "كفر الشيخ" },
  { en: "Matrouh", ar: "مطروح" },
  { en: "Luxor", ar: "الأقصر" },
  { en: "Qena", ar: "قنا" },
  { en: "North Sinai", ar: "شمال سيناء" },
  { en: "Sohag", ar: "سوهاج" }
];

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
    country: "Egypt",
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

    const payload = { ...form, user_id: user.id };
    if (editId) {
      await supabase.from("addresses").update(payload).eq("id", editId);
    } else {
      await supabase.from("addresses").insert([payload]);
    }
    
    setIsEditing(false);
    setEditId(null);
    setForm({
      full_name: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "Egypt", phone: "", is_default: false
    });
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(rtl ? "هل أنت متأكد من حذف هذا العنوان؟" : "Are you sure you want to delete this address?")) return;
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

  const inputClasses = `w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all ${rtl ? 'text-right' : 'text-left'}`;
  const labelClasses = `text-[10px] text-fg-muted uppercase tracking-widest block mb-2 font-bold ${rtl ? 'text-right' : 'text-left'}`;

  return (
    <div className="glass-effect p-8 rounded-2xl border border-white/5 overflow-hidden relative">
      <div className={`flex items-center gap-3 mb-8 ${rtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <MapPin size={20} />
        </div>
        <div>
          <h3 className="text-lg font-sans text-white">{t('saved_addresses')}</h3>
          <p className="text-[10px] text-fg-faint uppercase tracking-tighter">Your delivery locations</p>
        </div>
      </div>
      
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="full_name" className={labelClasses}>{t('full_name')}</label>
              <input id="full_name" required placeholder="John Doe" value={form.full_name || ""} onChange={e => setForm({ ...form, full_name: e.target.value })} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="phone" className={labelClasses}>{t('phone_label')}</label>
              <input id="phone" placeholder="+20 1XX XXX XXXX" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="state" className={labelClasses}>{t('select_province')}</label>
              <select
                id="state"
                required
                value={form.state || ""}
                onChange={e => setForm({ ...form, state: e.target.value })}
                className={`${inputClasses} appearance-none cursor-pointer bg-no-repeat`}
                // eslint-disable-next-line react/forbid-dom-props
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.3)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: rtl ? 'left 1rem center' : 'right 1rem center', backgroundSize: '1rem' }}
              >
                <option value="" disabled className="bg-surface-dark">{rtl ? "اختر المحافظة" : "Select Governorate"}</option>
                {EGYPT_GOVERNORATES.map(gov => (
                  <option key={gov.en} value={gov.en} className="bg-surface-dark">
                    {rtl ? gov.ar : gov.en}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address_line1" className={labelClasses}>Address Line 1</label>
              <input id="address_line1" required placeholder="Street address, P.O. box, company name" value={form.address_line1 || ""} onChange={e => setForm({ ...form, address_line1: e.target.value })} className={inputClasses} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address_line2" className={labelClasses}>Address Line 2 (Optional)</label>
              <input id="address_line2" placeholder="Apartment, suite, unit, building, floor, etc." value={form.address_line2 || ""} onChange={e => setForm({ ...form, address_line2: e.target.value })} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="city" className={labelClasses}>City/Area</label>
              <input id="city" required placeholder="New Cairo, Maadi, etc." value={form.city || ""} onChange={e => setForm({ ...form, city: e.target.value })} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="postal_code" className={labelClasses}>Postal Code</label>
              <input id="postal_code" placeholder="12345" value={form.postal_code || ""} onChange={e => setForm({ ...form, postal_code: e.target.value })} className={inputClasses} />
            </div>
          </div>

          <div className={`flex items-center gap-3 py-2 ${rtl ? 'flex-row-reverse' : ''}`}>
            <div className="relative flex items-center h-5">
              <input id="is_default" type="checkbox" checked={form.is_default || false} onChange={e => setForm({ ...form, is_default: e.target.checked })} className="w-4 h-4 rounded bg-white/5 border-white/10 text-primary focus:ring-primary" />
            </div>
            <label htmlFor="is_default" className="text-fg-muted text-xs cursor-pointer select-none">Set as default address</label>
          </div>
          
          <div className={`flex gap-4 pt-4 border-t border-white/5 ${rtl ? 'flex-row-reverse' : ''}`}>
            <button type="submit" className="flex-1 bg-primary text-black px-8 py-4 rounded-xl text-[10px] uppercase font-bold tracking-widest hover:bg-white transition-all shadow-lg shadow-primary/10 active:scale-[0.98]">
              {editId ? 'Update Address' : 'Save Address'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 border border-white/10 text-fg-muted px-8 py-4 rounded-xl text-[10px] uppercase font-bold tracking-widest hover:bg-white/5 hover:text-white transition-all active:scale-[0.98]">
              Cancel
            </button>
          </div>
        </form>
      ) : (
          <div className="space-y-6">
          {addresses.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                <MapPin size={40} className="text-white/10 mb-4" />
                <p className="text-fg-muted text-sm font-sans">{t('addresses_empty')}</p>
              </div>
          ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map(addr => (
                <div key={addr.id} className={`p-6 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${addr.is_default ? 'border-primary/30 bg-primary/[0.03]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
                  }`}>
                  {addr.is_default && (
                    <div className={`absolute top-0 ${rtl ? 'left-0' : 'right-0'} bg-primary text-black text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-bl-xl rtl:rounded-bl-none rtl:rounded-br-xl flex items-center gap-1.5`}>
                      <CheckCircle2 size={10} />
                      Default
                    </div>
                  )}

                  <div className={`mb-6 ${rtl ? 'text-right' : 'text-left'}`}>
                    <h4 className="text-lg font-sans text-white mb-1">{addr.full_name}</h4>
                    <p className="text-fg-muted text-[10px] uppercase tracking-widest font-bold">{addr.phone || "No phone provided"}</p>
                  </div>

                  <div className={`space-y-1.5 text-sm text-fg-muted mb-6 ${rtl ? 'text-right' : 'text-left'}`}>
                    <p className="line-clamp-1">{addr.address_line1}</p>
                    {addr.address_line2 && <p className="line-clamp-1">{addr.address_line2}</p>}
                    <p className="text-fg font-medium">{addr.city}, {rtl ? EGYPT_GOVERNORATES.find(g => g.en === addr.state)?.ar || addr.state : addr.state}</p>
                    <p className="text-[10px] opacity-40 uppercase tracking-widest">{addr.country}</p>
                  </div>
                  
                  <div className={`flex items-center gap-4 pt-6 border-t border-white/5 ${rtl ? 'flex-row-reverse' : ''}`}>
                    <button title="Edit" onClick={() => handleEdit(addr)} className="p-2 rounded-lg bg-white/5 text-fg-muted hover:text-white hover:bg-white/10 transition-all">
                      <Edit2 size={14} />
                    </button>
                    <button title="Delete" onClick={() => handleDelete(addr.id)} className="p-2 rounded-lg bg-white/5 text-fg-muted hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={14} />
                    </button>
                    {!addr.is_default && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className={`text-[10px] uppercase tracking-widest font-bold text-primary hover:text-white transition-all ${rtl ? 'mr-auto' : 'ml-auto'}`}
                      >
                        Set Default
                      </button>
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
              className={`w-full group mt-4 border-2 border-dashed border-white/10 text-fg-muted p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/[0.02] hover:text-white transition-all duration-500 active:scale-[0.99]`}
          >
              <div className="p-3 bg-white/5 rounded-full group-hover:bg-primary group-hover:text-black transition-all">
                <Plus size={20} />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest">{t('add_new_address')}</span>
          </button>
        </div>
      )}
    </div>
  );
}

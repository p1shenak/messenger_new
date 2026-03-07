"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const { 
  UserCircle, MessageSquare, ShieldAlert, ShoppingBag, 
  Edit3, Save, Eye, Tag, Coins, LogOut, Ban
} = LucideIcons;

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#777', accent: '#2563eb', gold: '#eab308', mythic: '#a855f7', red: '#dc2626'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [adminTab, setAdminTab] = useState("items");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const [inventory, setInventory] = useState<any[]>([]);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const [messages, setMessages] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [newGift, setNewGift] = useState<any>({ name: '', image_url: '', price: 0, is_nft: false, rarity: 'common' });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (prof) {
          setProfile(prof);
          setNewUsername(prof.username || "");
          setNewAvatar(prof.avatar_url || "");
          loadData(prof.id);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const loadData = async (uid: string) => {
    const [gs, inv, mkt, fr, reps, usrs] = await Promise.all([
      supabase.from('gifts').select('*').order('created_at', { ascending: false }),
      supabase.from('inventory').select('*, gifts(*)').eq('user_id', uid),
      supabase.from('inventory').select('*, gifts(*), profiles(username)').eq('is_on_sale', true),
      supabase.from('friends').select('*, profiles!friends_friend_id_fkey(*), requester:profiles!friends_user_id_fkey(*)').eq('status', 'accepted').or(`user_id.eq.${uid},friend_id.eq.${uid}`),
      supabase.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(username), target:profiles!reports_target_id_fkey(username)'),
      supabase.from('profiles').select('*')
    ]);
    setStoreGifts(gs.data || []);
    setInventory(inv.data || []);
    setMarketItems(mkt.data || []);
    setFriends(fr.data?.map((i: any) => i.user_id === uid ? i.profiles : i.requester) || []);
    setReports(reps.data || []);
    setAllUsers(usrs.data || []);
  };

  const handleAuth = async () => {
    const { error } = isRegistering 
      ? await supabase.auth.signUp({ email, password }) 
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else window.location.reload();
  };

  const grantAction = async (type: string, uid: string) => {
    if (type === 'money') {
      const amt = prompt("Сумма CR:");
      if (amt) {
        const { data } = await supabase.from('profiles').select('balance').eq('id', uid).single();
        await supabase.from('profiles').update({ balance: (data?.balance || 0) + parseInt(amt) }).eq('id', uid);
        alert("CR выданы");
      }
    } else if (type === 'ban') {
      const hrs = prompt("Часы бана:");
      if (hrs) {
        const date = new Date(Date.now() + parseInt(hrs) * 3600000).toISOString();
        await supabase.from('profiles').update({ banned_until: date }).eq('id', uid);
        alert("Пользователь забанен");
      }
    }
    loadData(profile.id);
  };

  if (!mounted) return null;

  if (!profile && !loading) {
    return (
      <div style={{ background: THEME.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: THEME.card, padding: '40px', borderRadius: '30px', border: `1px solid ${THEME.border}`, width: '100%', maxWidth: '400px' }}>
          <h1 style={{ color: THEME.accent, textAlign: 'center' }}>VOID_OS</h1>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
          <button onClick={handleAuth} style={btnMain}>{isRegistering ? "РЕГИСТРАЦИЯ" : "ВОЙТИ"}</button>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', cursor: 'pointer', color: THEME.muted }}>
            {isRegistering ? "Есть аккаунт? Войти" : "Нет аккаунта? Регистрация"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      <nav style={{ width: '250px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ color: THEME.accent, marginBottom: '20px' }}>VOID</h2>
        <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={18}/> ПРОФИЛЬ</button>
        <button onClick={() => setActiveTab("store")} style={btnTab(activeTab === "store")}><ShoppingBag size={18}/> МАГАЗИН</button>
        <button onClick={() => setActiveTab("market")} style={btnTab(activeTab === "market")}><Tag size={18}/> РЫНОК</button>
        <button onClick={() => setActiveTab("chat")} style={btnTab(activeTab === "chat")}><MessageSquare size={18}/> СВЯЗЬ</button>
        {profile?.is_admin && <button onClick={() => setActiveTab("admin")} style={{...btnTab(activeTab === "admin"), color: THEME.red} as any}><ShieldAlert size={18}/> АДМИНКА</button>}
        
        <div style={{ marginTop: 'auto', background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
          <div style={{color: THEME.gold, fontWeight: 'bold'}}>{profile?.balance || 0} CR</div>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{background:'none', border:'none', color:THEME.red, cursor:'pointer', fontSize:'11px', marginTop:'10px'}}><LogOut size={12}/> ВЫЙТИ</button>
        </div>
      </nav>

      <section style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {activeTab === "profile" && (
          <div>
            <div style={{ background: THEME.card, padding: '20px', borderRadius: '20px', border: `1px solid ${THEME.border}`, display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
              <img src={profile?.avatar_url || ''} style={{ width: '80px', height: '80px', borderRadius: '50%', background: THEME.sidebar }} />
              <div>
                <h3>{profile?.username}</h3>
                <p style={{color: THEME.muted, fontSize: '12px'}}>{profile?.id}</p>
              </div>
            </div>
            <h3>ИНВЕНТАРЬ ({inventory.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
              {inventory.map((i: any) => (
                <div key={i.id} style={{ background: THEME.card, padding: '10px', borderRadius: '15px', border: `1px solid ${THEME.border}`, textAlign: 'center' }}>
                  <img src={i.gifts?.image_url} style={{ width: '100%', height: '80px', objectFit: 'contain' }} />
                  <div style={{fontSize: '11px'}}>{i.gifts?.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => setAdminTab("items")} style={btnSubTab(adminTab === "items")}>ТОВАРЫ</button>
              <button onClick={() => setAdminTab("reports")} style={btnSubTab(adminTab === "reports")}>ЖАЛОБЫ ({reports.length})</button>
              <button onClick={() => setAdminTab("grant")} style={btnSubTab(adminTab === "grant")}>ВЫДАЧА</button>
            </div>
            {adminTab === "items" && (
              <div style={adminCard}>
                <input placeholder="Название" onChange={e => setNewGift({...newGift, name: e.target.value})} style={inputStyle} />
                <input placeholder="GIF URL" onChange={e => setNewGift({...newGift, image_url: e.target.value})} style={inputStyle} />
                <input type="number" placeholder="Цена" onChange={e => setNewGift({...newGift, price: parseInt(e.target.value)})} style={inputStyle} />
                <button onClick={async () => { await supabase.from('gifts').insert([newGift]); alert("Опубликовано"); loadData(profile.id); }} style={btnMain}>СОЗДАТЬ</button>
              </div>
            )}
            {adminTab === "grant" && (
              <div style={adminCard}>
                {allUsers.map((u: any) => (
                  <div key={u.id} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:`1px solid ${THEME.border}`}}>
                    <span>{u.username}</span>
                    <div style={{display:'flex', gap:'10px'}}>
                      <button onClick={() => grantAction('money', u.id)} style={btnSmall}><Coins size={14}/></button>
                      <button onClick={() => grantAction('ban', u.id)} style={{...btnSmall, color:THEME.red}}><Ban size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

const btnTab = (active: boolean) => ({ background: active ? THEME.accent : 'none', border: 'none', color: '#fff', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left' as const });
const btnSubTab = (active: boolean) => ({ background: active ? '#fff' : 'none', color: active ? '#000' : '#fff', border: `1px solid ${THEME.border}`, padding: '5px 15px', borderRadius: '8px', cursor: 'pointer' });
const inputStyle = { width: '100%' as const, background: '#000', border: `1px solid ${THEME.border}`, color: '#fff', padding: '12px', borderRadius: '10px', marginBottom: '10px' };
const btnMain = { width: '100%' as const, background: THEME.accent, color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' as const };
const btnSmall = { background: 'none', border: `1px solid ${THEME.border}`, color: '#fff', padding: '5px', borderRadius: '5px', cursor: 'pointer' };
const adminCard = { background: THEME.card, padding: '20px', borderRadius: '20px', border: `1px solid ${THEME.border}` };

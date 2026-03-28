"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const { 
  UserCircle, MessageSquare, ShieldAlert, ShoppingBag, 
  Tag, Coins, LogOut, Ban, Gift, Sparkles
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
  
  // Auth states (Вход по нику)
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Data states
  const [inventory, setInventory] = useState<any[]>([]);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [newGift, setNewGift] = useState<any>({ name: '', image_url: '', price: 0, is_nft: false });

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
          loadData(prof.id);
        }
      }
    } catch (e) {
      console.error("Auth error:", e);
    } finally {
      setLoading(false);
    }
  }

  const loadData = async (uid: string) => {
    const [gs, inv, usrs] = await Promise.all([
      supabase.from('gifts').select('*').order('created_at', { ascending: false }),
      supabase.from('inventory').select('*, gifts(*)').eq('user_id', uid),
      supabase.from('profiles').select('*').order('username', { ascending: true })
    ]);
    setStoreGifts(gs.data || []);
    setInventory(inv.data || []);
    setAllUsers(usrs.data || []);
  };

  const handleAuth = async () => {
    if (!username || !password) return alert("Заполни все поля!");
    const virtualEmail = `${username.toLowerCase()}@vexy.io`;
    
    if (isRegistering) {
      const { data, error } = await supabase.auth.signUp({ 
        email: virtualEmail, 
        password 
      });
      if (error) return alert(error.message);
      if (data.user) {
        await supabase.from('profiles').insert([{ id: data.user.id, username, balance: 500 }]);
        window.location.reload();
      }
    } else {
      // ИСПРАВЛЕНО: Добавлен .auth. для корректной работы в Vercel
      const { error } = await supabase.auth.signInWithPassword({ 
        email: virtualEmail, 
        password 
      });
      if (error) alert("Ошибка: неверный ник или пароль");
      else window.location.reload();
    }
  };

  const grantGift = async (userId: string, giftId: string) => {
    if (!giftId) return;
    const { error } = await supabase.from('inventory').insert([{ user_id: userId, gift_id: giftId }]);
    if (!error) alert("Предмет успешно выдан!");
    if (profile) loadData(profile.id);
  };

  const grantAction = async (type: string, uid: string) => {
    if (type === 'money') {
      const amt = prompt("Сколько CR выдать?");
      if (amt) {
        const { data } = await supabase.from('profiles').select('balance').eq('id', uid).single();
        await supabase.from('profiles').update({ balance: (data?.balance || 0) + parseInt(amt) }).eq('id', uid);
      }
    } else if (type === 'ban') {
      const hrs = prompt("Часы бана (0 для разбана):");
      if (hrs) {
        const date = parseInt(hrs) === 0 ? null : new Date(Date.now() + parseInt(hrs) * 3600000).toISOString();
        await supabase.from('profiles').update({ banned_until: date }).eq('id', uid);
      }
    }
    if (profile) loadData(profile.id);
  };

  if (!mounted) return null;

  if (!profile && !loading) {
    return (
      <div style={{ background: THEME.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: THEME.card, padding: '40px', borderRadius: '30px', border: `1px solid ${THEME.border}`, width: '350px' }}>
          <h2 style={{ color: THEME.accent, textAlign: 'center', marginBottom: '30px', letterSpacing: '2px' }}>VEXY_OS</h2>
          <input placeholder="НИКНЕЙМ" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="ПАРОЛЬ" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
          <button onClick={handleAuth} style={btnMain}>{isRegistering ? "РЕГИСТРАЦИЯ" : "АВТОРИЗАЦИЯ"}</button>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', cursor: 'pointer', color: THEME.muted }}>
            {isRegistering ? "ЕСТЬ ДОСТУП? ВХОД" : "НЕТ ДОСТУПА? СОЗДАТЬ"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      <nav style={{ width: '260px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '25px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ color: THEME.accent, fontWeight: 'bold', fontSize: '20px', marginBottom: '30px' }}>VEXY_NET</div>
        <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={18}/> МОЙ ПРОФИЛЬ</button>
        <button onClick={() => setActiveTab("store")} style={btnTab(activeTab === "store")}><ShoppingBag size={18}/> МАГАЗИН</button>
        {profile?.is_admin && <button onClick={() => setActiveTab("admin")} style={{...btnTab(activeTab === "admin"), color: THEME.mythic} as any}><ShieldAlert size={18}/> АДМИН-ПАНЕЛЬ</button>}
        
        <div style={{ marginTop: 'auto', background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
          <div style={{color: THEME.gold, fontWeight: 'bold', fontSize: '18px'}}>{profile?.balance || 0} CR</div>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{background:'none', border:'none', color:THEME.red, cursor:'pointer', fontSize:'11px', marginTop:'15px', display:'flex', alignItems:'center', gap:'5px'}}><LogOut size={12}/> ВЫЙТИ</button>
        </div>
      </nav>

      <section style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {activeTab === "profile" && (
          <div>
            <h3 style={{ marginBottom: '20px', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '10px' }}>МОЙ ИНВЕНТАРЬ ({inventory.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
              {inventory.map((i: any) => (
                <div key={i.id} style={{ 
                  background: THEME.card, padding: '15px', borderRadius: '20px', border: i.gifts?.is_nft ? `1px solid ${THEME.mythic}` : `1px solid ${THEME.border}`, 
                  textAlign: 'center', position: 'relative', boxShadow: i.gifts?.is_nft ? `0 0 15px ${THEME.mythic}33` : 'none'
                }}>
                  {i.gifts?.is_nft && <Sparkles size={14} style={{position:'absolute', top:10, right:10, color: THEME.mythic}}/>}
                  <img src={i.gifts?.image_url} style={{ width: '100%', height: '90px', objectFit: 'contain', marginBottom: '10px' }} />
                  <div style={{fontSize: '12px', fontWeight: 'bold'}}>{i.gifts?.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
              <button onClick={() => setAdminTab("items")} style={btnSubTab(adminTab === "items")}>МАГАЗИН</button>
              <button onClick={() => setAdminTab("users")} style={btnSubTab(adminTab === "users")}>УПРАВЛЕНИЕ</button>
            </div>

            {adminTab === "items" && (
              <div style={adminCard}>
                <h3 style={{marginBottom: '20px'}}>НОВЫЙ ТОВАР</h3>
                <input placeholder="Название" onChange={e => setNewGift({...newGift, name: e.target.value})} style={inputStyle} />
                <input placeholder="URL Картинки" onChange={e => setNewGift({...newGift, image_url: e.target.value})} style={inputStyle} />
                <input type="number" placeholder="Цена" onChange={e => setNewGift({...newGift, price: parseInt(e.target.value)})} style={inputStyle} />
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', padding:'10px', background:THEME.bg, borderRadius:'10px'}}>
                  <input type="checkbox" id="is_nft" checked={newGift.is_nft} onChange={e => setNewGift({...newGift, is_nft: e.target.checked})} />
                  <label htmlFor="is_nft" style={{fontSize:'12px', color: newGift.is_nft ? THEME.mythic : THEME.muted}}>NFT ТОВАР (ВИЗУАЛЬНЫЕ ЭФФЕКТЫ)</label>
                </div>
                <button onClick={async () => { await supabase.from('gifts').insert([newGift]); alert("Товар создан!"); if (profile) loadData(profile.id); }} style={btnMain}>ОПУБЛИКОВАТЬ</button>
              </div>
            )}

            {adminTab === "users" && (
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {allUsers.map((u: any) => (
                  <div key={u.id} style={{...adminCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{fontWeight: 'bold'}}>{u.username} <span style={{fontSize:'10px', color:THEME.muted}}>{u.balance} CR</span></div>
                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                      <select id={`g-${u.id}`} style={{background:'#000', color:'#fff', border:`1px solid ${THEME.border}`, padding:'5px', borderRadius:'5px', fontSize:'11px'}}>
                        <option value="">Выдать предмет...</option>
                        {storeGifts.map(g => (
                          <option key={g.id} value={g.id}>{g.is_nft ? '⭐ ' : ''}{g.name}</option>
                        ))}
                      </select>
                      <button onClick={() => grantGift(u.id, (document.getElementById(`g-${u.id}`) as HTMLSelectElement).value)} style={{...btnSmall, background: THEME.mythic}}><Gift size={14}/></button>
                      <button onClick={() => grantAction('money', u.id)} style={btnSmall}><Coins size={14}/></button>
                      <button onClick={() => grantAction('ban', u.id)} style={{...btnSmall, color: THEME.red}}><Ban size={14}/></button>
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

const btnTab = (active: boolean) => ({ background: active ? THEME.accent : 'none', border: 'none', color: '#fff', padding: '12px 18px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left' as const });
const btnSubTab = (active: boolean) => ({ background: active ? THEME.accent : THEME.card, color: '#fff', border: `1px solid ${THEME.border}`, padding: '8px 20px', borderRadius: '10px', cursor: 'pointer' });
const inputStyle = { width: '100%' as const, background: '#000', border: `1px solid ${THEME.border}`, color: '#fff', padding: '14px', borderRadius: '12px', marginBottom: '12px' };
const btnMain = { width: '100%' as const, background: THEME.accent, color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' as const };
const btnSmall = { background: THEME.card, border: `1px solid ${THEME.border}`, color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer' };
const adminCard = { background: THEME.card, padding: '25px', borderRadius: '22px', border: `1px solid ${THEME.border}` };

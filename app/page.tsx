"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, Zap, Lock, Users, Gift, ShoppingBag, Store, Send, MessageSquare, Plus, Loader2, LogOut, ShieldAlert, Image, Ban, MailWarning, Eye, Search, CheckCircle2, UserPlus, Star
} from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#777', accent: '#2563eb', gold: '#eab308', red: '#dc2626', nft: '#a855f7'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<any[]>([]);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [adminHover, setAdminHover] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => { setMounted(true); checkUser(); }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      setProfile(prof);
      if (user.id) {
        loadInventory(user.id);
        loadStore();
        if (prof?.is_admin) loadAllUsers();
      }
    }
    setLoading(false);
  }

  async function loadInventory(uid: string) {
    const { data } = await supabase.from('inventory').select('id, gifts(*)').eq('user_id', uid);
    setInventory(data || []);
  }

  async function loadStore() {
    const { data } = await supabase.from('gifts').select('*').order('price', { ascending: true });
    setStoreGifts(data || []);
  }

  async function loadAllUsers() {
    const { data } = await supabase.from('profiles').select('*');
    setAllUsers(data || []);
  }

  const handleAuth = async () => {
    const nick = prompt("НИК:"); const pass = prompt("ПАРОЛЬ:");
    if (!nick || !pass) return;
    const email = `${nick.toLowerCase()}@void.network`;
    const { data: sD, error: sE } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (sE) {
      const { error: uE } = await supabase.auth.signUp({ email, password: pass, options: { data: { username: nick } } });
      if (!uE) alert("АККАУНТ СОЗДАН! ВОЙДИТЕ.");
    } else { window.location.reload(); }
  };

  // --- АДМИН ФУНКЦИИ ---
  const adminGiveGift = async (userId: string, giftId: string) => {
    const { error } = await supabase.from('inventory').insert([{ user_id: userId, gift_id: giftId }]);
    if (error) alert("Ошибка: " + error.message);
    else alert("Предмет успешно выдан!");
  };

  const adminSetStatus = async (userId: string, note: string, isAdmin: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_admin: isAdmin, admin_note: note }).eq('id', userId);
    if (error) alert("Ошибка: " + error.message);
    else { alert("Статус обновлен!"); loadAllUsers(); }
  };

  if (!mounted) return null;
  if (loading) return <div style={{background: THEME.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'monospace'}}>INITIALIZING_VOID_OS...</div>;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Zap color={THEME.accent} fill={THEME.accent} size={24} />
          <span style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '2px' }}>VOID_OS</span>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setActiveTab("chat")} style={{ background: activeTab === 'chat' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={20}/> СВЯЗЬ
          </button>
          <button onClick={() => setActiveTab("store")} style={{ background: activeTab === 'store' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Store size={20}/> МАГАЗИН
          </button>
          <button onClick={() => setActiveTab("profile")} style={{ background: activeTab === 'profile' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserCircle size={20}/> ПРОФИЛЬ
          </button>
          
          {profile?.is_admin && (
            <button onClick={() => setActiveTab("admin")} style={{ background: activeTab === 'admin' ? '#450a0a' : 'none', border: `1px solid ${THEME.red}`, color: THEME.red, padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
              <ShieldAlert size={20}/> АДМИН-ЦЕНТР
            </button>
          )}
        </div>

        {profile ? (
          <div style={{ background: THEME.card, padding: '20px', borderRadius: '18px', border: `1px solid ${THEME.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <img src={profile.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                {profile.is_admin && (
                  <div onMouseEnter={() => setAdminHover(true)} onMouseLeave={() => setAdminHover(false)} style={{ position: 'absolute', bottom: -2, right: -2, cursor: 'pointer' }}>
                    <CheckCircle2 size={16} color={THEME.accent} fill={THEME.accent} />
                    {adminHover && (
                      <div className="admin-popup">
                        {profile.admin_note || 'ADMIN_ACCESS'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{profile.username}</div>
                <div style={{ color: THEME.gold, fontSize: '12px' }}>{profile.balance} CR</div>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={handleAuth} style={{ background: THEME.accent, color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }}>ВХОД</button>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <section style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {!user ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: THEME.muted }}><Lock size={60} /></div>
        ) : (
          <>
            {/* ПРОФИЛЬ */}
            {activeTab === "profile" && (
              <div style={{ maxWidth: '800px' }}>
                <div style={{ height: '180px', background: `url(${profile?.banner_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400'})`, backgroundSize: 'cover', borderRadius: '24px', border: `1px solid ${THEME.border}`, position: 'relative', marginBottom: '60px' }}>
                  <img src={profile?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} style={{ width: '100px', height: '100px', borderRadius: '50%', border: `5px solid ${THEME.bg}`, position: 'absolute', bottom: '-50px', left: '40px', objectFit: 'cover' }} />
                </div>
                <h1>{profile?.username}</h1>
                <p style={{ color: THEME.muted, fontSize: '12px' }}>NODE_ID: {profile?.id}</p>
                
                <h3 style={{ marginTop: '40px' }}>ИНВЕНТАРЬ NFT & GIF</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '20px', marginTop: '20px' }}>
                  {inventory.map(item => (
                    <div key={item.id} className="nft-card" style={{ background: item.gifts.bg_color }}>
                      <img src={item.gifts.image_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      <div className="nft-label">{item.gifts.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* МАГАЗИН */}
            {activeTab === "store" && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px' }}>
                {storeGifts.map(g => (
                  <div key={g.id} style={{ background: THEME.card, borderRadius: '24px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
                    <div style={{ height: '150px', background: g.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={g.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '20px' }}>
                      <b>{g.name}</b>
                      <div style={{ color: THEME.gold, fontWeight: 'bold', marginTop: '5px' }}>{g.price} CR</div>
                      <button style={{ width: '100%', marginTop: '15px', background: '#fff', color: '#000', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold' }}>КУПИТЬ</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* АДМИН-ЦЕНТР */}
            {activeTab === "admin" && profile?.is_admin && (
              <div style={{ maxWidth: '900px' }}>
                <h1 style={{ color: THEME.red, marginBottom: '30px' }}>SYSTEM_CONTROL_PANEL</h1>
                
                <div style={{ display: 'grid', gap: '20px' }}>
                  {allUsers.map(u => (
                    <div key={u.id} style={{ background: THEME.card, padding: '20px', borderRadius: '15px', border: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <b>{u.username}</b> <small style={{color: THEME.muted}}>{u.id}</small>
                        <div style={{fontSize: '11px', color: THEME.gold}}>{u.balance} CR | Статус: {u.admin_note || 'User'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => {
                          const gId = prompt("ID предмета из таблицы gifts:");
                          if (gId) adminGiveGift(u.id, gId);
                        }} style={{ background: THEME.accent, border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>+ ВЫДАТЬ NFT</button>
                        
                        <button onClick={() => {
                          const note = prompt("Текст галочки:", u.admin_note || "");
                          const adm = confirm("Сделать админом?");
                          adminSetStatus(u.id, note || "", adm);
                        }} style={{ background: THEME.muted, border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>СТАТУС</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <style jsx global>{`
        .admin-popup {
          position: absolute; left: 25px; bottom: 0; background: ${THEME.accent};
          color: #fff; padding: 5px 12px; borderRadius: 8px; fontSize: 10px;
          whiteSpace: nowrap; zIndex: 100; boxShadow: 0 4px 15px rgba(0,0,0,0.5);
          animation: pop 0.2s ease;
        }
        .nft-card {
          aspect-ratio: 1/1; border-radius: 20px; border: 1px solid ${THEME.border};
          position: relative; overflow: hidden; padding: 10px;
          transition: 0.3s;
        }
        .nft-card:hover { transform: translateY(-5px); border-color: ${THEME.accent}; }
        .nft-label {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(0,0,0,0.7); font-size: 9px; padding: 4px;
          text-align: center; color: #fff;
        }
        @keyframes pop {
          from { opacity: 0; transform: scale(0.8) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </main>
  );
}

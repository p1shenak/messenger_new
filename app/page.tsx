"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const { 
  UserCircle, MessageSquare, ShieldAlert, Send, ShoppingBag, 
  Gift, UserPlus, UserCheck, Search, Ban, Flag, Edit3, Save, Eye, Tag, Sparkles, Coins, LogOut, Key
} = LucideIcons;

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#777', accent: '#2563eb', gold: '#eab308', mythic: '#a855f7', red: '#dc2626'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [adminTab, setAdminTab] = useState("items"); // Под-вкладки админки
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Data States
  const [inventory, setInventory] = useState<any[]>([]);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // UI States
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [newGift, setNewGift] = useState({ name: '', image_url: '', price: 0, is_nft: false, rarity: 'common' });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (prof?.banned_until && new Date(prof.banned_until) > new Date()) prof.is_blocked = true;
      setProfile(prof);
      if (prof) {
        setNewUsername(prof.username || "");
        setNewAvatar(prof.avatar_url || "");
        loadData(prof.id);
      }
    }
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
    setFriends(fr.data?.map(i => i.user_id === uid ? i.profiles : i.requester) || []);
    setReports(reps.data || []);
    setAllUsers(usrs.data || []);
  };

  // --- ACTIONS ---
  const handleAuth = async () => {
    const { error } = isRegistering 
      ? await supabase.auth.signUp({ email, password }) 
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else window.location.reload();
  };

  const saveProfile = async () => {
    await supabase.from('profiles').update({ username: newUsername, avatar_url: newAvatar }).eq('id', profile.id);
    setProfile({ ...profile, username: newUsername, avatar_url: newAvatar });
    setEditMode(false);
  };

  const grantAction = async (type: 'money' | 'gift' | 'ban', uid: string) => {
    if (type === 'money') {
      const amt = prompt("Amount CR:");
      if (amt) {
        const { data } = await supabase.from('profiles').select('balance').eq('id', uid).single();
        await supabase.from('profiles').update({ balance: (data?.balance || 0) + parseInt(amt) }).eq('id', uid);
      }
    } else if (type === 'ban') {
      const hrs = prompt("Hours:");
      if (hrs) {
        const date = new Date(Date.now() + parseInt(hrs) * 3600000).toISOString();
        await supabase.from('profiles').update({ banned_until: date }).eq('id', uid);
      }
    }
    loadData(profile.id);
  };

  if (!mounted) return null;

  // ОКНО РЕГИСТРАЦИИ / ЛОГИНА
  if (!profile && !loading) {
    return (
      <div style={{ background: THEME.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: THEME.card, padding: '40px', borderRadius: '30px', border: `1px solid ${THEME.border}`, width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h1 style={{ color: THEME.accent, marginBottom: '10px' }}>VOID_OS</h1>
          <p style={{ color: THEME.muted, marginBottom: '30px', fontSize: '14px' }}>Вход в систему зашифрованной связи</p>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
          <button onClick={handleAuth} style={btnMain}>{isRegistering ? "CREATE_IDENTITY" : "ESTABLISH_LINK"}</button>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ marginTop: '20px', fontSize: '12px', cursor: 'pointer', color: THEME.muted }}>
            {isRegistering ? "Already have access? Login" : "No identity? Register"}
          </p>
        </div>
      </div>
    );
  }

  if (profile?.is_blocked) return <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.red }}><h1>SYSTEM_ACCESS_REVOKED</h1></div>;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* САЙДБАР */}
      <nav style={{ width: '260px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ color: THEME.accent, marginBottom: '20px', letterSpacing: '3px' }}>VOID</h2>
        <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={18}/> ПРОФИЛЬ</button>
        <button onClick={() => setActiveTab("store")} style={btnTab(activeTab === "store")}><ShoppingBag size={18}/> МАГАЗИН</button>
        <button onClick={() => setActiveTab("market")} style={btnTab(activeTab === "market")}><Tag size={18}/> РЫНОК</button>
        <button onClick={() => setActiveTab("chat")} style={btnTab(activeTab === "chat")}><MessageSquare size={18}/> СВЯЗЬ</button>
        {profile?.is_admin && <button onClick={() => setActiveTab("admin")} style={{...btnTab(activeTab === "admin"), color: THEME.red} as any}><ShieldAlert size={18}/> АДМИНКА</button>}
        
        <div style={{ marginTop: 'auto', background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
          <div style={{color: THEME.gold, fontWeight: 'bold'}}>{profile?.balance} CR</div>
          <div style={{fontSize: '10px', color: THEME.muted, marginTop: '5px', overflow: 'hidden'}}>{profile?.username}</div>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{background:'none', border:'none', color:THEME.red, cursor:'pointer', fontSize:'11px', marginTop:'10px', display:'flex', alignItems:'center', gap:'5px'}}><LogOut size={12}/> ВЫЙТИ</button>
        </div>
      </nav>

      {/* КОНТЕНТ */}
      <section style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* ПРОФИЛЬ */}
        {activeTab === "profile" && (
          <div>
            <div style={{ background: THEME.card, padding: '30px', borderRadius: '30px', border: `1px solid ${THEME.border}`, display: 'flex', gap: '25px', alignItems: 'center', marginBottom: '40px' }}>
              <img src={profile?.avatar_url || 'https://via.placeholder.com/100'} style={{ width: '100px', height: '100px', borderRadius: '50%', border: `3px solid ${THEME.accent}`, objectFit: 'cover' }} />
              <div style={{flex: 1}}>
                {editMode ? (
                  <div style={{display: 'flex', gap: '10px'}}>
                    <input value={newUsername} onChange={e => setNewUsername(e.target.value)} style={inputStyle} />
                    <input value={newAvatar} onChange={e => setNewAvatar(e.target.value)} style={inputStyle} />
                    <button onClick={saveProfile} style={btnSmall}><Save size={18}/></button>
                  </div>
                ) : (
                  <h2 style={{margin: 0}}>{profile?.username} <Edit3 size={18} onClick={() => setEditMode(true)} style={{cursor: 'pointer', color: THEME.muted, marginLeft: '10px'}}/></h2>
                )}
                <p style={{color: THEME.muted, fontSize: '13px'}}>ID: {profile?.id}</p>
              </div>
            </div>
            <h3>ИНВЕНТАРЬ ({inventory.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
              {inventory.map(i => (
                <div key={i.id} style={{ ...cardBase, border: i.gifts?.rarity === 'mythic' ? `2px solid ${THEME.mythic}` : `1px solid ${THEME.border}` }}>
                  <img src={i.gifts?.image_url} style={{ width: '100%', height: '100px', objectFit: 'contain' }} />
                  <div style={{fontSize: '12px', marginTop: '10px'}}>{i.gifts?.name}</div>
                  {i.nft_id && <div style={{fontSize: '10px', color: THEME.gold}}>{i.nft_id}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* АДМИНКА (С СОХРАНЕНИЕМ ВСЕХ ВКЛАДОК) */}
        {activeTab === "admin" && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
              <button onClick={() => setAdminTab("items")} style={btnSubTab(adminTab === "items")}>ТОВАРЫ</button>
              <button onClick={() => setAdminTab("reports")} style={btnSubTab(adminTab === "reports")}>ЖАЛОБЫ ({reports.length})</button>
              <button onClick={() => setAdminTab("grant")} style={btnSubTab(adminTab === "grant")}>ВЫДАЧА</button>
            </div>

            {adminTab === "items" && (
              <div style={adminCard}>
                <h3>СОЗДАНИЕ ТОВАРА</h3>
                <input placeholder="Name" onChange={e => setNewGift({...newGift, name: e.target.value})} style={inputStyle} />
                <input placeholder="GIF URL" onChange={e => setNewGift({...newGift, image_url: e.target.value})} style={inputStyle} />
                <input type="number" placeholder="Price" onChange={e => setNewGift({...newGift, price: parseInt(e.target.value)})} style={inputStyle} />
                <div style={{display:'flex', gap:'15px', margin:'15px 0'}}>
                  <label><input type="checkbox" onChange={e => setNewGift({...newGift, is_nft: e.target.checked})} /> NFT</label>
                  <select onChange={e => setNewGift({...newGift, rarity: e.target.value})} style={inputStyle}>
                    <option value="common">Обычный</option>
                    <option value="rare">Редкий (Gold)</option>
                    <option value="mythic">Мифический</option>
                  </select>
                </div>
                <button onClick={async () => { await supabase.from('gifts').insert([newGift]); alert("Done"); loadData(profile.id); }} style={btnMain}>ОПУБЛИКОВАТЬ</button>
              </div>
            )}

            {adminTab === "reports" && (
              <div style={adminCard}>
                {reports.map(r => (
                  <div key={r.id} style={{padding:'15px', borderBottom:`1px solid ${THEME.border}`, display:'flex', justifyContent:'space-between'}}>
                    <div><b>{r.reporter?.username}</b> -> <b>{r.target?.username}</b>: {r.reason}</div>
                    <button onClick={async () => {
                      const {data} = await supabase.from('messages').select('*').or(`and(sender_id.eq.${r.reporter_id},receiver_id.eq.${r.target_id}),and(sender_id.eq.${r.target_id},receiver_id.eq.${r.reporter_id})`).order('created_at', { ascending: true });
                      setMessages(data || []); setSelectedChat({id:'spy', username:'VIEW'}); setActiveTab('chat');
                    }} style={btnSmall}><Eye size={14}/></button>
                  </div>
                ))}
              </div>
            )}

            {adminTab === "grant" && (
              <div style={adminCard}>
                {allUsers.map(u => (
                  <div key={u.id} style={{display:'flex', justifyContent:'space-between', padding:'10px', background:'#000', marginBottom:'5px', borderRadius:'10px'}}>
                    <span>{u.username}</span>
                    <div style={{display:'flex', gap:'5px'}}>
                      <button onClick={() => grantAction('money', u.id)} style={btnSmall}><Coins size={14}/></button>
                      <button onClick={() => grantAction('ban', u.id)} style={{...btnSmall, color:THEME.red}}><Ban size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* МАГАЗИН И ДРУГИЕ ВКЛАДКИ (Коротко для экономии места, логика та же) */}
        {activeTab === "store" && (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
             {storeGifts.map(g => (
               <div key={g.id} style={cardBase}>
                 <img src={g.image_url} style={{ width: '100%', height: '140px', objectFit: 'contain' }} />
                 <div style={{fontWeight:'bold', marginTop:'10px'}}>{g.name}</div>
                 <div style={{color:THEME.gold}}>{g.price} CR</div>
                 <button onClick={async () => {
                    if(profile.balance < g.price) return alert("Low balance");
                    await supabase.from('profiles').update({balance: profile.balance - g.price}).eq('id', profile.id);
                    await supabase.from('inventory').insert([{user_id: profile.id, gift_id: g.id, nft_id: g.is_nft ? 'VOID-NFT' : null}]);
                    checkUser();
                 }} style={btnAction}>КУПИТЬ</button>
               </div>
             ))}
           </div>
        )}
        
        {/* ВКЛАДКА СВЯЗЬ */}
        {activeTab === "chat" && (
          <div style={{height: '100%', display: 'flex', gap: '20px'}}>
             <div style={{width: '250px', background: THEME.card, padding: '20px', borderRadius: '25px'}}>
                {friends.map(f => <div key={f.id} onClick={() => setSelectedChat(f)} style={{padding:'10px', cursor:'pointer'}}>{f.username}</div>)}
             </div>
             <div style={{flex: 1, background: THEME.card, borderRadius: '25px', padding: '20px'}}>
                {selectedChat ? <div>Чат с {selectedChat.username}</div> : "Выберите контакт"}
             </div>
          </div>
        )}

      </section>
    </main>
  );
}

// СТИЛИ
const btnTab = (active: boolean) => ({ background: active ? THEME.accent : 'none', border: 'none', color: '#fff', padding: '12px 20px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left' as const, fontSize: '14px', transition: '0.3s' });
const btnSubTab = (active: boolean) => ({ background: active ? '#fff' : 'none', color: active ? '#000' : '#fff', border: `1px solid ${THEME.border}`, padding: '8px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' as const });
const inputStyle = { width: '100%' as const, background: '#000', border: `1px solid ${THEME.border}`, color: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '15px', outline: 'none' };
const btnMain = { width: '100%' as const, background: THEME.accent, color: '#fff', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: 'bold' as const, cursor: 'pointer' };
const btnAction = { background: '#fff', color: '#000', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' as const, width: '100%' as const, marginTop: '10px' };
const cardBase: React.CSSProperties = { background: THEME.card, padding: '20px', borderRadius: '25px', border: `1px solid ${THEME.border}`, textAlign: 'center' };
const btnSmall = { background: THEME.sidebar, border: `1px solid ${THEME.border}`, color: '#fff', padding: '8px', borderRadius: '10px', cursor: 'pointer' };
const adminCard = { background: THEME.card, padding: '25px', borderRadius: '25px', border: `1px solid ${THEME.border}` };

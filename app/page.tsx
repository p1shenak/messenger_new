"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const { 
  UserCircle, MessageSquare, ShieldAlert, Trash2, Send, 
  ShoppingBag, Lock, Gift, UserPlus, UserCheck, UserX, Search, Ban
} = LucideIcons;

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#777', accent: '#2563eb', gold: '#eab308', red: '#dc2626', success: '#22c55e'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Data
  const [inventory, setInventory] = useState<any[]>([]);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  // Search & Chat
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");

  // Admin
  const [newGift, setNewGift] = useState({ name: '', image_url: '', price: 0 });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Безопасная проверка ширины экрана для Next.js
  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
    checkUser();
    
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (prof?.banned_until && new Date(prof.banned_until) > new Date()) prof.is_blocked = true;
      setProfile(prof);
      if (prof) loadData(prof.id);
    }
    setLoading(false);
  }

  const loadData = (uid: string) => {
    loadInventory(uid);
    loadFriends(uid);
    loadRequests(uid);
    loadStore();
  };

  const loadInventory = async (uid: string) => {
    const { data } = await supabase.from('inventory').select('*, gifts(*)').eq('user_id', uid);
    setInventory(data || []);
  };

  const loadStore = async () => {
    const { data } = await supabase.from('gifts').select('*').order('created_at', { ascending: false });
    setStoreGifts(data || []);
  };

  const loadFriends = async (uid: string) => {
    const { data } = await supabase.from('friends')
      .select('*, profiles!friends_friend_id_fkey(*), requester:profiles!friends_user_id_fkey(*)')
      .eq('status', 'accepted')
      .or(`user_id.eq.${uid},friend_id.eq.${uid}`);
    const formatted = data?.map(f => f.user_id === uid ? f.profiles : f.requester);
    setFriends(formatted || []);
  };

  const loadRequests = async (uid: string) => {
    const { data } = await supabase.from('friends').select('*, requester:profiles!friends_user_id_fkey(*)').eq('friend_id', uid).eq('status', 'pending');
    setFriendRequests(data || []);
  };

  // --- ACTIONS ---
  const handleAuth = async () => {
    const { error } = isRegistering 
      ? await supabase.auth.signUp({ email, password }) 
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else window.location.reload();
  };

  const buyItem = async (gift: any) => {
    if (profile.balance < gift.price) return alert("Недостаточно CR");
    const { error } = await supabase.from('profiles').update({ balance: profile.balance - gift.price }).eq('id', profile.id);
    if (!error) {
      await supabase.from('inventory').insert([{ user_id: profile.id, gift_id: gift.id }]);
      alert("Куплено!");
      checkUser();
    }
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || !selectedChat) return;
    const msg = { sender_id: profile.id, receiver_id: selectedChat.id, text: msgInput };
    await supabase.from('messages').insert([msg]);
    setMessages([...messages, { ...msg, created_at: new Date().toISOString() }]);
    setMsgInput("");
  };

  if (!mounted) return null;
  if (profile?.is_blocked) return <div style={{background:'#000', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:THEME.red}}><h1>BANNED</h1></div>;

  if (!profile && !loading) {
    return (
      <div style={{ background: THEME.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: THEME.card, padding: '30px', borderRadius: '20px', border: `1px solid ${THEME.border}`, width: '100%', maxWidth: '400px' }}>
          <h2 style={{ color: THEME.accent, textAlign: 'center', marginBottom: '20px' }}>VOID_OS</h2>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{...inputStyle, marginBottom:'10px'}} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{...inputStyle, marginBottom:'20px'}} />
          <button onClick={handleAuth} style={btnMain}>{isRegistering ? "REGISTER" : "LOGIN"}</button>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ textAlign: 'center', fontSize: '12px', marginTop: '15px', cursor: 'pointer', color: THEME.muted }}>
            {isRegistering ? "Back to Login" : "Create Account"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', flexDirection: isMobile ? 'column' : 'row', fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: isMobile ? '100%' : '260px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '10px' }}>
        {!isMobile && <h2 style={{ color: THEME.accent, marginBottom: '20px' }}>VOID_OS</h2>}
        <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={18}/></button>
        <button onClick={() => setActiveTab("store")} style={btnTab(activeTab === "store")}><ShoppingBag size={18}/></button>
        <button onClick={() => setActiveTab("chat")} style={btnTab(activeTab === "chat")}><MessageSquare size={18}/> {friendRequests.length > 0 && "!"}</button>
        {profile?.is_admin && <button onClick={() => {setActiveTab("admin"); supabase.from('profiles').select('*').then(d => setAllUsers(d.data || []));}} style={{...btnTab(activeTab === "admin"), color: THEME.red} as any}><ShieldAlert size={18}/></button>}
        {!isMobile && <div style={{marginTop:'auto', fontSize:'10px', color:THEME.muted}}>ID: {profile?.id?.slice(0,8)}... <br/>{profile?.balance} CR</div>}
      </nav>

      {/* CONTENT */}
      <section style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        
        {/* МАГАЗИН */}
        {activeTab === "store" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
            {storeGifts.map(g => (
              <div key={g.id} style={{ background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
                <img src={g.image_url} style={{ width: '100%', height: '100px', objectFit: 'contain' }} alt="GIF"/>
                <div style={{ fontWeight: 'bold', fontSize: '13px', margin: '10px 0' }}>{g.name}</div>
                <div style={{ color: THEME.gold, marginBottom: '10px' }}>{g.price} CR</div>
                <button onClick={() => buyItem(g)} style={btnAction}>КУПИТЬ</button>
              </div>
            ))}
          </div>
        )}

        {/* СВЯЗЬ (ПОИСК И ЧАТ) */}
        {activeTab === "chat" && (
          <div style={{ display: 'flex', gap: '20px', height: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ width: isMobile ? '100%' : '280px', borderRight: isMobile ? 'none' : `1px solid ${THEME.border}`, paddingRight: '10px' }}>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                <input placeholder="Search ID..." value={searchId} onChange={e => setSearchId(e.target.value)} style={inputStyle} />
                <button onClick={async () => {
                  const { data } = await supabase.from('profiles').select('*').eq('id', searchId.trim()).maybeSingle();
                  setFoundUser(data || "not_found");
                }} style={btnIcon}><Search size={18} /></button>
              </div>
              {foundUser && foundUser !== "not_found" && (
                <div style={foundUserCard}>
                  <span>{foundUser.username}</span>
                  <button onClick={() => supabase.from('friends').insert([{ user_id: profile.id, friend_id: foundUser.id, status: 'pending' }])} style={btnIcon}><UserPlus size={16}/></button>
                </div>
              )}
              {friendRequests.map(r => (
                <div key={r.id} style={reqCard}>
                  <span>Запрос от {r.requester?.username}</span>
                  <button onClick={() => supabase.from('friends').update({ status: 'accepted' }).eq('id', r.id).then(()=>loadData(profile.id))} style={btnIcon}><UserCheck size={16}/></button>
                </div>
              ))}
              <div style={{marginTop:'20px'}}>
                {friends.map(f => (
                  <div key={f.id} onClick={() => {
                    setSelectedChat(f);
                    supabase.from('messages').select('*').or(`and(sender_id.eq.${profile.id},receiver_id.eq.${f.id}),and(sender_id.eq.${f.id},receiver_id.eq.${profile.id})`).order('created_at', { ascending: true }).then(d => setMessages(d.data || []));
                  }} style={friendItem(selectedChat?.id === f.id)}>{f.username}</div>
                ))}
              </div>
            </div>
            {selectedChat && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
                  {messages.map((m, i) => (
                    <div key={i} style={{ textAlign: m.sender_id === profile.id ? 'right' : 'left', marginBottom: '8px' }}>
                      <span style={{ background: m.sender_id === profile.id ? THEME.accent : THEME.card, padding: '8px 12px', borderRadius: '12px', display: 'inline-block' }}>{m.text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input value={msgInput} onChange={e => setMsgInput(e.target.value)} style={inputStyle} placeholder="Message..." />
                  <button onClick={sendMessage} style={btnIcon}><Send size={18} /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* АДМИНКА */}
        {activeTab === "admin" && (
          <div style={{display:'flex', flexDirection:'column', gap:'30px'}}>
            <div style={adminCard}>
              <h3>ADD ITEM</h3>
              <input placeholder="GIF URL (.gif)" onChange={e => setNewGift({...newGift, image_url: e.target.value})} style={inputStyle} />
              <input placeholder="Name" onChange={e => setNewGift({...newGift, name: e.target.value})} style={inputStyle} />
              <input type="number" placeholder="Price" onChange={e => setNewGift({...newGift, price: parseInt(e.target.value)})} style={inputStyle} />
              <button onClick={() => supabase.from('gifts').insert([newGift]).then(()=>loadStore())} style={btnMain}>CREATE</button>
            </div>
            <div style={adminCard}>
              <h3>USERS</h3>
              {allUsers.map(u => (
                <div key={u.id} style={userRow}>
                  <span>{u.username}</span>
                  <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={() => {
                       const g = prompt("Gift ID:");
                       if(g) supabase.from('inventory').insert([{user_id: u.id, gift_id: g}]);
                    }} style={btnIcon}><Gift size={16}/></button>
                    <button onClick={() => {
                       const d = new Date(Date.now() + 86400000).toISOString();
                       supabase.from('profiles').update({ banned_until: d }).eq('id', u.id);
                    }} style={{...btnIcon, color:THEME.red}}><Ban size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ПРОФИЛЬ */}
        {activeTab === "profile" && (
          <div>
            <h3>INVENTORY ({inventory.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
              {inventory.map(i => (
                <div key={i.id} style={{ background: THEME.card, padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                  <img src={i.gifts?.image_url} style={{ width: '100%', height: '50px', objectFit: 'contain' }} alt="GIF"/>
                  <div style={{ fontSize: '9px', marginTop: '5px' }}>{i.gifts?.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>
    </main>
  );
}

// СТИЛИ (Оптимизировано для Vercel/Next.js)
const btnTab = (active: boolean): React.CSSProperties => ({
  background: active ? THEME.accent : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
});
const inputStyle: React.CSSProperties = { width: '100%', background: '#000', border: `1px solid ${THEME.border}`, color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' };
const btnMain: React.CSSProperties = { width: '100%', background: THEME.accent, color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const btnAction: React.CSSProperties = { width: '100%', background: '#fff', color: '#000', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' };
const btnIcon: React.CSSProperties = { background: THEME.card, border: `1px solid ${THEME.border}`, color: '#fff', padding: '10px', borderRadius: '10px', cursor: 'pointer' };
const foundUserCard: React.CSSProperties = { padding: '10px', background: THEME.card, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' };
const reqCard: React.CSSProperties = { padding: '10px', background: THEME.gold + '22', borderRadius: '12px', border: `1px solid ${THEME.gold}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize:'12px' };
const friendItem = (active: boolean): React.CSSProperties => ({ padding: '12px', borderRadius: '12px', background: active ? THEME.card : 'none', cursor: 'pointer', border: `1px solid ${active ? THEME.accent : 'transparent'}`, marginBottom: '5px' });
const adminCard: React.CSSProperties = { background: THEME.card, padding: '20px', borderRadius: '15px', border: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column', gap: '10px' };
const userRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#000', borderRadius: '10px', marginBottom: '5px' };

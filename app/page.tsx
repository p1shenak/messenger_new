"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const { 
  UserCircle, Store, MessageSquare, ShieldAlert, CheckCircle2, 
  Ban, Trash2, Send, ShoppingBag, Tag, Lock, Gift, Share2, 
  UserPlus, UserCheck, UserX, Search, LogIn, PlusCircle, Hammer
} = LucideIcons;

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#777', accent: '#2563eb', gold: '#eab308', red: '#dc2626', success: '#22c55e'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth & UI
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

  // Admin Form
  const [newGift, setNewGift] = useState({ name: '', image_url: '', price: 0, is_nft: false, max_supply: 0 });

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
      if (prof) loadData(prof.id);
    }
    setLoading(false);
  }

  const loadData = (uid: string) => {
    loadInventory(uid);
    loadFriends(uid);
    loadRequests(uid);
    loadStore();
    if (profile?.is_admin) loadAllUsers();
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
    const { data } = await supabase.from('friends')
      .select('*, requester:profiles!friends_user_id_fkey(*)')
      .eq('friend_id', uid)
      .eq('status', 'pending');
    setFriendRequests(data || []);
  };

  const loadAllUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    setAllUsers(data || []);
  };

  // --- ЛОГИКА ---
  const handleAuth = async () => {
    const { error } = isRegistering 
      ? await supabase.auth.signUp({ email, password }) 
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else window.location.reload();
  };

  const searchUser = async () => {
    if (!searchId.trim()) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', searchId.trim()).maybeSingle();
    setFoundUser(data || "not_found");
  };

  const buyItem = async (gift: any) => {
    if (profile.balance < gift.price) return alert("Недостаточно кредитов");
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
  if (profile?.is_blocked) return <div style={{background:'#000', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:THEME.red}}><h1>ACCESS_DENIED_BANNED</h1></div>;

  if (!profile && !loading) {
    return (
      <div style={{ background: THEME.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'monospace' }}>
        <div style={{ background: THEME.card, padding: '30px', borderRadius: '20px', border: `1px solid ${THEME.border}`, width: '100%', maxWidth: '400px' }}>
          <h2 style={{ color: THEME.accent, textAlign: 'center', marginBottom: '20px' }}>VOID_OS</h2>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />
          <button onClick={handleAuth} style={{ width: '100%', background: THEME.accent, color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isRegistering ? "REGISTER" : "LOGIN"}
          </button>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ textAlign: 'center', fontSize: '12px', marginTop: '15px', cursor: 'pointer', color: THEME.muted }}>
            {isRegistering ? "Back to Login" : "Create New Account"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', flexDirection: 'row', fontFamily: 'monospace' }}>
      
      {/* МЕНЮ */}
      <nav style={{ width: '260px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: THEME.accent, marginBottom: '30px' }}>VOID_OS</h2>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={18}/> ПРОФИЛЬ</button>
          <button onClick={() => setActiveTab("store")} style={btnTab(activeTab === "store")}><ShoppingBag size={18}/> МАГАЗИН</button>
          <button onClick={() => setActiveTab("chat")} style={btnTab(activeTab === "chat")}><MessageSquare size={18}/> СВЯЗЬ {friendRequests.length > 0 && <span style={badgeStyle}>{friendRequests.length}</span>}</button>
          {profile?.is_admin && <button onClick={() => {setActiveTab("admin"); loadAllUsers();}} style={{...btnTab(activeTab === "admin"), color: THEME.red} as any}><ShieldAlert size={18}/> АДМИН</button>}
        </div>
        <div style={{ background: THEME.card, padding: '15px', borderRadius: '12px', fontSize: '11px', border: `1px solid ${THEME.border}` }}>
          ID: <span style={{color: THEME.accent}}>{profile?.id}</span><br/>
          CASH: <span style={{color: THEME.gold}}>{profile?.balance} CR</span>
        </div>
      </nav>

      {/* КОНТЕНТ */}
      <section style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* МАГАЗИН */}
        {activeTab === "store" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {storeGifts.map(g => (
              <div key={g.id} style={{ background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
                <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={g.image_url} style={{ width: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="GIF"/>
                </div>
                <div style={{ fontWeight: 'bold', marginTop: '10px' }}>{g.name}</div>
                <div style={{ color: THEME.gold, fontSize: '14px', margin: '10px 0' }}>{g.price} CR</div>
                <button onClick={() => buyItem(g)} style={btnAction}>КУПИТЬ</button>
              </div>
            ))}
          </div>
        )}

        {/* СВЯЗЬ (ПОИСК + ЗАЯВКИ + ЧАТ) */}
        {activeTab === "chat" && (
          <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
            <div style={{ width: '300px', borderRight: `1px solid ${THEME.border}`, paddingRight: '20px' }}>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
                <input placeholder="Search ID..." value={searchId} onChange={e => setSearchId(e.target.value)} style={inputStyle} />
                <button onClick={searchUser} style={{ background: THEME.accent, border: 'none', color: '#fff', padding: '10px', borderRadius: '10px' }}><Search size={18} /></button>
              </div>
              {foundUser && foundUser !== "not_found" && (
                <div style={{ padding: '10px', background: THEME.card, borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px' }}>{foundUser.username}</span>
                  <button onClick={() => supabase.from('friends').insert([{ user_id: profile.id, friend_id: foundUser.id, status: 'pending' }]).then(()=>alert("Sent!"))} style={{ background: THEME.success, border: 'none', padding: '5px', borderRadius: '5px' }}><UserPlus size={14} /></button>
                </div>
              )}
              {friendRequests.map(r => (
                <div key={r.id} style={{ background: THEME.gold + '22', padding: '10px', borderRadius: '10px', marginBottom: '10px', border: `1px solid ${THEME.gold}` }}>
                  <div style={{ fontSize: '11px' }}>Запрос от {r.requester?.username}</div>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                    <button onClick={() => supabase.from('friends').update({ status: 'accepted' }).eq('id', r.id).then(()=>loadData(profile.id))} style={{ background: THEME.success, border: 'none', color: '#fff', padding: '5px', borderRadius: '5px', flex: 1 }}>Accept</button>
                  </div>
                </div>
              ))}
              <h4 style={{ fontSize: '11px', color: THEME.muted, marginBottom: '10px' }}>FRIENDS</h4>
              {friends.map(f => (
                <div key={f.id} onClick={() => openChat(f)} style={{ padding: '12px', borderRadius: '10px', background: selectedChat?.id === f.id ? THEME.card : 'none', cursor: 'pointer', marginBottom: '5px' }}>{f.username}</div>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {selectedChat ? (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    {messages.map((m, i) => (
                      <div key={i} style={{ textAlign: m.sender_id === profile.id ? 'right' : 'left', marginBottom: '10px' }}>
                        <span style={{ background: m.sender_id === profile.id ? THEME.accent : THEME.card, padding: '8px 12px', borderRadius: '12px', fontSize: '14px' }}>{m.text}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} style={inputStyle} placeholder="Message..." />
                    <button onClick={sendMessage} style={{ background: THEME.accent, border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '10px' }}><Send size={18} /></button>
                  </div>
                </>
              ) : <div style={{ margin: 'auto', color: THEME.muted }}>Select a friend to chat</div>}
            </div>
          </div>
        )}

        {/* АДМИНКА (ВСЕ КНОПКИ) */}
        {activeTab === "admin" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <h3>CREATE ITEM</h3>
              <div style={{ background: THEME.card, padding: '20px', borderRadius: '15px', border: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input placeholder="Name" onChange={e => setNewGift({...newGift, name: e.target.value})} style={inputStyle} />
                <input placeholder="Tenor GIF URL" onChange={e => setNewGift({...newGift, image_url: e.target.value})} style={inputStyle} />
                <input type="number" placeholder="Price" onChange={e => setNewGift({...newGift, price: parseInt(e.target.value)})} style={inputStyle} />
                <button onClick={() => supabase.from('gifts').insert([newGift]).then(()=>loadStore())} style={{ background: THEME.success, border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 'bold' }}>PUBLISH</button>
              </div>
            </div>
            <div>
              <h3>USER CONTROL</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {allUsers.map(u => (
                  <div key={u.id} style={{ background: THEME.card, padding: '10px', borderRadius: '10px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px' }}>{u.username}</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => {
                        const target = prompt("Username to give gift to:");
                        const gift = prompt("Gift ID:");
                        supabase.from('profiles').select('id').eq('username', target).single().then(({data}) => {
                          if(data) supabase.from('inventory').insert([{user_id: data.id, gift_id: gift}]);
                        });
                      }} style={{ background: THEME.accent, border: 'none', color: '#fff', padding: '5px', borderRadius: '5px' }}><Gift size={14}/></button>
                      <button onClick={() => {
                        const until = new Date(Date.now() + 3600000).toISOString();
                        supabase.from('profiles').update({ banned_until: until }).eq('id', u.id).then(()=>loadAllUsers());
                      }} style={{ background: THEME.red, border: 'none', color: '#fff', padding: '5px', borderRadius: '5px' }}><Ban size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ПРОФИЛЬ */}
        {activeTab === "profile" && (
          <div>
            <h3>MY INVENTORY</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
              {inventory.map(i => (
                <div key={i.id} style={{ background: THEME.card, padding: '15px', borderRadius: '12px', textAlign: 'center', border: `1px solid ${THEME.border}` }}>
                  <img src={i.gifts?.image_url} style={{ width: '100%', height: '70px', objectFit: 'contain' }} alt="GIF"/>
                  <div style={{ fontSize: '11px', marginTop: '10px' }}>{i.gifts?.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>
    </main>
  );
}

// CSS-in-JS Helpers
function btnTab(active: boolean): React.CSSProperties {
  return {
    background: active ? '#111' : 'none', border: 'none', color: active ? '#fff' : '#777', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 'bold'
  };
}
const inputStyle: React.CSSProperties = { width: '100%', background: '#000', border: `1px solid ${THEME.border}`, color: '#fff', padding: '12px', borderRadius: '10px', outline: 'none' };
const btnAction: React.CSSProperties = { width: '100%', background: '#fff', color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const badgeStyle: React.CSSProperties = { background: THEME.red, color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', marginLeft: 'auto' };

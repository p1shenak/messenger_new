"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const { 
  UserCircle, Store, MessageSquare, ShieldAlert, CheckCircle2, 
  Ban, Trash2, Send, ShoppingBag, Tag, Lock, Gift, Share2, UserPlus, UserCheck, UserX, Search
} = LucideIcons;

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#777', accent: '#2563eb', gold: '#eab308', red: '#dc2626', success: '#22c55e'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  
  // Поиск и Чат
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");

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
        loadData(prof.id);
      }
    }
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
    const { data } = await supabase.from('gifts').select('*');
    setStoreGifts(data || []);
  };

  const loadFriends = async (uid: string) => {
    // Загружаем тех, кто принял заявку
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

  // --- СИСТЕМА ДРУЗЕЙ ---
  const searchUser = async () => {
    if (!searchId) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', searchId).maybeSingle();
    setFoundUser(data || "not_found");
  };

  const sendFriendRequest = async (targetId: string) => {
    const { error } = await supabase.from('friends').insert([{ user_id: profile.id, friend_id: targetId, status: 'pending' }]);
    if (error) alert("Заявка уже отправлена или ошибка");
    else alert("Заявка отправлена!");
  };

  const acceptRequest = async (requestId: string) => {
    await supabase.from('friends').update({ status: 'accepted' }).eq('id', requestId);
    loadData(profile.id);
  };

  const rejectRequest = async (requestId: string) => {
    await supabase.from('friends').delete().eq('id', requestId);
    loadRequests(profile.id);
  };

  // --- ЧАТ ---
  const openChat = async (friend: any) => {
    setSelectedChat(friend);
    const { data } = await supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!msgInput.trim()) return;
    const msg = { sender_id: profile.id, receiver_id: selectedChat.id, text: msgInput };
    await supabase.from('messages').insert([msg]);
    setMessages([...messages, { ...msg, created_at: new Date().toISOString() }]);
    setMsgInput("");
  };

  if (!mounted) return null;
  if (profile?.is_blocked) return <div style={{background:'#000',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:THEME.red}}><h1>BANNED</h1></div>;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '260px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: THEME.accent, marginBottom: '30px' }}>VOID_OS</h2>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={18}/> ПРОФИЛЬ</button>
          <button onClick={() => setActiveTab("chat")} style={btnTab(activeTab === "chat")}><MessageSquare size={18}/> СВЯЗЬ {friendRequests.length > 0 && <span style={{background:THEME.red, borderRadius:'50%', padding:'2px 6px', fontSize:'10px'}}>{friendRequests.length}</span>}</button>
          <button onClick={() => setActiveTab("store")} style={btnTab(activeTab === "store")}><ShoppingBag size={18}/> МАГАЗИН</button>
          {profile?.is_admin && <button onClick={() => setActiveTab("admin")} style={{...btnTab(activeTab === "admin"), color:THEME.red} as any}><ShieldAlert size={18}/> АДМИН</button>}
        </div>
        <div style={{fontSize:'10px', color:THEME.muted}}>ID: {profile?.id}</div>
      </nav>

      {/* CONTENT */}
      <section style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* ВЛАДКА СВЯЗЬ (ПОИСК + ЗАЯВКИ + ЧАТ) */}
        {activeTab === "chat" && (
          <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
            <div style={{ width: '300px', borderRight: `1px solid ${THEME.border}`, paddingRight: '20px' }}>
              
              {/* ПОИСК */}
              <div style={{marginBottom:'30px'}}>
                <div style={{display:'flex', gap:'5px'}}>
                  <input placeholder="Поиск по ID..." value={searchId} onChange={e=>setSearchId(e.target.value)} style={inputStyle}/>
                  <button onClick={searchUser} style={{background:THEME.accent, border:'none', padding:'10px', borderRadius:'10px', color:'#fff'}}><Search size={18}/></button>
                </div>
                {foundUser && foundUser !== "not_found" && (
                  <div style={{marginTop:'10px', background:THEME.card, padding:'10px', borderRadius:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{fontSize:'12px'}}>{foundUser.username}</span>
                    <button onClick={() => sendFriendRequest(foundUser.id)} style={{background:THEME.success, border:'none', color:'#fff', padding:'5px', borderRadius:'5px'}}><UserPlus size={16}/></button>
                  </div>
                )}
              </div>

              {/* ЗАЯВКИ */}
              {friendRequests.length > 0 && (
                <div style={{marginBottom:'30px'}}>
                  <h4 style={{fontSize:'12px', color:THEME.gold}}>ВХОДЯЩИЕ ЗАЯВКИ:</h4>
                  {friendRequests.map(r => (
                    <div key={r.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#111', padding:'10px', borderRadius:'10px', marginTop:'5px'}}>
                      <span style={{fontSize:'12px'}}>{r.requester?.username}</span>
                      <div style={{display:'flex', gap:'5px'}}>
                        <button onClick={()=>acceptRequest(r.id)} style={{color:THEME.success, background:'none', border:'none'}}><UserCheck size={18}/></button>
                        <button onClick={()=>rejectRequest(r.id)} style={{color:THEME.red, background:'none', border:'none'}}><UserX size={18}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* СПИСОК ДРУЗЕЙ */}
              <h4 style={{fontSize:'12px', color:THEME.muted}}>ДРУЗЬЯ:</h4>
              {friends.map(f => (
                <div key={f.id} onClick={() => openChat(f)} style={{ padding: '12px', borderRadius: '10px', background: selectedChat?.id === f.id ? THEME.card : 'none', cursor: 'pointer', marginBottom:'5px', border: `1px solid ${selectedChat?.id === f.id ? THEME.accent : 'transparent'}` }}>
                  {f.username}
                </div>
              ))}
            </div>

            {/* ОКНО ЧАТА */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {selectedChat ? (
                <>
                  <div style={{paddingBottom:'10px', borderBottom:`1px solid ${THEME.border}`, fontWeight:'bold'}}>{selectedChat.username}</div>
                  <div style={{flex: 1, overflowY: 'auto', padding:'20px 0'}}>
                    {messages.map((m, idx) => (
                      <div key={idx} style={{ textAlign: m.sender_id === profile.id ? 'right' : 'left', marginBottom: '10px' }}>
                        <span style={{ padding: '10px 15px', borderRadius: '15px', background: m.sender_id === profile.id ? THEME.accent : THEME.card, fontSize: '14px', display: 'inline-block', maxWidth:'70%' }}>{m.text}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex', gap:'10px'}}>
                    <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} style={inputStyle} placeholder="Введите сообщение..."/>
                    <button onClick={sendMessage} style={{background:THEME.accent, border:'none', color:'#fff', padding:'10px 20px', borderRadius:'10px', cursor:'pointer'}}><Send size={18}/></button>
                  </div>
                </>
              ) : <div style={{margin:'auto', color:THEME.muted}}>Выберите друга для общения</div>}
            </div>
          </div>
        )}

        {/* МАГАЗИН И ПРОФИЛЬ (ОСТАЮТСЯ КАК В ПРЕДЫДУЩЕЙ ВЕРСИИ) */}
        {activeTab === "store" && (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {storeGifts.map(g => (
              <div key={g.id} style={{ background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
                <img src={g.image_url} style={{ width: '100%', height: '120px', objectFit: 'contain' }} alt=""/>
                <div style={{fontWeight:'bold', marginTop:'10px'}}>{g.name}</div>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:'15px', alignItems:'center'}}>
                  <span style={{color:THEME.gold}}>{g.price} CR</span>
                  <button onClick={() => buyFromStore(g)} style={btnAction}>КУПИТЬ</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "profile" && (
          <div>
            <h1>ВАШ ИНВЕНТАРЬ</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px', marginTop:'20px' }}>
              {inventory.map(i => (
                <div key={i.id} style={{ background: THEME.card, padding: '15px', borderRadius: '15px', textAlign: 'center', border: `1px solid ${THEME.border}` }}>
                  <img src={i.gifts?.image_url} style={{ width: '100%', height: '80px', objectFit: 'contain' }} alt=""/>
                  <div style={{fontSize:'12px', marginTop:'10px'}}>{i.gifts?.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>
    </main>
  );
}

// Стили
function btnTab(active: boolean): React.CSSProperties {
  return {
    background: active ? '#111' : 'none', border: 'none', color: active ? '#fff' : '#777', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 'bold'
  };
}
const inputStyle: React.CSSProperties = { width: '100%', background: '#000', border: `1px solid ${THEME.border}`, color: '#fff', padding: '12px', borderRadius: '10px', outline: 'none' };
const btnAction: React.CSSProperties = { background: '#fff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' };

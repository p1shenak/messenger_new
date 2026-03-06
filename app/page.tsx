"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, Zap, Lock, Store, MessageSquare, ShieldAlert, CheckCircle2, 
  Ban, Trash2, Edit3, ImageIcon, Sparkles, UserPlus, Search, Gift, MailWarning, Send
} from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#777', accent: '#2563eb', gold: '#eab308', red: '#dc2626', success: '#22c55e'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [adminHover, setAdminHover] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => { setMounted(true); checkUser(); }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      
      let currentProf = prof;
      if (prof?.banned_until && new Date(prof.banned_until) > new Date()) {
         currentProf = { ...prof, is_banned_now: true };
      } else if (prof?.status === 'Banned' && (!prof.banned_until || new Date(prof.banned_until) <= new Date())) {
         await supabase.from('profiles').update({ status: 'Active', banned_until: null }).eq('id', user.id);
         currentProf = { ...prof, status: 'Active', banned_until: null };
      }

      setProfile(currentProf);
      loadInventory(user.id);
      loadStore();
      loadFriends(user.id);
      if (currentProf?.is_admin) { loadAllUsers(); loadReports(); }
    }
  }

  const loadInventory = async (uid: string) => {
    const { data } = await supabase.from('inventory').select('*, gifts(*)').eq('user_id', uid);
    setInventory(data || []);
  };

  const loadStore = async () => {
    const { data } = await supabase.from('gifts').select('*');
    setStoreGifts(data || []);
  };

  const loadFriends = async (uid: string) => {
    const { data: f1 } = await supabase.from('friends').select('*, profiles!friends_friend_id_fkey(*)').eq('user_id', uid).eq('status', 'accepted');
    const { data: f2 } = await supabase.from('friends').select('*, profiles!friends_user_id_fkey(*)').eq('friend_id', uid).eq('status', 'accepted');
    setFriends([...(f1?.map(x=>x.profiles) || []), ...(f2?.map(x=>x.profiles) || [])]);
  };

  const loadAllUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    setAllUsers(data || []);
  };

  const loadReports = async () => {
    const { data } = await supabase.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(username), reported:profiles!reports_reported_id_fkey(username)');
    setReports(data || []);
  };

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
    const newMsg = { sender_id: profile.id, receiver_id: selectedChat.id, text: msgInput };
    await supabase.from('messages').insert([newMsg]);
    setMessages([...messages, { ...newMsg, created_at: new Date().toISOString() }]);
    setMsgInput("");
  };

  const handleBan = async (uid: string) => {
    const time = prompt("БАН:\n1 - 10 минут\n2 - 1 час\n3 - Навсегда");
    let bannedUntil = null;
    if (time === "1") bannedUntil = new Date(Date.now() + 10 * 60000).toISOString();
    if (time === "2") bannedUntil = new Date(Date.now() + 60 * 60000).toISOString();
    if (time === "3") bannedUntil = new Date(Date.now() + 100 * 365 * 24 * 60 * 60000).toISOString();
    
    if (bannedUntil) {
      await supabase.from('profiles').update({ status: 'Banned', banned_until: bannedUntil }).eq('id', uid);
      alert("БАН ВЫДАН");
      loadAllUsers();
    }
  };

  const giveItem = async (uid: string) => {
    const gId = prompt("ID ПРЕДМЕТА:");
    if (gId) {
      await supabase.from('inventory').insert([{ user_id: uid, gift_id: gId, nft_number: Math.floor(Math.random()*9999) }]);
      alert("ВЫДАНО");
    }
  };

  if (!mounted) return null;

  if (profile?.is_banned_now || profile?.status === 'Banned') {
    return (
      <div style={{background: '#000', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: THEME.red, textAlign: 'center'}}>
        <Ban size={100} />
        <h1 style={{fontSize: '40px', letterSpacing: '5px'}}>ACCESS_DENIED</h1>
        <p>АККАУНТ ЗАБЛОКИРОВАН</p>
        <p style={{color: '#555'}}>РАЗБЛОКИРОВКА: {profile?.banned_until ? new Date(profile.banned_until).toLocaleString() : "НИКОГДА"}</p>
      </div>
    );
  }

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '40px', fontWeight: '900', fontSize: '24px', color: THEME.accent, letterSpacing: '2px' }}>VOID_OS</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={20}/> ПРОФИЛЬ</button>
          <button onClick={() => setActiveTab("chat")} style={btnTab(activeTab === "chat")}><MessageSquare size={20}/> СВЯЗЬ</button>
          <button onClick={() => setActiveTab("store")} style={btnTab(activeTab === "store")}><Store size={20}/> МАРКЕТ</button>
          {profile?.is_admin && (
            <button onClick={() => setActiveTab("admin")} style={{...btnTab(activeTab === "admin"), color: THEME.red, border: `1px solid ${THEME.red}`, marginTop: '20px'}}><ShieldAlert size={20}/> АДМИНКА</button>
          )}
        </div>

        {profile && (
          <div style={{ background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}`, marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
              <img src={profile.avatar_url || ''} style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#222' }} alt="" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {profile.username}
                  {profile.is_admin && (
                    <div onMouseEnter={() => setAdminHover(true)} onMouseLeave={() => setAdminHover(false)} style={{ cursor: 'pointer', position: 'relative' }}>
                      <CheckCircle2 size={14} color={THEME.accent} fill={THEME.accent} />
                      {adminHover && (
                        <div style={{ position: 'absolute', bottom: '20px', left: '0', background: THEME.accent, color: '#fff', padding: '4px 8px', borderRadius: '5px', fontSize: '10px', whiteSpace: 'nowrap', zIndex: 100 }}>
                          {profile.admin_note || 'ADMIN'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: THEME.gold }}>{profile.balance} CR</div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <section style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {activeTab === "chat" && (
          <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
            <div style={{ width: '300px', borderRight: `1px solid ${THEME.border}`, paddingRight: '20px' }}>
               <h3 style={{fontSize: '14px', color: THEME.muted}}>КОНТАКТЫ</h3>
               {friends.map(f => (
                 <div key={f.id} onClick={() => openChat(f)} style={{ padding: '15px', background: THEME.card, borderRadius: '12px', marginBottom: '10px', cursor: 'pointer', border: selectedChat?.id === f.id ? `1px solid ${THEME.accent}` : 'none' }}>
                   {f.username}
                 </div>
               ))}
               <div style={{marginTop: '30px'}}>
                  <input value={searchId} onChange={e=>setSearchId(e.target.value)} placeholder="ID ПОЛЬЗОВАТЕЛЯ" style={inputStyle} />
                  <button onClick={async () => {
                    const {data} = await supabase.from('profiles').select('*').eq('id', searchId).maybeSingle();
                    setFoundUser(data);
                  }} style={{width: '100%', marginTop: '10px', background: THEME.accent, border: 'none', color: '#fff', padding: '10px', borderRadius: '8px', cursor: 'pointer'}}>НАЙТИ</button>
                  {foundUser && <div style={{marginTop: '10px', padding: '10px', background: '#111', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>{foundUser.username} <UserPlus size={16} style={{cursor: 'pointer'}}/></div>}
               </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
               {selectedChat ? (
                 <>
                   <div style={{ paddingBottom: '20px', borderBottom: `1px solid ${THEME.border}`, fontWeight: 'bold' }}>{selectedChat.username}</div>
                   <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
                     {messages.map((m, i) => (
                       <div key={i} style={{ textAlign: m.sender_id === profile.id ? 'right' : 'left', marginBottom: '10px' }}>
                         <div style={{ display: 'inline-block', padding: '10px 15px', background: m.sender_id === profile.id ? THEME.accent : THEME.card, borderRadius: '15px', maxWidth: '70%', fontSize: '14px' }}>
                           {m.text}
                         </div>
                       </div>
                     ))}
                   </div>
                   <div style={{ display: 'flex', gap: '10px' }}>
                     <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} placeholder="СООБЩЕНИЕ..." style={inputStyle} />
                     <button onClick={sendMessage} style={{ background: THEME.accent, border: 'none', color: '#fff', padding: '0 20px', borderRadius: '10px', cursor: 'pointer' }}><Send size={18}/></button>
                   </div>
                 </>
               ) : <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: THEME.muted, fontSize: '12px'}}>ВЫБЕРИТЕ ДИАЛОГ</div>}
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div>
            <h1 style={{color: THEME.red, fontSize: '20px'}}>SYSTEM_ADMIN_PANEL</h1>
            <div style={{display: 'grid', gap: '12px', marginTop: '30px'}}>
               {allUsers.map(u => (
                 <div key={u.id} style={cardStyle}>
                   <div>
                     <b style={{fontSize: '14px'}}>{u.username}</b> <span style={{fontSize: '10px', color: u.status === 'Banned' ? THEME.red : THEME.success}}>[{u.status}]</span>
                     <div style={{fontSize: '9px', color: THEME.muted, marginTop: '2px'}}>{u.id}</div>
                   </div>
                   <div style={{display: 'flex', gap: '8px'}}>
                      <button onClick={()=>giveItem(u.id)} style={{background: THEME.gold, border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'}}>NFT</button>
                      <button onClick={()=>handleBan(u.id)} style={{background: THEME.red, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer'}}><Ban size={14}/></button>
                      <button onClick={()=>confirm("УДАЛИТЬ?") && supabase.from('profiles').delete().eq('id', u.id)} style={{background: '#222', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer'}}><Trash2 size={14}/></button>
                   </div>
                 </div>
               ))}
            </div>

            <h3 style={{marginTop: '50px', display: 'flex', alignItems: 'center', gap: '10px'}}><MailWarning size={18} color={THEME.red}/> REPORTS_LOG</h3>
            <div style={{background: THEME.card, padding: '20px', borderRadius: '20px', border: `1px solid ${THEME.border}`}}>
               {reports.map(r => (
                 <div key={r.id} style={{borderBottom: `1px solid ${THEME.border}`, padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                   <div>
                     <b style={{color: THEME.accent}}>{r.reporter?.username}</b> {" -> "} <b style={{color: THEME.red}}>{r.reported?.username}</b>
                     <div style={{color: THEME.muted, fontSize: '12px', marginTop: '5px'}}>{r.reason}</div>
                   </div>
                   <button onClick={()=>openChat({id: r.reported_id, username: "REPORT_CHAT"})} style={{background: THEME.accent, border: 'none', padding: '8px 15px', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '11px'}}>ПОДКЛЮЧИТЬСЯ</button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div style={{maxWidth: '800px'}}>
            <div style={{height: '200px', background: `url(${profile?.banner_url || ''})`, backgroundColor: '#111', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '25px', position: 'relative'}}>
               <img src={profile?.avatar_url || ''} style={{width: '100px', height: '100px', borderRadius: '50%', border: `5px solid ${THEME.bg}`, position: 'absolute', bottom: '-50px', left: '40px', objectFit: 'cover', background: '#222'}} alt="" />
            </div>
            <div style={{marginTop: '70px', marginLeft: '40px'}}>
               <h1 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '10px'}}>
                 {profile?.username}
                 {profile?.is_admin && <CheckCircle2 color={THEME.accent} fill={THEME.accent} />}
               </h1>
               <div style={{color: THEME.gold, fontWeight: 'bold', marginTop: '5px', fontSize: '18px'}}>{profile?.balance} CR</div>
               
               <h3 style={{marginTop: '40px', fontSize: '14px', color: THEME.muted}}>COLLECTION</h3>
               <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '20px', marginTop: '20px'}}>
                 {inventory.map(i => (
                   <div key={i.id} style={{background: i.metadata?.bg || '#111', borderRadius: '20px', padding: '15px', textAlign: 'center', border: `1px solid ${THEME.border}`, position: 'relative'}}>
                      <img src={i.gifts.image_url} style={{width: '100%', height: '80px', objectFit: 'contain'}} alt="" />
                      <div style={{fontSize: '11px', marginTop: '10px', fontWeight: 'bold'}}>{i.gifts.name}</div>
                      {i.nft_number && <div style={{fontSize: '9px', opacity: 0.5, position: 'absolute', top: '10px', right: '10px'}}>#{i.nft_number}</div>}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}

const btnTab = (active: boolean) => ({
  background: active ? '#111' : 'none', border: 'none', color: active ? '#fff' : '#777', padding: '14px' as string | number, borderRadius: '12px', textAlign: 'left' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 'bold'
});
const inputStyle = { width: '100%', background: THEME.card, border: `1px solid ${THEME.border}`, color: '#fff', padding: '12px', borderRadius: '12px', fontSize: '13px' };
const cardStyle = { background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

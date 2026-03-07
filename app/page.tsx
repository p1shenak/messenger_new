"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const { 
  UserCircle, MessageSquare, ShieldAlert, Send, ShoppingBag, 
  Gift, UserPlus, UserCheck, Search, Ban, Flag, Edit3, Save, Eye, LogOut
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
  
  // Данные
  const [inventory, setInventory] = useState<any[]>([]);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  // Чат и Поиск
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);

  // Кастомизация
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newAvatar, setNewAvatar] = useState("");

  // Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

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
    // Магазин
    const { data: gifts } = await supabase.from('gifts').select('*').order('created_at', { ascending: false });
    setStoreGifts(gifts || []);

    // Инвентарь
    const { data: inv } = await supabase.from('inventory').select('*, gifts(*)').eq('user_id', uid);
    setInventory(inv || []);

    // Друзья
    const { data: f } = await supabase.from('friends').select('*, profiles!friends_friend_id_fkey(*), requester:profiles!friends_user_id_fkey(*)').eq('status', 'accepted').or(`user_id.eq.${uid},friend_id.eq.${uid}`);
    setFriends(f?.map(i => i.user_id === uid ? i.profiles : i.requester) || []);

    // Заявки
    const { data: req } = await supabase.from('friends').select('*, requester:profiles!friends_user_id_fkey(*)').eq('friend_id', uid).eq('status', 'pending');
    setFriendRequests(req || []);
  };

  const loadAdminData = async () => {
    const { data: reps } = await supabase.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(username), target:profiles!reports_target_id_fkey(username)');
    setReports(reps || []);
    const { data: users } = await supabase.from('profiles').select('*');
    setAllUsers(users || []);
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
  if (profile?.is_blocked) return <div style={{background:'#000', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:THEME.red}}><h1>ACCESS_DENIED_BANNED</h1></div>;

  if (!profile && !loading) {
    return (
      <div style={{ background: THEME.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: THEME.card, padding: '30px', borderRadius: '20px', border: `1px solid ${THEME.border}`, width: '100%', maxWidth: '400px' }}>
          <h2 style={{ color: THEME.accent, textAlign: 'center', marginBottom: '20px' }}>VOID_OS</h2>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
          <button onClick={handleAuth} style={btnMain}>{isRegistering ? "REGISTER" : "LOGIN"}</button>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ textAlign: 'center', fontSize: '12px', marginTop: '15px', cursor: 'pointer', color: THEME.muted }}>
            {isRegistering ? "Back to Login" : "Create Account"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '250px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ color: THEME.accent, marginBottom: '20px' }}>VOID_OS</h2>
        <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={18}/> ПРОФИЛЬ</button>
        <button onClick={() => setActiveTab("store")} style={btnTab(activeTab === "store")}><ShoppingBag size={18}/> МАГАЗИН</button>
        <button onClick={() => setActiveTab("chat")} style={btnTab(activeTab === "chat")}><MessageSquare size={18}/> СВЯЗЬ</button>
        {profile?.is_admin && <button onClick={() => {setActiveTab("admin"); loadAdminData();}} style={{...btnTab(activeTab === "admin"), color: THEME.red} as any}><ShieldAlert size={18}/> АДМИНКА</button>}
        
        <div style={{ marginTop: 'auto', background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
          <div style={{fontSize:'10px', color:THEME.muted, overflow:'hidden'}}>ID: {profile?.id}</div>
          <div style={{fontWeight:'bold', color:THEME.gold}}>{profile?.balance} CR</div>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{background:'none', border:'none', color:THEME.red, cursor:'pointer', padding:0, marginTop:'10px', display:'flex', alignItems:'center', gap:'5px', fontSize:'11px'}}><LogOut size={12}/> ВЫХОД</button>
        </div>
      </nav>

      {/* CONTENT */}
      <section style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* ПРОФИЛЬ */}
        {activeTab === "profile" && (
          <div style={{ maxWidth: '700px' }}>
            <div style={{ background: THEME.card, padding: '25px', borderRadius: '25px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px', border: `1px solid ${THEME.border}` }}>
              <img src={profile?.avatar_url || 'https://via.placeholder.com/100'} style={{ width: '100px', height: '100px', borderRadius: '50%', border: `2px solid ${THEME.accent}`, objectFit: 'cover' }} />
              <div style={{flex: 1}}>
                {editMode ? (
                  <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    <input value={newUsername} onChange={e => setNewUsername(e.target.value)} style={inputStyle} placeholder="Никнейм" />
                    <input value={newAvatar} onChange={e => setNewAvatar(e.target.value)} style={inputStyle} placeholder="URL аватара" />
                    <button onClick={saveProfile} style={btnMain}><Save size={16}/> СОХРАНИТЬ</button>
                  </div>
                ) : (
                  <>
                    <h2 style={{margin:0}}>{profile?.username} <Edit3 size={18} onClick={()=>setEditMode(true)} style={{cursor:'pointer', color:THEME.muted, marginLeft:'10px'}}/></h2>
                    <p style={{color:THEME.muted}}>System User</p>
                  </>
                )}
              </div>
            </div>
            <h3>ИНВЕНТАРЬ ({inventory.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
              {inventory.map(i => (
                <div key={i.id} style={{ background: THEME.card, padding: '15px', borderRadius: '15px', textAlign: 'center', border: `1px solid ${THEME.border}` }}>
                  <img src={i.gifts?.image_url} style={{ width: '100%', height: '80px', objectFit: 'contain' }} />
                  <div style={{ fontSize: '11px', marginTop: '10px' }}>{i.gifts?.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* МАГАЗИН */}
        {activeTab === "store" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {storeGifts.length === 0 && <p style={{color:THEME.muted}}>Магазин пуст. Добавьте товары в админке.</p>}
            {storeGifts.map(g => (
              <div key={g.id} style={{ background: THEME.card, padding: '20px', borderRadius: '20px', border: `1px solid ${THEME.border}` }}>
                <img src={g.image_url} style={{ width: '100%', height: '150px', objectFit: 'contain' }} />
                <div style={{ fontWeight: 'bold', marginTop: '15px' }}>{g.name}</div>
                <div style={{ color: THEME.gold, fontSize: '18px', margin: '10px 0' }}>{g.price} CR</div>
                <button onClick={() => buyItem(g)} style={btnAction}>КУПИТЬ</button>
              </div>
            ))}
          </div>
        )}

        {/* ЧАТ И ПОИСК */}
        {activeTab === "chat" && (
          <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
            <div style={{ width: '300px', borderRight: `1px solid ${THEME.border}`, paddingRight: '20px' }}>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
                <input placeholder="Search ID..." value={searchId} onChange={e => setSearchId(e.target.value)} style={inputStyle} />
                <button onClick={async () => {
                  const { data } = await supabase.from('profiles').select('*').eq('id', searchId.trim()).maybeSingle();
                  setFoundUser(data || "not_found");
                }} style={btnIcon}><Search size={18}/></button>
              </div>
              {foundUser && foundUser !== "not_found" && (
                <div style={userRow}>
                  <span>{foundUser.username}</span>
                  <div style={{display:'flex', gap:'5px'}}>
                    <button onClick={() => supabase.from('friends').insert([{ user_id: profile.id, friend_id: foundUser.id, status: 'pending' }])} style={btnIcon}><UserPlus size={14}/></button>
                    <button onClick={() => {
                        const reason = prompt("Причина жалобы:");
                        if(reason) supabase.from('reports').insert([{ reporter_id: profile.id, target_id: foundUser.id, reason }]);
                    }} style={{...btnIcon, color:THEME.red}}><Flag size={14}/></button>
                  </div>
                </div>
              )}
              {friendRequests.map(r => (
                <div key={r.id} style={{...userRow, background: THEME.gold+'11', border:`1px solid ${THEME.gold}`}}>
                  <span>Запрос: {r.requester?.username}</span>
                  <button onClick={() => supabase.from('friends').update({ status: 'accepted' }).eq('id', r.id).then(()=>loadData(profile.id))} style={btnIcon}><UserCheck size={14}/></button>
                </div>
              ))}
              <h4 style={{color:THEME.muted, fontSize:'11px'}}>ДРУЗЬЯ</h4>
              {friends.map(f => (
                <div key={f.id} onClick={() => {
                  setSelectedChat(f);
                  supabase.from('messages').select('*').or(`and(sender_id.eq.${profile.id},receiver_id.eq.${f.id}),and(sender_id.eq.${f.id},receiver_id.eq.${profile.id})`).order('created_at', { ascending: true }).then(d => setMessages(d.data || []));
                }} style={friendItem(selectedChat?.id === f.id)}>{f.username}</div>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: THEME.card, borderRadius: '20px', padding: '20px' }}>
              {selectedChat ? (
                <>
                  <div style={{flex: 1, overflowY:'auto', paddingBottom:'20px'}}>
                    {messages.map((m, i) => (
                      <div key={i} style={{ textAlign: m.sender_id === profile.id ? 'right' : 'left', marginBottom: '10px' }}>
                        <span style={{ background: m.sender_id === profile.id ? THEME.accent : THEME.sidebar, padding: '10px 15px', borderRadius: '15px', display: 'inline-block' }}>{m.text}</span>
                      </div>
                    ))}
                  </div>
                  {selectedChat.id !== "spy" && (
                    <div style={{display:'flex', gap:'10px'}}>
                      <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} style={inputStyle} placeholder="Введите сообщение..." />
                      <button onClick={sendMessage} style={btnIcon}><Send size={18}/></button>
                    </div>
                  )}
                </>
              ) : <div style={{margin:'auto', color:THEME.muted}}>Выберите чат для общения</div>}
            </div>
          </div>
        )}

        {/* АДМИНКА */}
        {activeTab === "admin" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div style={adminCard}>
              <h3>ЖАЛОБЫ И ШПИОНАЖ</h3>
              {reports.map(r => (
                <div key={r.id} style={{ borderBottom: `1px solid ${THEME.border}`, padding: '10px 0' }}>
                  <div style={{ fontSize: '12px' }}><b>{r.reporter?.username}</b> на <b>{r.target?.username}</b></div>
                  <div style={{ color: THEME.gold, fontSize:'13px' }}>"{r.reason}"</div>
                  <button onClick={async () => {
                    const { data } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${r.reporter_id},receiver_id.eq.${r.target_id}),and(sender_id.eq.${r.target_id},receiver_id.eq.${r.reporter_id})`).order('created_at', { ascending: true });
                    setMessages(data || []);
                    setSelectedChat({ username: "SYSTEM_WATCH", id: "spy" });
                    setActiveTab("chat");
                  }} style={{marginTop:'5px', background:THEME.accent, border:'none', color:'#fff', padding:'4px 10px', borderRadius:'5px', cursor:'pointer', fontSize:'11px'}}><Eye size={12}/> СМОТРЕТЬ ЧАТ</button>
                </div>
              ))}
            </div>
            <div style={adminCard}>
              <h3>УПРАВЛЕНИЕ</h3>
              <div style={{marginBottom:'20px'}}>
                <h4>НОВЫЙ ТОВАР</h4>
                <input placeholder="Название" id="gn" style={inputStyle} />
                <input placeholder="URL GIF" id="gu" style={inputStyle} />
                <input placeholder="Цена" id="gp" style={inputStyle} />
                <button onClick={async () => {
                  const name = (document.getElementById('gn') as HTMLInputElement).value;
                  const url = (document.getElementById('gu') as HTMLInputElement).value;
                  const price = (document.getElementById('gp') as HTMLInputElement).value;
                  await supabase.from('gifts').insert([{ name, image_url: url, price: parseInt(price) }]);
                  alert("Готово!"); loadData(profile.id);
                }} style={btnMain}>ОПУБЛИКОВАТЬ</button>
              </div>
              <h4>ЮЗЕРЫ</h4>
              {allUsers.map(u => (
                <div key={u.id} style={userRow}>
                  <span>{u.username}</span>
                  <div style={{display:'flex', gap:'5px'}}>
                    <button onClick={() => {
                        const g = prompt("Gift ID:");
                        if(g) supabase.from('inventory').insert([{user_id: u.id, gift_id: g}]);
                    }} style={btnIcon}><Gift size={14}/></button>
                    <button onClick={() => {
                        const d = new Date(Date.now() + 86400000).toISOString();
                        supabase.from('profiles').update({ banned_until: d }).eq('id', u.id);
                    }} style={{...btnIcon, color:THEME.red}}><Ban size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>
    </main>
  );
}

// СТИЛИ
const btnTab = (active: boolean) => ({
  background: active ? THEME.accent : 'none', border: 'none', color: '#fff', padding: '12px 15px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' as const, width: '100%', fontSize: '13px', fontWeight: 'bold' as const
});
const inputStyle = { width: '100%' as const, background: '#000', border: `1px solid ${THEME.border}`, color: '#fff', padding: '12px', borderRadius: '12px', marginBottom: '10px', outline: 'none' };
const btnMain = { width: '100%' as const, background: THEME.accent, color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold' as const, cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' };
const btnAction = { background: '#fff', color: '#000', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' as const, width: '100%' as const };
const btnIcon = { background: THEME.sidebar, border: `1px solid ${THEME.border}`, color: '#fff', padding: '10px', borderRadius: '10px', cursor: 'pointer', display:'flex', alignItems:'center' };
const userRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: THEME.card, borderRadius: '12px', marginBottom: '5px', border: `1px solid ${THEME.border}`, fontSize: '13px' };
const friendItem = (active: boolean) => ({ padding: '12px', borderRadius: '12px', background: active ? THEME.accent+'22' : 'none', cursor: 'pointer', border: `1px solid ${active ? THEME.accent : 'transparent'}`, marginBottom: '5px' });
const adminCard = { background: THEME.card, padding: '20px', borderRadius: '20px', border: `1px solid ${THEME.border}` };

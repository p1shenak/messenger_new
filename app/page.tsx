"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const { 
  UserCircle, MessageSquare, ShieldAlert, ShoppingBag, 
  Tag, Coins, LogOut, Ban, Gift, Sparkles, Search, Send, Flag, Edit3
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
  
  // Auth & UI
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Редактирование профиля
  const [editMode, setEditMode] = useState(false);
  const [updUsername, setUpdUsername] = useState("");
  const [updAvatar, setUpdAvatar] = useState("");

  // Данные мессенджера
  const [inventory, setInventory] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

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
      if (prof) {
        setProfile(prof);
        setUpdUsername(prof.username);
        setUpdAvatar(prof.avatar_url);
        loadData(prof.id);
      }
    }
    setLoading(false);
  }

  const loadData = async (uid: string) => {
    const [inv, usrs, gs, reps] = await Promise.all([
      supabase.from('inventory').select('*, gifts(*)').eq('user_id', uid),
      supabase.from('profiles').select('*').order('username'),
      supabase.from('gifts').select('*'),
      supabase.from('reports').select('*, reporter:profiles!reporter_id(username), target:profiles!target_id(username)')
    ]);
    setInventory(inv.data || []);
    setAllUsers(usrs.data || []);
    setStoreGifts(gs.data || []);
    setReports(reps.data || []);
  };

  const updateProfile = async () => {
    await supabase.from('profiles').update({ username: updUsername, avatar_url: updAvatar }).eq('id', profile.id);
    setEditMode(false);
    window.location.reload();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    await supabase.from('messages').insert([{ 
      sender_id: profile.id, 
      receiver_id: selectedChat.id, 
      text: newMessage 
    }]);
    setNewMessage("");
    // В реальности тут нужен Realtime или повторный фетч
  };

  if (!mounted) return null;

  if (!profile && !loading) {
    return (
      <div style={{ background: THEME.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: THEME.card, padding: '40px', borderRadius: '30px', border: `1px solid ${THEME.border}`, width: '350px' }}>
          <h2 style={{ color: THEME.accent, textAlign: 'center', marginBottom: '30px' }}>VEXY_OS</h2>
          <input placeholder="НИКНЕЙМ" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="ПАРОЛЬ" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
          <button onClick={async () => {
             const vEmail = `${username.toLowerCase()}@vexy.io`;
             if(isRegistering) {
               const { data } = await supabase.auth.signUp({ email: vEmail, password });
               if(data.user) await supabase.from('profiles').insert([{ id: data.user.id, username, balance: 500 }]);
               window.location.reload();
             } else {
               await supabase.auth.signInWithPassword({ email: vEmail, password });
               window.location.reload();
             }
          }} style={btnMain}>{isRegistering ? "СОЗДАТЬ" : "ВОЙТИ"}</button>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', cursor: 'pointer', color: THEME.muted }}>
            {isRegistering ? "Есть аккаунт? Вход" : "Нет аккаунта? Регистрация"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      {/* SIDEBAR */}
      <nav style={{ width: '260px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ color: THEME.accent, fontWeight: 'bold', fontSize: '18px', padding: '10px' }}>VEXY_NET</div>
        <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={18}/> ПРОФИЛЬ</button>
        <button onClick={() => setActiveTab("chat")} style={btnTab(activeTab === "chat")}><MessageSquare size={18}/> ЧАТЫ</button>
        <button onClick={() => setActiveTab("users")} style={btnTab(activeTab === "users")}><Search size={18}/> ПОИСК</button>
        {profile?.is_admin && <button onClick={() => setActiveTab("admin")} style={{...btnTab(activeTab === "admin"), color: THEME.red} as any}><ShieldAlert size={18}/> АДМИНКА</button>}
        
        <div style={{ marginTop: 'auto', background: THEME.card, padding: '15px', borderRadius: '15px' }}>
          <div style={{color: THEME.gold, fontWeight: 'bold'}}>{profile?.balance} CR</div>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{background:'none', border:'none', color:THEME.red, cursor:'pointer', fontSize:'11px', marginTop:'10px'}}>ВЫЙТИ</button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <section style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* ПРОФИЛЬ С НАСТРОЙКОЙ */}
        {activeTab === "profile" && (
          <div style={{ maxWidth: '600px' }}>
            <div style={{ background: THEME.card, padding: '30px', borderRadius: '25px', border: `1px solid ${THEME.border}`, marginBottom: '30px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <img src={profile?.avatar_url || 'https://via.placeholder.com/100'} style={{ width: '80px', height: '80px', borderRadius: '20px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0 }}>{profile?.username}</h2>
                  <p style={{ color: THEME.muted, fontSize: '12px' }}>ID: {profile?.id}</p>
                </div>
                <button onClick={() => setEditMode(!editMode)} style={btnSmall}><Edit3 size={16}/></button>
              </div>

              {editMode && (
                <div style={{ marginTop: '20px', borderTop: `1px solid ${THEME.border}`, paddingTop: '20px' }}>
                  <label style={{ fontSize: '10px', color: THEME.muted }}>ИЗМЕНИТЬ НИК</label>
                  <input value={updUsername} onChange={e => setUpdUsername(e.target.value)} style={inputStyle} />
                  <label style={{ fontSize: '10px', color: THEME.muted }}>URL АВАТАРКИ (GIF/PNG)</label>
                  <input value={updAvatar} onChange={e => setUpdAvatar(e.target.value)} style={inputStyle} />
                  <button onClick={updateProfile} style={btnMain}>СОХРАНИТЬ</button>
                </div>
              )}
            </div>

            <h3>ИНВЕНТАРЬ</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
              {inventory.map(i => (
                <div key={i.id} style={{ background: THEME.card, padding: '15px', borderRadius: '20px', border: i.gifts?.is_nft ? `1px solid ${THEME.mythic}` : `1px solid ${THEME.border}`, textAlign: 'center' }}>
                  <img src={i.gifts?.image_url} style={{ width: '100%', height: '70px', objectFit: 'contain' }} />
                  <div style={{ fontSize: '11px', marginTop: '5px' }}>{i.gifts?.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* МЕССЕНДЖЕР */}
        {activeTab === "chat" && (
          <div style={{ display: 'flex', height: '100%', gap: '20px' }}>
            <div style={{ width: '250px', background: THEME.card, borderRadius: '20px', padding: '15px', border: `1px solid ${THEME.border}` }}>
              <h4 style={{ marginBottom: '15px' }}>ДИАЛОГИ</h4>
              {/* Тут должен быть список чатов */}
              <p style={{color: THEME.muted, fontSize: '12px'}}>Выберите пользователя в поиске, чтобы начать чат.</p>
            </div>
            <div style={{ flex: 1, background: THEME.card, borderRadius: '20px', display: 'flex', flexDirection: 'column', border: `1px solid ${THEME.border}` }}>
              {selectedChat ? (
                <>
                  <div style={{ padding: '20px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{selectedChat.username}</span>
                    <button onClick={async () => {
                      await supabase.from('reports').insert([{ reporter_id: profile.id, target_id: selectedChat.id, reason: 'Жалоба из чата' }]);
                      alert("Жалоба отправлена модераторам");
                    }} style={{ background: 'none', border: 'none', color: THEME.red, cursor: 'pointer' }}><Flag size={18}/></button>
                  </div>
                  <div style={{ flex: 1, padding: '20px' }}>
                    {/* Сообщения */}
                  </div>
                  <div style={{ padding: '20px', display: 'flex', gap: '10px' }}>
                    <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Сообщение..." style={{...inputStyle, marginBottom: 0}} />
                    <button onClick={sendMessage} style={{...btnSmall, background: THEME.accent, padding: '0 20px'}}><Send size={18}/></button>
                  </div>
                </>
              ) : <div style={{ margin: 'auto', color: THEME.muted }}>Выберите чат</div>}
            </div>
          </div>
        )}

        {/* ПОИСК ПОЛЬЗОВАТЕЛЕЙ */}
        {activeTab === "users" && (
          <div>
            <input placeholder="Поиск по нику..." onChange={e => setSearchQuery(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allUsers.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                <div key={u.id} style={{ background: THEME.card, padding: '15px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{u.username}</span>
                  <button onClick={() => { setSelectedChat(u); setActiveTab("chat"); }} style={btnSmall}>НАПИСАТЬ</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* УЛУЧШЕННАЯ АДМИНКА */}
        {activeTab === "admin" && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => setAdminTab("items")} style={btnSubTab(adminTab === "items")}>МАГАЗИН</button>
              <button onClick={() => setAdminTab("reports")} style={btnSubTab(adminTab === "reports")}>ЖАЛОБЫ ({reports.length})</button>
              <button onClick={() => setAdminTab("users")} style={btnSubTab(adminTab === "users")}>ИГРОКИ</button>
            </div>

            {adminTab === "reports" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reports.map(r => (
                  <div key={r.id} style={adminCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><b>{r.reporter?.username}</b> жалуется на <b>{r.target?.username}</b></span>
                      <span style={{ color: THEME.red }}>{r.reason}</span>
                    </div>
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <button style={btnSmall} onClick={() => { setSelectedChat({id: r.target_id, username: `ЧАТ: ${r.target?.username}`}); setActiveTab("chat"); }}>ЧИТАТЬ ПЕРЕПИСКУ</button>
                      <button style={{...btnSmall, color: THEME.red}} onClick={() => {
                        const hrs = prompt("Часы бана:");
                        if(hrs) supabase.from('profiles').update({ banned_until: new Date(Date.now() + parseInt(hrs)*3600000).toISOString() }).eq('id', r.target_id);
                      }}>ЗАБАНИТЬ</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* ... (Остальные вкладки админки как в прошлом коде) ... */}
          </div>
        )}
      </section>
    </main>
  );
}

const btnTab = (active: boolean) => ({ background: active ? THEME.accent : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left' as const });
const btnSubTab = (active: boolean) => ({ background: active ? THEME.accent : THEME.card, color: '#fff', border: `1px solid ${THEME.border}`, padding: '8px 15px', borderRadius: '10px', cursor: 'pointer' });
const inputStyle = { width: '100%' as const, background: '#000', border: `1px solid ${THEME.border}`, color: '#fff', padding: '12px', borderRadius: '12px', marginBottom: '15px', outline: 'none' };
const btnMain = { width: '100%' as const, background: THEME.accent, color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' as const };
const btnSmall = { background: THEME.card, border: `1px solid ${THEME.border}`, color: '#fff', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const adminCard = { background: THEME.card, padding: '20px', borderRadius: '20px', border: `1px solid ${THEME.border}` };

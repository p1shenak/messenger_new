"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const { 
  UserCircle, MessageSquare, ShieldAlert, Send, ShoppingBag, 
  Gift, UserPlus, UserCheck, Search, Ban, Flag, Edit3, Save, Eye
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

  // Админ: Репорты и Шпионаж
  const [reports, setReports] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

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
    // Загрузка магазина (явно проверяем наличие данных)
    const { data: gifts } = await supabase.from('gifts').select('*').order('created_at', { ascending: false });
    setStoreGifts(gifts || []);

    const { data: inv } = await supabase.from('inventory').select('*, gifts(*)').eq('user_id', uid);
    setInventory(inv || []);

    const { data: f } = await supabase.from('friends').select('*, profiles!friends_friend_id_fkey(*), requester:profiles!friends_user_id_fkey(*)').eq('status', 'accepted').or(`user_id.eq.${uid},friend_id.eq.${uid}`);
    setFriends(f?.map(i => i.user_id === uid ? i.profiles : i.requester) || []);

    const { data: req } = await supabase.from('friends').select('*, requester:profiles!friends_user_id_fkey(*)').eq('friend_id', uid).eq('status', 'pending');
    setFriendRequests(req || []);
    
    if (profile?.is_admin) {
        const { data: reps } = await supabase.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(username), target:profiles!reports_target_id_fkey(username)');
        setReports(reps || []);
    }
  };

  // --- ФУНКЦИИ ---
  const saveProfile = async () => {
    await supabase.from('profiles').update({ username: newUsername, avatar_url: newAvatar }).eq('id', profile.id);
    setProfile({ ...profile, username: newUsername, avatar_url: newAvatar });
    setEditMode(false);
  };

  const sendReport = async (targetId: string) => {
    const reason = prompt("Причина репорта:");
    if (!reason) return;
    await supabase.from('reports').insert([{ reporter_id: profile.id, target_id: targetId, reason }]);
    alert("Репорт отправлен администратору.");
  };

  const spyOnChat = async (userId1: string, userId2: string) => {
    const { data } = await supabase.from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: true });
    setMessages(data || []);
    setActiveTab("chat"); // Переключаем в окно чата для просмотра
    setSelectedChat({ username: "SYSTEM_VIEW", id: "spy" }); 
  };

  const buyItem = async (gift: any) => {
    if (profile.balance < gift.price) return alert("Недостаточно CR");
    await supabase.from('profiles').update({ balance: profile.balance - gift.price }).eq('id', profile.id);
    await supabase.from('inventory').insert([{ user_id: profile.id, gift_id: gift.id }]);
    alert("Успешно!");
    checkUser();
  };

  if (!mounted) return null;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* САЙДБАР С НАЗВАНИЯМИ */}
      <nav style={{ width: '240px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ color: THEME.accent, marginBottom: '20px' }}>VOID_OS</h2>
        <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={18}/> ПРОФИЛЬ</button>
        <button onClick={() => setActiveTab("store")} style={btnTab(activeTab === "store")}><ShoppingBag size={18}/> МАГАЗИН</button>
        <button onClick={() => setActiveTab("chat")} style={btnTab(activeTab === "chat")}><MessageSquare size={18}/> СВЯЗЬ</button>
        {profile?.is_admin && (
          <button onClick={() => setActiveTab("admin")} style={{...btnTab(activeTab === "admin"), color: THEME.red} as any}><ShieldAlert size={18}/> АДМИНКА</button>
        )}
        
        <div style={{ marginTop: 'auto', background: THEME.card, padding: '15px', borderRadius: '15px' }}>
          <div style={{ fontSize: '10px', color: THEME.muted }}>ID: {profile?.id?.slice(0,8)}</div>
          <div style={{ fontWeight: 'bold', color: THEME.gold }}>{profile?.balance} CR</div>
        </div>
      </nav>

      {/* КОНТЕНТ */}
      <section style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* ПРОФИЛЬ И КАСТОМИЗАЦИЯ */}
        {activeTab === "profile" && (
          <div style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px', background: THEME.card, padding: '20px', borderRadius: '20px' }}>
              <img src={profile?.avatar_url || 'https://via.placeholder.com/80'} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${THEME.accent}` }} />
              <div>
                {editMode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input value={newUsername} onChange={e => setNewUsername(e.target.value)} style={inputStyle} placeholder="Никнейм" />
                    <input value={newAvatar} onChange={e => setNewAvatar(e.target.value)} style={inputStyle} placeholder="URL Аватара" />
                    <button onClick={saveProfile} style={{ background: THEME.success, border: 'none', padding: '5px', borderRadius: '5px' }}><Save size={16}/></button>
                  </div>
                ) : (
                  <>
                    <h2 style={{ margin: 0 }}>{profile?.username} <Edit3 size={16} onClick={() => setEditMode(true)} style={{ cursor: 'pointer', color: THEME.muted }} /></h2>
                    <p style={{ color: THEME.muted, fontSize: '12px' }}>Статус: Online</p>
                  </>
                )}
              </div>
            </div>

            <h3>ИНВЕНТАРЬ ({inventory.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
              {inventory.map(i => (
                <div key={i.id} style={{ background: THEME.card, padding: '10px', borderRadius: '15px', textAlign: 'center' }}>
                  <img src={i.gifts?.image_url} style={{ width: '100%', height: '80px', objectFit: 'contain' }} />
                  <div style={{ fontSize: '11px', marginTop: '5px' }}>{i.gifts?.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* МАГАЗИН */}
        {activeTab === "store" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
            {storeGifts.length === 0 && <p>В магазине пусто. Добавьте товары в админке.</p>}
            {storeGifts.map(g => (
              <div key={g.id} style={{ background: THEME.card, padding: '15px', borderRadius: '20px', border: `1px solid ${THEME.border}` }}>
                <img src={g.image_url} style={{ width: '100%', height: '120px', objectFit: 'contain' }} />
                <div style={{ fontWeight: 'bold', marginTop: '10px' }}>{g.name}</div>
                <div style={{ color: THEME.gold, margin: '10px 0' }}>{g.price} CR</div>
                <button onClick={() => buyItem(g)} style={btnAction}>КУПИТЬ</button>
              </div>
            ))}
          </div>
        )}

        {/* СВЯЗЬ (ЧАТ + РЕПОРТЫ) */}
        {activeTab === "chat" && (
          <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
            <div style={{ width: '250px' }}>
              <input placeholder="Поиск по ID" onChange={e => setSearchId(e.target.value)} style={{...inputStyle, marginBottom:'10px'}} />
              <button onClick={async () => {
                const {data} = await supabase.from('profiles').select('*').eq('id', searchId).single();
                setFoundUser(data);
              }} style={btnAction}>НАЙТИ</button>
              
              {foundUser && (
                <div style={{ marginTop: '10px', padding: '10px', background: THEME.card, borderRadius: '10px' }}>
                  {foundUser.username} 
                  <Flag size={14} onClick={() => sendReport(foundUser.id)} style={{ marginLeft: '10px', cursor: 'pointer', color: THEME.red }} />
                </div>
              )}

              <h4 style={{ color: THEME.muted }}>ДРУЗЬЯ</h4>
              {friends.map(f => (
                <div key={f.id} onClick={() => setSelectedChat(f)} style={{ padding: '10px', cursor: 'pointer', background: selectedChat?.id === f.id ? THEME.border : 'none', borderRadius: '10px' }}>{f.username}</div>
              ))}
            </div>
            
            <div style={{ flex: 1, background: THEME.card, borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
               {selectedChat ? (
                 <>
                   <div style={{ flex: 1, overflowY: 'auto' }}>
                     {messages.map((m, i) => (
                       <div key={i} style={{ textAlign: m.sender_id === profile.id ? 'right' : 'left', marginBottom: '10px' }}>
                         <span style={{ background: m.sender_id === profile.id ? THEME.accent : THEME.sidebar, padding: '8px 12px', borderRadius: '12px' }}>{m.text}</span>
                       </div>
                     ))}
                   </div>
                   {selectedChat.id !== "spy" && (
                     <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                       <input value={msgInput} onChange={e => setMsgInput(e.target.value)} style={inputStyle} />
                       <button onClick={() => {
                         supabase.from('messages').insert([{ sender_id: profile.id, receiver_id: selectedChat.id, text: msgInput }]);
                         setMessages([...messages, { sender_id: profile.id, text: msgInput }]);
                         setMsgInput("");
                       }} style={btnAction}>ОТПРАВИТЬ</button>
                     </div>
                   )}
                 </>
               ) : <p>Выберите чат</p>}
            </div>
          </div>
        )}

        {/* АДМИНКА С РЕПОРТАМИ */}
        {activeTab === "admin" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: THEME.card, padding: '20px', borderRadius: '20px' }}>
              <h3>ЖАЛОБЫ (REPORTS)</h3>
              {reports.map(r => (
                <div key={r.id} style={{ borderBottom: `1px solid ${THEME.border}`, padding: '10px 0' }}>
                  <div style={{ fontSize: '12px' }}>От: <b>{r.reporter?.username}</b> на: <b>{r.target?.username}</b></div>
                  <div style={{ color: THEME.gold }}>"{r.reason}"</div>
                  <button onClick={() => spyOnChat(r.reporter_id, r.target_id)} style={{ marginTop: '5px', fontSize: '10px', background: THEME.accent, border: 'none', color: '#fff', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}>
                    <Eye size={12} /> СМОТРЕТЬ ЧАТ
                  </button>
                </div>
              ))}
            </div>
            
            <div style={{ background: THEME.card, padding: '20px', borderRadius: '20px' }}>
              <h3>НОВЫЙ ТОВАР</h3>
              <input placeholder="Название" id="gn" style={inputStyle} />
              <input placeholder="URL GIF" id="gu" style={inputStyle} />
              <input placeholder="Цена" id="gp" style={inputStyle} />
              <button onClick={async () => {
                const name = (document.getElementById('gn') as HTMLInputElement).value;
                const url = (document.getElementById('gu') as HTMLInputElement).value;
                const price = (document.getElementById('gp') as HTMLInputElement).value;
                await supabase.from('gifts').insert([{ name, image_url: url, price: parseInt(price) }]);
                alert("Товар добавлен!");
                loadStore();
              }} style={{...btnAction, marginTop:'10px'}}>ОПУБЛИКОВАТЬ</button>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}

// Помощники стилей
const btnTab = (active: boolean) => ({
  background: active ? '#111' : 'none', border: 'none', color: active ? '#fff' : '#777', padding: '12px', borderRadius: '12px', textAlign: 'left' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', width: '100%'
});
const inputStyle = { width: '100%' as const, background: '#000', border: `1px solid ${THEME.border}`, color: '#fff', padding: '10px', borderRadius: '10px', marginBottom: '5px' };
const btnAction = { background: '#fff', color: '#000', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' as const, width: '100%' as const };

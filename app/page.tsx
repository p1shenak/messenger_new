"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

// Выносим иконки отдельно для стабильности типов
const { 
  UserCircle, Store, MessageSquare, ShieldAlert, CheckCircle2, 
  Ban, Trash2, Edit3, ImageIcon, Sparkles, UserPlus, Send, 
  PlusCircle, ShoppingBag, Tag, Search, X, Lock, Hammer 
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
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
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
      if (prof?.banned_until && new Date(prof.banned_until) > new Date()) {
        prof.is_blocked = true;
      }
      setProfile(prof);
      if (prof) {
        loadInventory(prof.id);
        loadFriends(prof.id);
        loadStore();
        loadMarket();
        if (prof.is_admin) loadAllUsers();
      }
    }
  }

  const loadInventory = async (uid: string) => {
    const { data } = await supabase.from('inventory').select('*, gifts(*)').eq('user_id', uid);
    setInventory(data || []);
  };

  const loadStore = async () => {
    const { data } = await supabase.from('gifts').select('*').order('created_at', { ascending: false });
    setStoreGifts(data || []);
  };

  const loadMarket = async () => {
    const { data } = await supabase.from('inventory').select('*, gifts(*), profiles(username)').eq('is_on_sale', true);
    setMarketItems(data || []);
  };

  const loadFriends = async (uid: string) => {
    const { data } = await supabase.from('friends').select('*, profiles!friends_friend_id_fkey(*)').eq('user_id', uid);
    setFriends(data?.map(f => f.profiles) || []);
  };

  const loadAllUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    setAllUsers(data || []);
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
    const msg = { sender_id: profile.id, receiver_id: selectedChat.id, text: msgInput };
    await supabase.from('messages').insert([msg]);
    setMessages([...messages, { ...msg, created_at: new Date().toISOString() }]);
    setMsgInput("");
  };

  const createItem = async () => {
    await supabase.from('gifts').insert([newGift]);
    alert("Товар создан!");
    loadStore();
  };

  const banUser = async (uid: string) => {
    const type = prompt("1 - 10 мин, 2 - 1 час, 3 - Навсегда");
    let until = null;
    if (type === "1") until = new Date(Date.now() + 10 * 60000).toISOString();
    if (type === "2") until = new Date(Date.now() + 60 * 60000).toISOString();
    if (type === "3") until = new Date(Date.now() + 100 * 365 * 24 * 60 * 60000).toISOString();
    await supabase.from('profiles').update({ status: 'Banned', banned_until: until }).eq('id', uid);
    loadAllUsers();
  };

  const sellItem = async (invId: string) => {
    const price = prompt("Цена продажи (CR):");
    if (price) {
      await supabase.from('inventory').update({ is_on_sale: true, sale_price: parseInt(price) }).eq('id', invId);
      loadInventory(profile.id);
      loadMarket();
    }
  };

  const buyFromStore = async (gift: any) => {
    if (profile.balance < gift.price) return alert("Недостаточно кредитов");
    const nftNum = gift.is_nft ? (gift.current_supply || 0) + 1 : null;
    await supabase.from('profiles').update({ balance: profile.balance - gift.price }).eq('id', profile.id);
    await supabase.from('inventory').insert([{ 
      user_id: profile.id, 
      gift_id: gift.id, 
      nft_number: nftNum,
      metadata: gift.is_nft ? { bg: '#'+Math.floor(Math.random()*16777215).toString(16) } : {}
    }]);
    if (gift.is_nft) await supabase.from('gifts').update({ current_supply: nftNum }).eq('id', gift.id);
    alert("Куплено!");
    checkUser();
  };

  if (!mounted) return null;

  if (profile?.is_blocked) return (
    <div style={{background:'#000', height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:THEME.red}}>
      <Lock size={64} />
      <h1>ACCOUNT_LOCKED</h1>
      <p>Разблокировка: {new Date(profile.banned_until).toLocaleString()}</p>
    </div>
  );

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      <nav style={{ width: '260px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: THEME.accent, letterSpacing: '2px', marginBottom: '30px' }}>VOID_OS</h2>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={18}/> ПРОФИЛЬ</button>
          <button onClick={() => setActiveTab("chat")} style={btnTab(activeTab === "chat")}><MessageSquare size={18}/> СВЯЗЬ</button>
          <button onClick={() => setActiveTab("store")} style={btnTab(activeTab === "store")}><ShoppingBag size={18}/> МАГАЗИН</button>
          <button onClick={() => setActiveTab("market")} style={btnTab(activeTab === "market")}><Tag size={18}/> РЫНОК NFT</button>
          {profile?.is_admin && (
            <button onClick={() => setActiveTab("admin")} style={{ ...btnTab(activeTab === "admin"), color: THEME.red, marginTop: '20px' } as any}><ShieldAlert size={18}/> АДМИНКА</button>
          )}
        </div>
        <div style={{ background: THEME.card, padding: '15px', borderRadius: '12px', fontSize: '12px', border: `1px solid ${THEME.border}` }}>
          <div style={{fontWeight:'bold'}}>{profile?.username}</div>
          <div style={{color: THEME.gold}}>{profile?.balance} CR</div>
        </div>
      </nav>

      <section style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {activeTab === "profile" && (
          <div>
            <div style={{ height: '180px', background: `url(${profile?.banner_url || ''})`, backgroundColor: '#111', backgroundSize: 'cover', borderRadius: '20px', position: 'relative', border: `1px solid ${THEME.border}` }}>
              <img src={profile?.avatar_url || ''} style={{ width: '80px', height: '80px', borderRadius: '50%', border: `4px solid ${THEME.bg}`, position: 'absolute', bottom: '-40px', left: '30px', objectFit: 'cover', background: '#222' }} alt=""/>
            </div>
            <div style={{ marginTop: '50px', marginLeft: '30px' }}>
              <h2>{profile?.username} {profile?.is_admin && <CheckCircle2 size={18} color={THEME.accent} style={{display:'inline'}}/>}</h2>
              <h3 style={{marginTop: '30px', fontSize: '14px', color: THEME.muted}}>ИНВЕНТАРЬ</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
                {inventory.map(i => (
                  <div key={i.id} style={{ background: i.metadata?.bg || THEME.card, padding: '10px', borderRadius: '12px', textAlign: 'center', border: `1px solid ${THEME.border}` }}>
                    <img src={i.gifts?.image_url} style={{ width: '100%', height: '70px', objectFit: 'contain' }} alt=""/>
                    <div style={{fontSize:'10px', margin:'5px 0'}}>{i.gifts?.name}</div>
                    {i.nft_number && <div style={{fontSize:'9px', opacity:0.5}}>#{i.nft_number}</div>}
                    {!i.is_on_sale && <button onClick={() => sellItem(i.id)} style={{fontSize:'9px', cursor:'pointer', background:'none', color:THEME.gold, border:`1px solid ${THEME.gold}`, borderRadius:'4px', padding:'2px 5px', marginTop:'5px'}}>ПРОДАТЬ</button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
            <div style={{ width: '250px', borderRight: `1px solid ${THEME.border}` }}>
              <h3 style={{fontSize:'12px', color:THEME.muted, marginBottom:'10px'}}>ДРУЗЬЯ</h3>
              {friends.map(f => (
                <div key={f.id} onClick={() => openChat(f)} style={{ padding: '12px', borderRadius: '10px', background: selectedChat?.id === f.id ? THEME.card : 'none', cursor: 'pointer', marginBottom:'5px' }}>{f.username}</div>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {selectedChat ? (
                <>
                  <div style={{paddingBottom:'10px', borderBottom:`1px solid ${THEME.border}`, fontWeight:'bold'}}>{selectedChat.username}</div>
                  <div style={{flex: 1, overflowY: 'auto', padding:'20px 0'}}>
                    {messages.map((m, idx) => (
                      <div key={idx} style={{ textAlign: m.sender_id === profile.id ? 'right' : 'left', marginBottom: '10px' }}>
                        <span style={{ padding: '8px 12px', borderRadius: '12px', background: m.sender_id === profile.id ? THEME.accent : THEME.card, fontSize: '14px', display: 'inline-block' }}>{m.text}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex', gap:'10px'}}>
                    <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} style={inputStyle} placeholder="Текст..."/>
                    <button onClick={sendMessage} style={{background:THEME.accent, border:'none', color:'#fff', padding:'10px 20px', borderRadius:'10px', cursor:'pointer'}}><Send size={18}/></button>
                  </div>
                </>
              ) : <div style={{margin:'auto', color:THEME.muted}}>Выберите чат</div>}
            </div>
          </div>
        )}

        {activeTab === "store" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {storeGifts.map(g => (
              <div key={g.id} style={{ background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
                <img src={g.image_url} style={{ width: '100%', height: '120px', objectFit: 'contain' }} alt=""/>
                <div style={{fontWeight:'bold', marginTop:'10px'}}>{g.name}</div>
                <div style={{fontSize:'11px', color:THEME.muted}}>{g.is_nft ? `NFT: ${g.current_supply || 0}/${g.max_supply}` : 'Подарок (∞)'}</div>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:'15px', alignItems:'center'}}>
                  <span style={{color:THEME.gold}}>{g.price} CR</span>
                  <button onClick={() => buyFromStore(g)} style={btnAction}>КУПИТЬ</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "market" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {marketItems.map(m => (
              <div key={m.id} style={{ background: m.metadata?.bg || THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
                <img src={m.gifts?.image_url} style={{ width: '100%', height: '120px', objectFit: 'contain' }} alt=""/>
                <div style={{fontWeight:'bold', marginTop:'10px'}}>{m.gifts?.name} #{m.nft_number}</div>
                <div style={{fontSize:'10px', opacity:0.7}}>От: {m.profiles?.username}</div>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:'15px', alignItems:'center'}}>
                  <span style={{color:THEME.gold}}>{m.sale_price} CR</span>
                  {m.user_id !== profile.id && <button onClick={() => alert("Система покупки в разработке")} style={btnAction}>КУПИТЬ</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "admin" && (
          <div style={{display:'flex', gap:'40px'}}>
            <div style={{flex: 1}}>
              <h3>СОЗДАТЬ ТОВАР</h3>
              <div style={{display:'flex', flexDirection:'column', gap:'10px', background:THEME.card, padding:'20px', borderRadius:'15px'}}>
                <input placeholder="Название" onChange={e=>setNewGift({...newGift, name: e.target.value})} style={inputStyle}/>
                <input placeholder="URL Картинки" onChange={e=>setNewGift({...newGift, image_url: e.target.value})} style={inputStyle}/>
                <input type="number" placeholder="Цена" onChange={e=>setNewGift({...newGift, price: parseInt(e.target.value)})} style={inputStyle}/>
                <label style={{fontSize:'12px'}}><input type="checkbox" onChange={e=>setNewGift({...newGift, is_nft: e.target.checked})}/> Это NFT</label>
                {newGift.is_nft && <input type="number" placeholder="Лимит выпуска" onChange={e=>setNewGift({...newGift, max_supply: parseInt(e.target.value)})} style={inputStyle}/>}
                <button onClick={createItem} style={{background:THEME.success, border:'none', color:'#fff', padding:'12px', borderRadius:'10px', cursor:'pointer', fontWeight:'bold'}}>ОПУБЛИКОВАТЬ</button>
              </div>
            </div>
            <div style={{flex: 1}}>
              <h3>ПОЛЬЗОВАТЕЛИ</h3>
              {allUsers.map(u => (
                <div key={u.id} style={{padding:'12px', background:THEME.card, borderRadius:'10px', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', border:`1px solid ${THEME.border}`}}>
                  <span style={{fontSize:'13px'}}>{u.username}</span>
                  <div style={{display:'flex', gap:'8px'}}>
                    <button onClick={() => banUser(u.id)} style={{background:THEME.red, border:'none', color:'#fff', padding:'8px', borderRadius:'8px', cursor:'pointer'}}><Ban size={14}/></button>
                    <button onClick={() => confirm("Удалить пользователя?") && supabase.from('profiles').delete().eq('id', u.id)} style={{background:'#222', border:'none', color:'#fff', padding:'8px', borderRadius:'8px', cursor:'pointer'}}><Trash2 size={14}/></button>
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

// Функции стилей для предотвращения ошибок TS
function btnTab(active: boolean): React.CSSProperties {
  return {
    background: active ? '#111' : 'none',
    border: 'none',
    color: active ? '#fff' : '#777',
    padding: '12px',
    borderRadius: '10px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    fontWeight: 'bold',
    transition: '0.2s'
  };
}

const inputStyle: React.CSSProperties = { 
  width: '100%', 
  background: '#000', 
  border: `1px solid ${THEME.border}`, 
  color: '#fff', 
  padding: '12px', 
  borderRadius: '10px',
  outline: 'none'
};

const btnAction: React.CSSProperties = { 
  background: '#fff', 
  color: '#000', 
  border: 'none', 
  padding: '8px 16px', 
  borderRadius: '8px', 
  fontWeight: 'bold', 
  cursor: 'pointer', 
  fontSize: '11px' 
};

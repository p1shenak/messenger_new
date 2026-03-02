"use client";

import { useState, useEffect } from "react";
import { 
  LayoutGrid, UserCircle, ShieldAlert, Coins, Send, LogIn, LogOut, 
  Palette, Check, LoaderCircle, Zap, Lock, ShieldCheck, Gavel, 
  UserPlus, Users, Gift, Image as ImageIcon, ShoppingBag, Search
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#555', accent: '#2563eb', gold: '#eab308', red: '#ef4444'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Состояния для мессенджера
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [searchId, setSearchId] = useState("");
  const [msg, setMsg] = useState("");

  // Состояния для магазина и NFT
  const [marketGifts, setMarketGifts] = useState<any[]>([]);
  const [myGifts, setMyGifts] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      let { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
      loadFriends(user.id);
      loadGifts(user.id);
    }
    setLoading(false);
  }

  const loadFriends = async (uid: string) => {
    const { data } = await supabase.from('friends').select('*, profiles!friend_id(*)').eq('user_id', uid);
    setFriends(data || []);
  };

  const loadGifts = async (uid: string) => {
    const { data: market } = await supabase.from('gifts').select('*').eq('on_sale', true);
    const { data: mine } = await supabase.from('gifts').select('*').eq('owner_id', uid);
    setMarketGifts(market || []);
    setMyGifts(mine || []);
  };

  // --- ЛОГИКА ДРУЗЕЙ ---
  const addFriend = async () => {
    if (!searchId || searchId === user.id) return alert("Неверный ID");
    const { error } = await supabase.from('friends').insert([{ user_id: user.id, friend_id: searchId, status: 'pending' }]);
    if (error) alert("Ошибка или уже добавлен");
    else alert("Запрос отправлен");
  };

  // --- ЛОГИКА NFT ---
  const createNFT = async () => {
    const url = prompt("Вставьте URL картинки для NFT:");
    const name = prompt("Название вашего NFT:");
    if (!url || !name) return;

    const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
    const { error } = await supabase.from('gifts').insert([{
      owner_id: user.id,
      creator_id: user.id,
      name,
      image_url: url,
      bg_color: randomColor,
      is_nft: true,
      price: 100
    }]);
    if (!error) { alert("NFT Создан и выставлен на рынок!"); loadGifts(user.id); }
  };

  const buyGift = async (gift: any) => {
    if (profile.balance < gift.price) return alert("Недостаточно кредитов");
    await supabase.from('profiles').update({ balance: profile.balance - gift.price }).eq('id', user.id);
    await supabase.from('gifts').update({ owner_id: user.id, on_sale: false }).eq('id', gift.id);
    alert("Покупка успешна!");
    checkUser();
  };

  if (!mounted || loading) return <div style={{background:'#000', height:'100vh'}} />;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: THEME.accent }}>VOID_OS</h1>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button onClick={() => setActiveTab("chat")} style={{ background: activeTab === "chat" ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18} /> Мессенджер
          </button>
          <button onClick={() => setActiveTab("market")} style={{ background: activeTab === "market" ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={18} /> Маркет & NFT
          </button>
          <button onClick={() => setActiveTab("profile")} style={{ background: activeTab === "profile" ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCircle size={18} /> Моя Нода
          </button>
        </div>

        {profile && (
          <div style={{ background: THEME.card, padding: '15px', borderRadius: '12px', border: `1px solid ${THEME.border}` }}>
            <div style={{ fontSize: '12px', color: THEME.gold, fontWeight: 'bold', marginBottom: '5px' }}>{profile.balance.toFixed(2)} CREDITS</div>
            <div style={{ fontSize: '14px' }}>{profile.username}</div>
          </div>
        )}
      </nav>

      {/* CONTENT */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000' }}>
        
        {/* TAB: CHAT */}
        {activeTab === "chat" && (
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ width: '300px', borderRight: `1px solid ${THEME.border}`, padding: '20px' }}>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
                <input placeholder="Поиск по ID..." value={searchId} onChange={e => setSearchId(e.target.value)} style={{ background: '#111', border: `1px solid ${THEME.border}`, color: '#fff', padding: '8px', borderRadius: '5px', flex: 1 }} />
                <button onClick={addFriend} style={{ background: THEME.accent, border: 'none', color: '#fff', padding: '8px', borderRadius: '5px' }}><UserPlus size={18} /></button>
              </div>
              <p style={{ fontSize: '12px', color: THEME.muted, marginBottom: '10px' }}>ДРУЗЬЯ</p>
              {friends.map(f => (
                <div key={f.id} onClick={() => f.status === 'accepted' && setSelectedFriend(f.profiles)} style={{ padding: '10px', borderRadius: '8px', cursor: 'pointer', background: selectedFriend?.id === f.friend_id ? '#111' : 'transparent', opacity: f.status === 'pending' ? 0.5 : 1 }}>
                  {f.profiles?.username} {f.status === 'pending' && "(ожидание)"}
                </div>
              ))}
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {selectedFriend ? (
                <>
                  <div style={{ padding: '20px', borderBottom: `1px solid ${THEME.border}`, fontWeight: 'bold' }}>{selectedFriend.username}</div>
                  <div style={{ flex: 1, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.muted }}>
                    <Lock size={16} style={{ marginRight: '10px' }} /> Сообщения зашифрованы
                  </div>
                  <div style={{ padding: '20px', display: 'flex', gap: '10px' }}>
                    <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Ваше сообщение..." style={{ flex: 1, background: THEME.card, border: `1px solid ${THEME.border}`, color: '#fff', padding: '15px', borderRadius: '12px' }} />
                    <button style={{ background: THEME.accent, border: 'none', color: '#fff', padding: '0 25px', borderRadius: '12px' }}><Send size={20} /></button>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.muted }}>
                  Выберите друга для начала сессии
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: MARKET */}
        {activeTab === "market" && (
          <div style={{ padding: '40px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <h2>BLACK_MARKET</h2>
              <button onClick={createNFT} style={{ background: THEME.gold, color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ImageIcon size={18} /> СОЗДАТЬ NFT
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {marketGifts.map(g => (
                <div key={g.id} style={{ background: THEME.card, borderRadius: '15px', overflow: 'hidden', border: `1px solid ${THEME.border}` }}>
                  <div style={{ height: '150px', background: g.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={g.image_url} alt="gift" style={{ maxWidth: '80%', maxHeight: '80%', borderRadius: '10px' }} />
                  </div>
                  <div style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 'bold' }}>{g.name}</div>
                    <div style={{ color: THEME.gold, fontSize: '14px', marginBottom: '10px' }}>{g.price} CR</div>
                    <button onClick={() => buyGift(g)} style={{ width: '100%', padding: '8px', background: '#fff', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>КУПИТЬ</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PROFILE */}
        {activeTab === "profile" && profile && (
          <div style={{ padding: '40px' }}>
            <div style={{ background: THEME.card, padding: '30px', borderRadius: '20px', border: `1px solid ${THEME.border}`, maxWidth: '600px' }}>
              <h2 style={{ marginBottom: '20px' }}>Личная Нода</h2>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: THEME.muted }}>ВАШ УНИКАЛЬНЫЙ ID (для друзей):</p>
                <code style={{ background: '#000', padding: '10px', display: 'block', borderRadius: '8px', border: `1px solid ${THEME.border}`, color: THEME.accent }}>{user.id}</code>
              </div>
              
              <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}><Gift size={20} /> КОЛЛЕКЦИЯ</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {myGifts.map(g => (
                  <div key={g.id} style={{ width: '80px', height: '80px', borderRadius: '10px', background: g.bg_color, border: `2px solid ${THEME.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }} title={g.name}>
                    <img src={g.image_url} style={{ width: '70%', borderRadius: '5px' }} />
                    {g.is_nft && <div style={{ position: 'absolute', top: -5, right: -5, background: THEME.gold, color: '#000', fontSize: '8px', padding: '2px 4px', borderRadius: '4px' }}>NFT</div>}
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

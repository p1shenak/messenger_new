"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, Coins, Send, LogOut, Zap, Lock, 
  UserPlus, Users, Gift, Image as ImageIcon, ShoppingBag, Box, Check, X, Store
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#555', accent: '#2563eb', gold: '#eab308', red: '#ef4444', green: '#22c55e'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [officialStore, setOfficialStore] = useState<any[]>([]);
  const [nftMarket, setNftMarket] = useState<any[]>([]);
  const [myGifts, setMyGifts] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, [mounted]);

  async function checkUser() {
    const supabase = createClient();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      let { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (!prof) {
        const { data: newProf } = await supabase.from('profiles').insert([{ id: user.id, username: user.user_metadata?.username || "VoidUser", balance: 5000 }]).select().single();
        setProfile(newProf);
      } else setProfile(prof);
      loadData(user.id);
    }
    setLoading(false);
  }

  const loadData = async (uid: string) => {
    const supabase = createClient();
    if (!supabase) return;
    
    // Загрузка друзей (принятых)
    const { data: f } = await supabase.from('friends').select('*, profiles!friend_id(*)').eq('user_id', uid).eq('status', 'accepted');
    // Загрузка входящих заявок
    const { data: req } = await supabase.from('friends').select('*, profiles!user_id(*)').eq('friend_id', uid).eq('status', 'pending');
    
    // Магазин (официальные) и Маркет (пользовательские NFT)
    const { data: store } = await supabase.from('gifts').select('*').eq('on_sale', true).eq('is_official', true);
    const { data: market } = await supabase.from('gifts').select('*').eq('on_sale', true).eq('is_official', false);
    
    const { data: mine } = await supabase.from('gifts').select('*').eq('owner_id', uid);

    setFriends(f || []);
    setPendingRequests(req || []);
    setOfficialStore(store || []);
    setNftMarket(market || []);
    setMyGifts(mine || []);
  };

  // --- ЛОГИКА ДРУЗЕЙ ---
  const sendFriendRequest = async () => {
    const id = prompt("Введите ID пользователя:");
    const supabase = createClient();
    if (!id || !supabase || id === user.id) return;
    await supabase.from('friends').insert([{ user_id: user.id, friend_id: id, status: 'pending' }]);
    alert("Заявка отправлена!");
  };

  const acceptFriend = async (requestId: string, senderId: string) => {
    const supabase = createClient();
    if (!supabase) return;
    // Принимаем заявку
    await supabase.from('friends').update({ status: 'accepted' }).eq('id', requestId);
    // Создаем обратную связь, чтобы оба видели друг друга в чате
    await supabase.from('friends').insert([{ user_id: user.id, friend_id: senderId, status: 'accepted' }]);
    loadData(user.id);
  };

  // --- ЛОГИКА МАГАЗИНА ---
  const createNFT = async () => {
    const name = prompt("Название NFT:");
    const url = prompt("URL картинки:");
    const supply = parseInt(prompt("Тираж (количество):") || "1");
    const supabase = createClient();
    if (!name || !url || !supabase) return;

    await supabase.from('gifts').insert([{
      owner_id: user.id, creator_id: user.id, name, image_url: url,
      bg_color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      is_nft: true, is_official: false, total_supply: supply, price: 500
    }]);
    alert("NFT выставлен на маркет!");
    loadData(user.id);
  };

  const handleAuth = async () => {
    const nick = prompt("НИК:");
    const pass = prompt("ПАРОЛЬ:");
    const supabase = createClient();
    if (!nick || !pass || !supabase) return;
    const email = `${nick.toLowerCase()}@void.network`;
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      await supabase.auth.signUp({ email, password: pass, options: { data: { username: nick } } });
      alert("Готово! Войдите.");
    } else window.location.reload();
  };

  const formatId = (id: number) => id.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (!mounted) return null;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      {/* SIDEBAR */}
      <nav style={{ width: '260px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap color={THEME.accent} fill={THEME.accent} size={22} />
          <span style={{ fontWeight: 'bold', fontSize: '18px', letterSpacing: '1px' }}>VOID_NET</span>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button onClick={() => setActiveTab("chat")} style={{ background: activeTab === 'chat' ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18}/> Чат {pendingRequests.length > 0 && <span style={{background:THEME.red, fontSize: '10px', padding: '2px 6px', borderRadius: '10px'}}>+</span>}
          </button>
          <button onClick={() => setActiveTab("store")} style={{ background: activeTab === 'store' ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Store size={18}/> Магазин
          </button>
          <button onClick={() => setActiveTab("market")} style={{ background: activeTab === 'market' ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={18}/> NFT Маркет
          </button>
          <button onClick={() => setActiveTab("profile")} style={{ background: activeTab === 'profile' ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCircle size={18}/> Профиль
          </button>
        </div>

        {user ? (
          <div style={{ background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
            <div style={{ color: THEME.gold, fontSize: '11px', fontWeight: 'bold' }}>{profile?.balance?.toFixed(0)} CREDITS</div>
            <div style={{ fontSize: '14px', margin: '5px 0', fontWeight: 'bold' }}>{profile?.username}</div>
            <button onClick={() => createClient()?.auth.signOut().then(() => window.location.reload())} style={{ color: THEME.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px' }}>LOGOUT</button>
          </div>
        ) : <button onClick={handleAuth} style={{ background: THEME.accent, color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>ВХОД</button>}
      </nav>

      {/* CONTENT */}
      <section style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        
        {/* ЧАТ И ДРУЗЬЯ */}
        {activeTab === "chat" && (
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ width: '250px' }}>
              <button onClick={sendFriendRequest} style={{ width: '100%', padding: '10px', background: '#111', color: '#fff', border: `1px solid ${THEME.border}`, borderRadius: '8px', cursor: 'pointer', marginBottom: '20px' }}>+ Добавить по ID</button>
              
              {pendingRequests.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '10px', color: THEME.gold, marginBottom: '10px' }}>ЗАЯВКИ</p>
                  {pendingRequests.map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#111', borderRadius: '8px', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px' }}>{r.profiles.username}</span>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <Check size={16} color={THEME.green} cursor="pointer" onClick={() => acceptFriend(r.id, r.user_id)} />
                        <X size={16} color={THEME.red} cursor="pointer" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ fontSize: '10px', color: THEME.muted, marginBottom: '10px' }}>СПИСОК КОНТАКТОВ</p>
              {friends.map(f => (
                <div key={f.id} onClick={() => setSelectedFriend(f.profiles)} style={{ padding: '12px', borderRadius: '10px', background: selectedFriend?.id === f.friend_id ? '#111' : 'transparent', cursor: 'pointer' }}>
                  {f.profiles.username}
                </div>
              ))}
            </div>

            <div style={{ flex: 1, height: '70vh', border: `1px solid ${THEME.border}`, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedFriend ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '20px', borderBottom: `1px solid ${THEME.border}`, fontWeight: 'bold' }}>{selectedFriend.username}</div>
                  <div style={{ flex: 1 }}></div>
                  <div style={{ padding: '20px', display: 'flex', gap: '10px' }}>
                    <input placeholder="Зашифрованное сообщение..." style={{ flex: 1, background: '#111', border: 'none', padding: '15px', borderRadius: '10px', color: '#fff' }} />
                    <button style={{ background: THEME.accent, border: 'none', padding: '0 20px', borderRadius: '10px', color: '#fff' }}><Send size={18}/></button>
                  </div>
                </div>
              ) : <div style={{ color: THEME.muted }}><Lock size={40} /></div>}
            </div>
          </div>
        )}

        {/* МАГАЗИН И МАРКЕТ */}
        {(activeTab === "store" || activeTab === "market") && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <h2>{activeTab === "store" ? "OFFICIAL_STORE" : "USER_MARKET"}</h2>
              {activeTab === "market" && <button onClick={createNFT} style={{ background: THEME.gold, color: '#000', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ СОЗДАТЬ NFT</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {(activeTab === "store" ? officialStore : nftMarket).map(g => (
                <div key={g.id} style={{ background: THEME.card, borderRadius: '20px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
                  <div style={{ height: '150px', background: g.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <img src={g.image_url} style={{ width: '65%' }} />
                    {g.is_nft && <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#000', fontSize: '9px', padding: '3px 7px', borderRadius: '5px', border: `1px solid ${THEME.gold}`, color: THEME.gold }}>#{formatId(g.nft_serial)}</div>}
                  </div>
                  <div style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{g.name}</div>
                    <div style={{ fontSize: '11px', color: THEME.muted, marginTop: '5px' }}><Box size={10} style={{marginRight: '5px'}}/> Тираж: {g.total_supply} шт.</div>
                    <div style={{ color: THEME.gold, fontWeight: 'bold', marginTop: '10px' }}>{g.price} CR</div>
                    <button style={{ width: '100%', marginTop: '10px', background: '#fff', color: '#000', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>КУПИТЬ</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ПРОФИЛЬ */}
        {activeTab === "profile" && (
          <div style={{ maxWidth: '600px', background: THEME.card, padding: '30px', borderRadius: '25px', border: `1px solid ${THEME.border}` }}>
            <h2 style={{ marginBottom: '20px' }}>Личный узел</h2>
            <p style={{ fontSize: '10px', color: THEME.muted }}>PUBLIC_ID:</p>
            <code style={{ display: 'block', background: '#000', padding: '12px', borderRadius: '10px', color: THEME.accent, margin: '10px 0 30px' }}>{user?.id}</code>
            
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Gift size={20} color={THEME.gold}/> КОЛЛЕКЦИЯ</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              {myGifts.map(g => (
                <div key={g.id} style={{ aspectRatio: '1/1', background: g.bg_color, borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <img src={g.image_url} style={{ width: '70%' }} />
                  <div style={{ position: 'absolute', bottom: '5px', fontSize: '8px', background: '#000', padding: '2px 5px', borderRadius: '5px' }}>#{formatId(g.nft_serial)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

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
    const { data: f } = await supabase.from('friends').select('*, profiles!friend_id(*)').eq('user_id', uid).eq('status', 'accepted');
    const { data: req } = await supabase.from('friends').select('*, profiles!user_id(*)').eq('friend_id', uid).eq('status', 'pending');
    const { data: store } = await supabase.from('gifts').select('*').eq('on_sale', true).eq('is_official', true);
    const { data: market } = await supabase.from('gifts').select('*').eq('on_sale', true).eq('is_official', false);
    const { data: mine } = await supabase.from('gifts').select('*').eq('owner_id', uid);

    setFriends(f || []);
    setPendingRequests(req || []);
    setOfficialStore(store || []);
    setNftMarket(market || []);
    setMyGifts(mine || []);
  };

  const handleAuth = async () => {
    const nick = prompt("ВВЕДИТЕ НИК:");
    const pass = prompt("ВВЕДИТЕ ПАРОЛЬ (от 6 знаков):");
    const supabase = createClient();
    if (!nick || !pass || !supabase) return;
    const email = `${nick.toLowerCase()}@void.network`;

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (loginError) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password: pass, options: { data: { username: nick } } });
      if (signUpError) alert("ОШИБКА: " + signUpError.message);
      else alert("АККАУНТ СОЗДАН! Нажми ВХОД еще раз.");
    } else window.location.reload();
  };

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

  const acceptFriend = async (requestId: string, senderId: string) => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('friends').update({ status: 'accepted' }).eq('id', requestId);
    await supabase.from('friends').insert([{ user_id: user.id, friend_id: senderId, status: 'accepted' }]);
    loadData(user.id);
  };

  if (!mounted) return null;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      {/* SIDEBAR */}
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Zap color={THEME.accent} fill={THEME.accent} size={24} />
          <span style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '2px' }}>VOID_NET</span>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setActiveTab("chat")} style={{ background: activeTab === 'chat' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={20}/> КАНАЛ СВЯЗИ
          </button>
          <button onClick={() => setActiveTab("store")} style={{ background: activeTab === 'store' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Store size={20}/> МАГАЗИН
          </button>
          <button onClick={() => setActiveTab("market")} style={{ background: activeTab === 'market' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShoppingBag size={20}/> NFT МАРКЕТ
          </button>
          <button onClick={() => setActiveTab("profile")} style={{ background: activeTab === 'profile' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserCircle size={20}/> МОЯ НОДА
          </button>
        </div>

        {user ? (
          <div style={{ background: THEME.card, padding: '20px', borderRadius: '18px', border: `1px solid ${THEME.border}` }}>
            <div style={{ color: THEME.gold, fontSize: '12px', fontWeight: 'bold' }}>{profile?.balance?.toFixed(0)} CREDITS</div>
            <div style={{ fontSize: '15px', margin: '8px 0', fontWeight: 'bold', color: '#fff' }}>{profile?.username}</div>
            <button onClick={() => createClient()?.auth.signOut().then(() => window.location.reload())} style={{ color: THEME.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: 0 }}>ВЫЙТИ ИЗ СЕТИ</button>
          </div>
        ) : (
          <button onClick={handleAuth} style={{ background: THEME.accent, color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>ВХОД В СИСТЕМУ</button>
        )}
      </nav>

      {/* CONTENT AREA */}
      <section style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        {!user && activeTab !== "profile" ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: THEME.muted }}>
             <Lock size={60} style={{ marginBottom: '20px' }} />
             <p style={{ fontSize: '18px' }}>АВТОРИЗУЙТЕСЬ ДЛЯ ДОСТУПА К МОДУЛЯМ</p>
          </div>
        ) : (
          <>
            {/* Вкладка Магазин */}
            {activeTab === "store" && (
              <div>
                <h2 style={{ marginBottom: '30px', letterSpacing: '2px' }}>OFFICIAL_ACCESS_STORE</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px' }}>
                  {officialStore.map(g => (
                    <div key={g.id} style={{ background: THEME.card, borderRadius: '22px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
                      <div style={{ height: '160px', background: g.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={g.image_url} style={{ width: '60%' }} />
                      </div>
                      <div style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 'bold' }}>{g.name}</div>
                        <div style={{ color: THEME.gold, fontWeight: 'bold', marginTop: '12px', fontSize: '18px' }}>{g.price} CR</div>
                        <button style={{ width: '100%', marginTop: '15px', background: '#fff', color: '#000', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>КУПИТЬ</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Вкладка Профиль */}
            {activeTab === "profile" && (
              <div style={{ maxWidth: '700px' }}>
                <div style={{ background: THEME.card, padding: '40px', borderRadius: '30px', border: `1px solid ${THEME.border}` }}>
                  <h2 style={{ margin: '0 0 25px 0', letterSpacing: '1px' }}>Конфигурация Ноды</h2>
                  <p style={{ fontSize: '11px', color: THEME.muted, marginBottom: '8px' }}>PUBLIC_ID (ДЛЯ ДРУЗЕЙ):</p>
                  <code style={{ display: 'block', background: '#000', padding: '18px', borderRadius: '14px', border: `1px solid ${THEME.border}`, color: THEME.accent, fontSize: '14px', marginBottom: '40px' }}>{user?.id || "NOT_LOGGED_IN"}</code>
                  
                  <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}><Gift size={24} color={THEME.gold}/> КОЛЛЕКЦИЯ</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {myGifts.map(g => (
                      <div key={g.id} style={{ aspectRatio: '1/1', background: g.bg_color, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <img src={g.image_url} style={{ width: '75%' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Вкладки Чат и Маркет — добавь логику из предыдущего сообщения */}
          </>
        )}
      </section>
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  LayoutGrid, UserCircle, ShieldAlert, Coins, Send, LogOut, 
  Zap, Lock, ShieldCheck, Gavel, UserPlus, Users, Gift, 
  Image as ImageIcon, ShoppingBag, Hash, Box, Search 
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
  
  // Состояния данных
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [marketGifts, setMarketGifts] = useState<any[]>([]);
  const [myGifts, setMyGifts] = useState<any[]>([]);

  // Инициализация
  useEffect(() => {
    setMounted(true);
    const init = async () => {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (prof) {
          setProfile(prof);
          loadData(user.id);
        }
      }
      setLoading(false);
    };
    init();
  }, [mounted]);

  const loadData = async (uid: string) => {
    const supabase = createClient();
    if (!supabase) return;
    const { data: f } = await supabase.from('friends').select('*, profiles!friend_id(*)').eq('user_id', uid);
    const { data: g } = await supabase.from('gifts').select('*').eq('on_sale', true);
    const { data: mine } = await supabase.from('gifts').select('*').eq('owner_id', uid);
    setFriends(f || []);
    setMarketGifts(g || []);
    setMyGifts(mine || []);
  };

  // Форматирование ID (пример: 123,456)
  const formatNFTId = (id: number) => {
    return id.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Создание NFT с тиражом
  const handleCreateNFT = async () => {
    const supabase = createClient();
    const name = prompt("Название NFT:");
    const url = prompt("URL картинки:");
    const supply = parseInt(prompt("Количество в наличии (тираж):") || "1");
    if (!name || !url || !supabase) return;

    const { error } = await supabase.from('gifts').insert([{
      owner_id: user.id,
      creator_id: user.id,
      name,
      image_url: url,
      bg_color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      is_nft: true,
      price: supply > 10 ? 50 : 500,
      total_supply: supply,
      nft_serial: 1 // Первый в серии
    }]);

    if (!error) { alert("NFT выставлен!"); loadData(user.id); }
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
      alert("Нода создана. Войдите еще раз.");
    } else window.location.reload();
  };

  if (!mounted) return null;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap color={THEME.accent} />
          <span style={{ fontWeight: '900', letterSpacing: '2px' }}>VOID_NET</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setActiveTab("chat")} style={{ background: activeTab === 'chat' ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18} /> Сообщения
          </button>
          <button onClick={() => setActiveTab("market")} style={{ background: activeTab === 'market' ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={18} /> Маркет & NFT
          </button>
          <button onClick={() => setActiveTab("profile")} style={{ background: activeTab === 'profile' ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCircle size={18} /> Профиль
          </button>
        </div>

        {user ? (
          <div style={{ background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
            <div style={{ color: THEME.gold, fontWeight: 'bold', fontSize: '12px' }}>{profile?.balance?.toFixed(2)} CREDITS</div>
            <div style={{ fontSize: '14px', marginTop: '5px' }}>{profile?.username}</div>
          </div>
        ) : (
          <button onClick={handleAuth} style={{ background: THEME.accent, color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>ВХОД В СЕТЬ</button>
        )}
      </nav>

      {/* CONTENT */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ padding: '20px 40px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: THEME.muted, fontSize: '12px' }}>STATUS: ENCRYPTED // TAB: {activeTab.toUpperCase()}</span>
        </header>

        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          
          {/* MARKET TAB */}
          {activeTab === "market" && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
                <h2 style={{ letterSpacing: '2px' }}>STORE_FRONT</h2>
                <button onClick={handleCreateNFT} style={{ background: THEME.gold, color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ВЫПУСТИТЬ NFT</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {marketGifts.map(g => (
                  <div key={g.id} style={{ background: THEME.card, borderRadius: '20px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
                    <div style={{ height: '160px', background: g.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <img src={g.image_url} style={{ width: '70%', borderRadius: '10px' }} />
                      {g.is_nft && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#000', padding: '5px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', color: THEME.gold, border: `1px solid ${THEME.gold}` }}>
                           NFT #{formatNFTId(g.nft_serial)}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '20px' }}>
                      <div style={{ fontWeight: 'bold' }}>{g.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: THEME.muted, marginTop: '5px' }}>
                        <Box size={12} /> В наличии: {g.total_supply} шт.
                      </div>
                      <div style={{ color: THEME.gold, fontWeight: '900', marginTop: '15px', fontSize: '18px' }}>{g.price} CR</div>
                      <button style={{ width: '100%', marginTop: '15px', background: '#fff', color: '#000', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold' }}>КУПИТЬ</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div style={{ maxWidth: '600px' }}>
              <div style={{ background: THEME.card, padding: '30px', borderRadius: '25px', border: `1px solid ${THEME.border}` }}>
                <p style={{ fontSize: '10px', color: THEME.muted }}>NETWORK_NODE_ID</p>
                <code style={{ display: 'block', background: '#000', padding: '15px', borderRadius: '10px', margin: '10px 0 30px 0', border: `1px solid ${THEME.border}`, color: THEME.accent }}>{user?.id}</code>
                
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><Gift size={20} color={THEME.gold} /> ВАША КОЛЛЕКЦИЯ</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                  {myGifts.map(g => (
                    <div key={g.id} style={{ aspectRatio: '1/1', background: g.bg_color, borderRadius: '15px', border: g.is_nft ? `2px solid ${THEME.gold}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <img src={g.image_url} style={{ width: '70%' }} />
                      <div style={{ position: 'absolute', bottom: '5px', fontSize: '8px', background: '#000', padding: '2px 5px', borderRadius: '5px' }}>
                        #{formatNFTId(g.nft_serial)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
              <div style={{ textAlign: 'center' }}>
                <Lock size={48} style={{ marginBottom: '20px' }} />
                <p>ВЫБЕРИТЕ СОБЕСЕДНИКА В СПИСКЕ ДРУЗЕЙ</p>
              </div>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}

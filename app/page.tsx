"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, Send, Zap, Lock, Users, Gift, ShoppingBag, Store, Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#555', accent: '#2563eb', gold: '#eab308', red: '#ef4444'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [friends, setFriends] = useState<any[]>([]);
  const [officialStore, setOfficialStore] = useState<any[]>([]);
  const [nftMarket, setNftMarket] = useState<any[]>([]);
  const [myGifts, setMyGifts] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  async function checkUser() {
    const supabase = createClient();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      // Пытаемся найти профиль
      let { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      
      // Если профиля нет — создаем его принудительно
      if (!prof) {
        const { data: newProf, error: createError } = await supabase.from('profiles').insert([{ 
          id: user.id, 
          username: user.user_metadata?.username || "VoidUser", 
          balance: 5000 
        }]).select().single();
        
        if (createError) console.error("Ошибка создания профиля:", createError);
        setProfile(newProf);
      } else {
        setProfile(prof);
      }
      loadData(user.id);
    }
    setLoading(false);
  }

  const loadData = async (uid: string) => {
    const supabase = createClient();
    if (!supabase) return;
    const { data: store } = await supabase.from('gifts').select('*').eq('is_official', true);
    const { data: market } = await supabase.from('gifts').select('*').eq('is_official', false);
    const { data: mine } = await supabase.from('gifts').select('*').eq('owner_id', uid);
    setOfficialStore(store || []);
    setNftMarket(market || []);
    setMyGifts(mine || []);
  };

  const handleAuth = async () => {
    const nick = prompt("ВВЕДИТЕ НИК (только английские буквы):");
    const pass = prompt("ВВЕДИТЕ ПАРОЛЬ (минимум 6 символов):");
    const supabase = createClient();
    
    if (!nick || !pass || !supabase) return;
    const email = `${nick.toLowerCase()}@void.network`;

    setLoading(true);
    
    // 1. Пытаемся войти
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password: pass });

    if (loginError) {
      // 2. Если войти не вышло, пробуем регистрацию
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password: pass, 
        options: { data: { username: nick } } 
      });

      if (signUpError) {
        alert("ОШИБКА РЕГИСТРАЦИИ: " + signUpError.message);
      } else {
        alert("АККАУНТ СОЗДАН! Нажмите кнопку входа еще раз, чтобы авторизоваться.");
      }
    } else {
      window.location.reload();
    }
    setLoading(false);
  };

  if (!mounted) return null;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Zap color={THEME.accent} fill={THEME.accent} size={24} />
          <span style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '2px' }}>VOID_OS</span>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setActiveTab("chat")} style={{ background: activeTab === 'chat' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20}/> КАНАЛ СВЯЗИ
          </button>
          <button onClick={() => setActiveTab("store")} style={{ background: activeTab === 'store' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <div style={{ color: THEME.gold, fontSize: '12px', fontWeight: 'bold' }}>{profile?.balance?.toFixed(0)} CR</div>
            <div style={{ fontSize: '15px', margin: '8px 0', fontWeight: 'bold' }}>{profile?.username}</div>
            <button onClick={() => createClient()?.auth.signOut().then(() => window.location.reload())} style={{ color: THEME.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px' }}>ВЫЙТИ</button>
          </div>
        ) : (
          <button onClick={handleAuth} style={{ background: THEME.accent, color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? <Loader2 className="animate-spin" /> : "АВТОРИЗАЦИЯ"}
          </button>
        )}
      </nav>

      {/* CONTENT */}
      <section style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {activeTab === "profile" && (
          <div style={{ maxWidth: '600px' }}>
            <div style={{ background: THEME.card, padding: '30px', borderRadius: '25px', border: `1px solid ${THEME.border}` }}>
              <h2 style={{ marginBottom: '20px' }}>Конфигурация Профиля</h2>
              <p style={{ fontSize: '10px', color: THEME.muted }}>ID ВАШЕГО УЗЛА:</p>
              <code style={{ display: 'block', background: '#000', padding: '15px', borderRadius: '12px', border: `1px solid ${THEME.border}`, color: THEME.accent, margin: '10px 0 30px' }}>{user?.id || "НЕ АВТОРИЗОВАН"}</code>
              
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Gift size={22} color={THEME.gold}/> ВАША КОЛЛЕКЦИЯ</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                {myGifts.map(g => (
                  <div key={g.id} style={{ aspectRatio: '1/1', background: g.bg_color, borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={g.image_url} style={{ width: '70%' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(activeTab === "store" || activeTab === "market") && (
          <div>
            <h2 style={{ marginBottom: '30px' }}>{activeTab === "store" ? "МАГАЗИН ПОДАРКОВ" : "NFT МАРКЕТПЛЕЙС"}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {(activeTab === "store" ? officialStore : nftMarket).map(g => (
                <div key={g.id} style={{ background: THEME.card, borderRadius: '20px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
                  <div style={{ height: '150px', background: g.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={g.image_url} style={{ width: '60%' }} />
                  </div>
                  <div style={{ padding: '20px' }}>
                    <div style={{ fontWeight: 'bold' }}>{g.name}</div>
                    <div style={{ color: THEME.gold, fontWeight: 'bold', marginTop: '10px' }}>{g.price} CR</div>
                    <button style={{ width: '100%', marginTop: '15px', background: '#fff', color: '#000', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold' }}>КУПИТЬ</button>
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

"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, Zap, Lock, Users, Gift, ShoppingBag, Store, Loader2, Plus 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#555', accent: '#2563eb', gold: '#eab308'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [officialStore, setOfficialStore] = useState<any[]>([]);
  const [nftMarket, setNftMarket] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  async function checkUser() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      // Ищем профиль или создаем его
      let { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (!prof) {
        const { data: newProf } = await supabase.from('profiles').insert([{ 
          id: user.id, 
          username: user.user_metadata?.username || "VoidUser", 
          balance: 5000 
        }]).select().single();
        setProfile(newProf);
      } else {
        setProfile(prof);
      }
      loadData(supabase);
    }
    setLoading(false);
  }

  async function loadData(supabase: any) {
    const { data: store } = await supabase.from('gifts').select('*').eq('is_official', true);
    const { data: market } = await supabase.from('gifts').select('*').eq('is_official', false);
    setOfficialStore(store || []);
    setNftMarket(market || []);
  }

  const handleAuth = async () => {
    const supabase = createClient();
    if (!supabase) return alert("Ключи не найдены! Проверь Vercel.");

    const nick = prompt("НИК (ENG):");
    const pass = prompt("ПАРОЛЬ (6+):");
    if (!nick || !pass) return;

    const email = `${nick.toLowerCase()}@void.network`;
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: pass });

    if (loginError) {
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, password: pass, options: { data: { username: nick } } 
      });
      if (signUpError) alert(signUpError.message);
      else alert("Аккаунт создан! Нажми ВХОД еще раз.");
    } else {
      window.location.reload();
    }
  };

  if (!mounted) return null;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      {/* Боковая панель */}
      <nav style={{ width: '260px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap color={THEME.accent} fill={THEME.accent} size={22} />
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>VOID_NETWORK</span>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button onClick={() => setActiveTab("store")} style={{ background: activeTab === 'store' ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><Store size={18}/> МАГАЗИН</button>
          <button onClick={() => setActiveTab("market")} style={{ background: activeTab === 'market' ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><ShoppingBag size={18}/> NFT МАРКЕТ</button>
          <button onClick={() => setActiveTab("profile")} style={{ background: activeTab === 'profile' ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><UserCircle size={18}/> ПРОФИЛЬ</button>
        </div>

        {user ? (
          <div style={{ background: THEME.card, padding: '15px', borderRadius: '12px', border: `1px solid ${THEME.border}` }}>
            <div style={{ color: THEME.gold, fontSize: '11px', fontWeight: 'bold' }}>{profile?.balance} CR</div>
            <div style={{ fontSize: '14px', marginTop: '5px' }}>{profile?.username}</div>
            <button onClick={() => createClient()?.auth.signOut().then(() => window.location.reload())} style={{ color: THEME.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', marginTop: '10px' }}>ВЫЙТИ</button>
          </div>
        ) : (
          <button onClick={handleAuth} style={{ background: THEME.accent, color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>ВХОД</button>
        )}
      </nav>

      {/* Основной контент */}
      <section style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '20px', letterSpacing: '2px' }}>{activeTab.toUpperCase()}</h2>
        
        {activeTab === "profile" && (
          <div style={{ background: THEME.card, padding: '30px', borderRadius: '20px', border: `1px solid ${THEME.border}`, maxWidth: '600px' }}>
            <p style={{ fontSize: '10px', color: THEME.muted }}>ID ВАШЕГО УЗЛА:</p>
            <code style={{ display: 'block', background: '#000', padding: '10px', borderRadius: '8px', color: THEME.accent, margin: '10px 0' }}>{user?.id || "OFFLINE"}</code>
            <h3 style={{ marginTop: '20px' }}>КОЛЛЕКЦИЯ</h3>
            <div style={{ color: THEME.muted, fontSize: '12px', marginTop: '10px' }}>У вас пока нет подарков...</div>
          </div>
        )}

        {(activeTab === "store" || activeTab === "market") && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
            {(activeTab === "store" ? officialStore : nftMarket).length === 0 ? (
              <div style={{ color: THEME.muted }}>Список товаров пуст...</div>
            ) : (
              (activeTab === "store" ? officialStore : nftMarket).map(g => (
                <div key={g.id} style={{ background: THEME.card, borderRadius: '15px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
                  <div style={{ height: '120px', background: g.bg_color || '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={g.image_url} style={{ width: '50%' }} />
                  </div>
                  <div style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{g.name}</div>
                    <div style={{ color: THEME.gold, fontWeight: 'bold', marginTop: '5px' }}>{g.price} CR</div>
                    <button style={{ width: '100%', marginTop: '10px', background: '#fff', color: '#000', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>КУПИТЬ</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}

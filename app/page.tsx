"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, Zap, Lock, Users, Gift, ShoppingBag, Store, Send, MessageSquare, Plus, Loader2, LogOut
} from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#555', accent: '#2563eb', gold: '#eab308'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);

  // Инициализация клиента напрямую
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
      setUser(user);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      setProfile(prof);
      loadStore();
    }
    setLoading(false);
  }

  async function loadStore() {
    const { data } = await supabase.from('gifts').select('*').eq('is_official', true);
    setStoreGifts(data || []);
  }

  const handleAuth = async () => {
    const nick = prompt("НИК (ENG):");
    const pass = prompt("ПАРОЛЬ (6+ СИМВОЛОВ):");
    if (!nick || !pass) return;

    setAuthLoading(true);
    const email = `${nick.toLowerCase().trim()}@void.network`;

    // 1. Пытаемся войти
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email, password: pass,
    });

    if (signInError) {
      // 2. Если не вошли, регистрируем (РУЧНОЙ РЕЖИМ)
      const { error: signUpError } = await supabase.auth.signUp({
        email, password: pass,
        options: { data: { username: nick } }
      });

      if (signUpError) {
        alert("ОШИБКА: " + signUpError.message);
      } else {
        alert("АККАУНТ СОЗДАН! Теперь нажмите ВХОД еще раз для активации профиля.");
      }
    } else {
      // 3. После входа проверяем и создаем профиль вручную если его нет
      if (signInData.user) {
        const { data: existingProf } = await supabase.from('profiles').select('*').eq('id', signInData.user.id).maybeSingle();
        
        if (!existingProf) {
          await supabase.from('profiles').insert([
            { id: signInData.user.id, username: nick, balance: 5000 }
          ]);
        }
      }
      window.location.reload();
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!mounted) return null;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* ЛЕВАЯ ПАНЕЛЬ СИСТЕМЫ */}
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Zap color={THEME.accent} fill={THEME.accent} size={24} />
          <span style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '2px' }}>VOID_OS</span>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setActiveTab("chat")} style={{ background: activeTab === 'chat' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={20} color={activeTab === 'chat' ? THEME.accent : '#fff'}/> КАНАЛ СВЯЗИ
          </button>
          <button onClick={() => setActiveTab("store")} style={{ background: activeTab === 'store' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Store size={20} color={activeTab === 'store' ? THEME.accent : '#fff'}/> МАГАЗИН
          </button>
          <button onClick={() => setActiveTab("profile")} style={{ background: activeTab === 'profile' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserCircle size={20} color={activeTab === 'profile' ? THEME.accent : '#fff'}/> МОЯ НОДА
          </button>
        </div>

        {user ? (
          <div style={{ background: THEME.card, padding: '20px', borderRadius: '18px', border: `1px solid ${THEME.border}` }}>
            <div style={{ color: THEME.gold, fontSize: '12px', fontWeight: 'bold' }}>{profile?.balance || 0} CREDITS</div>
            <div style={{ fontSize: '15px', margin: '5px 0', fontWeight: 'bold' }}>{profile?.username || 'Loading...'}</div>
            <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: THEME.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', marginTop: '10px' }}>
              <LogOut size={12}/> ВЫЙТИ
            </button>
          </div>
        ) : (
          <button 
            disabled={authLoading}
            onClick={handleAuth} 
            style={{ background: THEME.accent, color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}
          >
            {authLoading ? "ПОДКЛЮЧЕНИЕ..." : "ВХОД В СИСТЕМУ"}
          </button>
        )}
      </nav>

      {/* ГЛАВНЫЙ ЭКРАН */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {!user ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: THEME.muted }}>
             <Lock size={60} style={{ marginBottom: '20px', opacity: 0.1 }} />
             <p style={{ fontSize: '12px', letterSpacing: '4px' }}>ACCESS_DENIED. ТРЕБУЕТСЯ АВТОРИЗАЦИЯ.</p>
          </div>
        ) : (
          <div style={{ padding: '40px', height: '100%', overflowY: 'auto' }}>
            
            {activeTab === "profile" && (
              <div style={{ maxWidth: '600px' }}>
                <h2 style={{ marginBottom: '30px', letterSpacing: '2px' }}>NODE_STATUS</h2>
                <div style={{ background: THEME.card, padding: '30px', borderRadius: '24px', border: `1px solid ${THEME.border}` }}>
                   <p style={{ fontSize: '10px', color: THEME.muted, marginBottom: '8px' }}>USER_ID_HASH:</p>
                   <code style={{ display: 'block', background: '#000', padding: '15px', borderRadius: '12px', border: `1px solid ${THEME.border}`, color: THEME.accent, marginBottom: '30px', fontSize: '12px', wordBreak: 'break-all' }}>{user.id}</code>
                   <h3 style={{ marginBottom: '15px', fontSize: '14px' }}>ИНВЕНТАРЬ_ОБЪЕКТОВ</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                      <div style={{ aspectRatio: '1/1', background: '#111', borderRadius: '12px', border: `1px dashed ${THEME.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.muted, fontSize: '10px' }}>EMPTY</div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === "store" && (
              <div>
                <h2 style={{ marginBottom: '30px', letterSpacing: '2px' }}>OFFICIAL_STORE</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px' }}>
                  {storeGifts.map(g => (
                    <div key={g.id} style={{ background: THEME.card, borderRadius: '20px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
                      <div style={{ height: '140px', background: g.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={g.image_url} style={{ width: '60px' }} alt="gift" />
                      </div>
                      <div style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{g.name}</div>
                        <div style={{ color: THEME.gold, fontWeight: 'bold', marginTop: '8px' }}>{g.price} CR</div>
                        <button style={{ width: '100%', marginTop: '15px', background: '#fff', color: '#000', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>КУПИТЬ</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "chat" && (
              <div style={{ display: 'flex', height: '100%', marginTop: '-40px', marginLeft: '-40px', marginRight: '-40px' }}>
                 <div style={{ width: '300px', borderRight: `1px solid ${THEME.border}`, padding: '40px 20px' }}>
                    <div style={{ fontSize: '12px', color: THEME.muted, marginBottom: '20px' }}>АКТИВНЫЕ_СВЯЗИ</div>
                    <div style={{ background: '#111', padding: '15px', borderRadius: '12px', color: THEME.muted, fontSize: '11px', textAlign: 'center' }}>
                      Поиск контактов зашифрован.
                    </div>
                 </div>
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#050505' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.muted }}>
                       <div style={{ textAlign: 'center' }}>
                          <MessageSquare size={40} style={{ marginBottom: '15px', opacity: 0.1 }} />
                          <p style={{ fontSize: '11px', letterSpacing: '2px' }}>ВЫБЕРИТЕ КАНАЛ ДЛЯ ПЕРЕДАЧИ СООБЩЕНИЙ</p>
                       </div>
                    </div>
                    <div style={{ padding: '30px', borderTop: `1px solid ${THEME.border}`, display: 'flex', gap: '15px' }}>
                       <input placeholder="Введите пакет данных..." style={{ flex: 1, background: THEME.card, border: `1px solid ${THEME.border}`, color: '#fff', padding: '15px', borderRadius: '15px', outline: 'none' }} />
                       <button style={{ background: THEME.accent, border: 'none', width: '50px', borderRadius: '15px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Send size={20}/></button>
                    </div>
                 </div>
              </div>
            )}

          </div>
        )}
      </section>
    </main>
  );
}

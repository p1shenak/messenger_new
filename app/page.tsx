"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, Zap, Lock, Users, Gift, ShoppingBag, Store, Send, MessageSquare, Plus, Loader2
} from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

// Темы оформления
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

  // Инициализация Supabase напрямую в компоненте
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        let { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (!prof) {
          const { data: newProf } = await supabase.from('profiles').insert([{ 
            id: user.id, username: user.user_metadata?.username || "VoidUser", balance: 5000 
          }]).select().single();
          setProfile(newProf);
        } else {
          setProfile(prof);
        }
      }
    } catch (e) {
      console.error("Ошибка при проверке юзера", e);
    }
    setLoading(false);
  }

  const handleAuth = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      alert("КРИТИЧЕСКАЯ ОШИБКА: Ключи не найдены в системе. Проверьте вкладку Environment Variables в Vercel!");
      return;
    }

    const nick = prompt("ПРИДУМАЙТЕ НИК (только латиница):");
    const pass = prompt("ПРИДУМАЙТЕ ПАРОЛЬ (от 6 символов):");
    
    if (!nick || !pass) return;
    
    setAuthLoading(true);
    const email = `${nick.toLowerCase().trim()}@void.network`;

    try {
      // 1. Пытаемся войти
      const { data: logData, error: logErr } = await supabase.auth.signInWithPassword({ 
        email, 
        password: pass 
      });

      if (logErr) {
        // 2. Если не вышло (юзера нет), регистрируем
        const { error: signErr } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { username: nick } }
        });

        if (signErr) {
          alert("ОШИБКА БАЗЫ: " + signErr.message);
        } else {
          alert("АККАУНТ СОЗДАН! Теперь нажмите ВХОД еще раз с теми же данными.");
        }
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      alert("НЕПРЕДВИДЕННАЯ ОШИБКА: " + err.message);
    } finally {
      setAuthLoading(false);
    }
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
            <MessageSquare size={20}/> КАНАЛ СВЯЗИ
          </button>
          <button onClick={() => setActiveTab("store")} style={{ background: activeTab === 'store' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Store size={20}/> МАГАЗИН
          </button>
          <button onClick={() => setActiveTab("profile")} style={{ background: activeTab === 'profile' ? '#111' : 'none', border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserCircle size={20}/> МОЯ НОДА
          </button>
        </div>

        {user ? (
          <div style={{ background: THEME.card, padding: '20px', borderRadius: '18px', border: `1px solid ${THEME.border}` }}>
            <div style={{ color: THEME.gold, fontSize: '12px', fontWeight: 'bold' }}>{profile?.balance || 0} CR</div>
            <div style={{ fontSize: '15px', margin: '5px 0', fontWeight: 'bold' }}>{profile?.username}</div>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{ color: THEME.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px' }}>ОТКЛЮЧИТЬСЯ</button>
          </div>
        ) : (
          <button 
            disabled={authLoading}
            onClick={handleAuth} 
            style={{ background: THEME.accent, color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', opacity: authLoading ? 0.5 : 1 }}
          >
            {authLoading ? "ПОДКЛЮЧЕНИЕ..." : "ВХОД В СИСТЕМУ"}
          </button>
        )}
      </nav>

      {/* CONTENT AREA */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!user ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: THEME.muted }}>
             <Lock size={60} style={{ marginBottom: '20px' }} />
             <p style={{ fontSize: '14px', letterSpacing: '2px' }}>СИСТЕМА ТРЕБУЕТ АВТОРИЗАЦИИ</p>
          </div>
        ) : (
          <div style={{ padding: '40px' }}>
            <h2 style={{ marginBottom: '20px' }}>{activeTab === 'chat' ? 'КАНАЛЫ СВЯЗИ' : activeTab.toUpperCase()}</h2>
            <p style={{ color: THEME.muted }}>Модуль {activeTab} активен. Ожидание данных...</p>
          </div>
        )}
      </section>
    </main>
  );
}

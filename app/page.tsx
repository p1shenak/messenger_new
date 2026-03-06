"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, Zap, Lock, Users, Gift, ShoppingBag, Store, Send, MessageSquare, Plus
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
      let { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (!prof) {
        const { data: newProf } = await supabase.from('profiles').insert([{ 
          id: user.id, username: user.user_metadata?.username || "User", balance: 5000 
        }]).select().single();
        setProfile(newProf);
      } else {
        setProfile(prof);
      }
    }
    setLoading(false);
  }

  const handleAuth = async () => {
    const supabase = createClient();
    
    // Если ключи не прогрузились, мы увидим это сообщение
    if (!supabase) {
      alert("КРИТИЧЕСКАЯ ОШИБКА: Сайт всё еще не видит ключи из Vercel. Сделай REDEPLOY в панели Vercel!");
      return;
    }

    const nick = prompt("ПРИДУМАЙТЕ НИК (ENG):");
    const pass = prompt("ПРИДУМАЙТЕ ПАРОЛЬ (6+ символов):");
    if (!nick || !pass) return;

    const email = `${nick.toLowerCase()}@void.network`;
    
    // Пробуем войти
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: pass });

    if (loginError) {
      // Если не вошли, пробуем создать аккаунт
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, password: pass, options: { data: { username: nick } } 
      });
      if (signUpError) alert("ОШИБКА: " + signUpError.message);
      else alert("АККАУНТ СОЗДАН! Нажми кнопку ВХОД еще раз.");
    } else {
      window.location.reload();
    }
  };

  if (!mounted) return null;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Zap color={THEME.accent} fill={THEME.accent} size={24} />
          <span style={{ fontWeight: 'bold', fontSize: '20px' }}>VOID_OS</span>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setActiveTab("chat")} style={{ background: activeTab === 'chat' ? '#111' : 'none', border: 'none', color: '#fff', padding: '15px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={20}/> КАНАЛ СВЯЗИ
          </button>
          <button onClick={() => setActiveTab("store")} style={{ background: activeTab === 'store' ? '#111' : 'none', border: 'none', color: '#fff', padding: '15px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Store size={20}/> МАГАЗИН
          </button>
          <button onClick={() => setActiveTab("profile")} style={{ background: activeTab === 'profile' ? '#111' : 'none', border: 'none', color: '#fff', padding: '15px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserCircle size={20}/> МОЯ НОДА
          </button>
        </div>

        {user ? (
          <div style={{ background: THEME.card, padding: '20px', borderRadius: '18px', border: `1px solid ${THEME.border}` }}>
            <div style={{ color: THEME.gold, fontSize: '12px', fontWeight: 'bold' }}>{profile?.balance} CR</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{profile?.username}</div>
            <button onClick={() => createClient()?.auth.signOut().then(() => window.location.reload())} style={{ color: THEME.muted, background: 'none', border: 'none', cursor: 'pointer', marginTop: '10px' }}>ВЫЙТИ</button>
          </div>
        ) : (
          <button onClick={handleAuth} style={{ background: THEME.accent, color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }}>ВХОД В СИСТЕМУ</button>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === "chat" ? (
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ width: '280px', borderRight: `1px solid ${THEME.border}`, padding: '20px' }}>
               <p style={{ fontSize: '12px', color: THEME.muted, marginBottom: '20px' }}>АКТИВНЫЕ КОНТАКТЫ</p>
               <div style={{ color: THEME.muted, fontSize: '11px', textAlign: 'center', marginTop: '50px' }}>Войдите, чтобы искать друзей.</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#050505' }}>
               <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.muted }}>
                  <div style={{ textAlign: 'center' }}>
                    <Lock size={50} style={{ marginBottom: '15px', opacity: 0.2 }} />
                    <p>ВЫБЕРИТЕ КАНАЛ СВЯЗИ</p>
                  </div>
               </div>
               <div style={{ padding: '25px', borderTop: `1px solid ${THEME.border}`, display: 'flex', gap: '15px' }}>
                  <input placeholder="Введите сообщение..." style={{ flex: 1, background: THEME.card, border: `1px solid ${THEME.border}`, color: '#fff', padding: '15px', borderRadius: '12px' }} />
                  <button style={{ background: THEME.accent, border: 'none', padding: '0 25px', borderRadius: '12px', color: '#fff' }}><Send size={20}/></button>
               </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px' }}>
             <h2 style={{ marginBottom: '20px' }}>{activeTab.toUpperCase()}</h2>
             <div style={{ color: THEME.muted }}>Контент будет доступен после авторизации.</div>
          </div>
        )}
      </section>
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, UserCircle, ShieldAlert, Coins, Send, LogIn, LogOut, Palette, Check, LoaderCircle, Zap, Lock, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const THEME = {
  bg: '#020202',
  sidebar: '#080808',
  card: '#0c0c0c',
  border: '#1a1a1a',
  text: '#e0e0e0',
  muted: '#555',
  accent: '#2563eb',
  gold: '#eab308',
};

const NavButton = ({ icon: Icon, label, active, onClick, color = THEME.accent }: any) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '12px',
    background: active ? `${color}15` : 'none', border: 'none', color: active ? color : THEME.text,
    cursor: 'pointer', textAlign: 'left', transition: '0.2s', fontWeight: active ? 'bold' : 'normal',
    textShadow: active ? `0 0 10px ${color}` : 'none'
  }}>
    <Icon size={20} color={active ? color : THEME.muted} />
    {label}
  </button>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState("chat");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newColor, setNewColor] = useState(THEME.accent);

  // Безопасный вызов Supabase (только в браузере)
  const getSupabase = () => {
    if (typeof window !== "undefined") return createClient();
    return null;
  };

  useEffect(() => {
    const initNode = async () => {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (prof) {
          setProfile(prof);
          setNewUsername(prof.username || "");
          setNewColor(prof.avatar_color || THEME.accent);
        }
      }
      setLoading(false);
    };
    initNode();
  }, []);

  const handleAnonymousAuth = async () => {
    const nick = prompt("Введите ПОЗЫВНОЙ (Ник):");
    const pass = prompt("Введите ПАРОЛЬ:");
    if (!nick || !pass) return;

    const supabase = getSupabase();
    if (!supabase) return;

    const virtualEmail = `${nick.toLowerCase()}@void.network`;

    // Пытаемся войти
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: virtualEmail,
      password: pass
    });

    // Если не зашли, значит новый юзер - регистрируем
    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: virtualEmail,
        password: pass,
        options: { data: { username: nick } }
      });

      if (signUpError) alert("ОШИБКА: " + signUpError.message);
      else alert("НОДА СОЗДАНА. Войдите еще раз для подтверждения.");
    } else {
      window.location.reload();
    }
  };

  const handleUpdateProfile = async () => {
    const supabase = getSupabase();
    if (!user || !supabase) return;
    const { error } = await supabase.from('profiles').update({ 
      username: newUsername, 
      avatar_color: newColor 
    }).eq('id', user.id);
    
    if (error) alert("Ошибка протокола"); 
    else { alert("Данные обновлены"); window.location.reload(); }
  };

  if (loading) return (
    <div style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoaderCircle size={30} color={THEME.accent} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <Zap size={24} color={profile?.avatar_color || THEME.accent} style={{ filter: `drop-shadow(0 0 5px ${profile?.avatar_color || THEME.accent})` }} />
          <h1 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-1px' }}>VOID_NETWORK</h1>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavButton icon={LayoutGrid} label="Канал связи" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} color={profile?.avatar_color} />
          <NavButton icon={UserCircle} label="Моя Нода" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} color={profile?.avatar_color} />
          
          {profile?.is_admin && (
            <NavButton icon={ShieldAlert} label="АДМИН-ЦЕНТР" active={activeTab === "admin"} onClick={() => setActiveTab("admin")} color="#ef4444" />
          )}
        </div>

        <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: '20px' }}>
          {user ? (
            <div style={{ background: THEME.card, padding: '12px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '35px', height: '35px', borderRadius: '10px', background: profile?.avatar_color || THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {profile?.username?.[0] || 'V'}
              </div>
              <div style={{ flex: 1, fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {profile?.username || "Anon"}
                {profile?.is_admin && <ShieldCheck size={14} color={THEME.gold} />}
              </div>
              <button onClick={() => getSupabase()?.auth.signOut().then(() => window.location.reload())} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}><LogOut size={18} /></button>
            </div>
          ) : (
            <button onClick={handleAnonymousAuth} style={{ width: '100%', background: THEME.accent, color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>ВХОД В СЕТЬ</button>
          )}
        </div>
      </nav>

      {/* CONTENT */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '25px 40px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '4px', color: THEME.muted }}>
            {activeTab === "chat" && "Encrypted_Data_Stream"}
            {activeTab === "profile" && "Node_Configuration"}
            {activeTab === "admin" && "Root_Access_Granted"}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#111', padding: '10px 20px', borderRadius: '30px', border: `1px solid ${THEME.border}`, color: THEME.gold }}>
            <Coins size={20} />
            <span style={{ fontWeight: '900', fontSize: '18px' }}>{profile?.balance?.toFixed(2) || "0.00"}</span>
          </div>
        </header>

        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          
          {activeTab === "chat" && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <Lock size={40} style={{ marginBottom: '20px' }} />
                <p style={{ fontSize: '12px' }}>ОЖИДАНИЕ ВХОДЯЩИХ ПАКЕТОВ...</p>
              </div>
              <div style={{ display: 'flex', gap: '15px', background: THEME.card, padding: '20px', borderRadius: '20px', border: `1px solid ${THEME.border}` }}>
                <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Введите зашифрованное сообщение..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '16px' }} />
                <button style={{ background: profile?.avatar_color || THEME.accent, color: '#fff', border: 'none', width: '50px', height: '50px', borderRadius: '15px', cursor: 'pointer' }}><Send size={20} /></button>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div style={{ maxWidth: '500px' }}>
              <div style={{ background: THEME.card, padding: '30px', borderRadius: '25px', border: `1px solid ${THEME.border}` }}>
                <h3 style={{ margin: '0 0 25px 0' }}>Настройки профиля</h3>
                
                <label style={{ color: THEME.muted, fontSize: '11px', textTransform: 'uppercase' }}>Ваш Позывной</label>
                <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={{ width: '100%', background: '#000', border: `1px solid ${THEME.border}`, padding: '15px', borderRadius: '12px', color: '#fff', marginTop: '10px', marginBottom: '25px' }} />

                <label style={{ color: THEME.muted, fontSize: '11px', textTransform: 'uppercase' }}>Цвет Нейросети</label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '30px' }}>
                  {['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#a855f7'].map(c => (
                    <div key={c} onClick={() => setNewColor(c)} style={{ width: '35px', height: '35px', borderRadius: '10px', background: c, cursor: 'pointer', border: newColor === c ? '3px solid #fff' : 'none' }} />
                  ))}
                </div>

                <button onClick={handleUpdateProfile} style={{ width: '100%', background: '#fff', color: '#000', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>ОБНОВИТЬ НОДУ</button>
              </div>
            </div>
          )}

          {activeTab === "admin" && profile?.is_admin && (
            <div style={{ background: THEME.card, padding: '30px', borderRadius: '25px', border: '1px solid #ef444430' }}>
              <h3 style={{ color: '#ef4444' }}>Terminal: Root Access</h3>
              <p style={{ fontSize: '13px', color: THEME.muted }}>Вы авторизованы как Администратор сети VOID.</p>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}

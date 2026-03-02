"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, UserCircle, ShieldAlert, Coins, Send, LogIn, LogOut, Palette, Check, LoaderCircle, Zap, Lock } from "lucide-react";
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
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("chat");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newColor, setNewColor] = useState(THEME.accent);

  useEffect(() => {
    const getData = async () => {
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
    getData();
  }, []);

  const handleAuth = async () => {
    const email = prompt("Email:"); const pass = prompt("Password:");
    if (!email || !pass) return;
    const { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { username: email.split('@')[0] } } });
    if (error) alert(error.message); else alert("Проверьте почту!");
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ username: newUsername, avatar_color: newColor }).eq('id', user.id);
    if (error) alert("Ошибка обновления"); else { alert("VOID профиль обновлен!"); window.location.reload(); }
  };

  if (loading) return (
    <div style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
      <LoaderCircle size={32} color={THEME.accent} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '260px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', padding: '0 10px' }}>
          <Zap size={22} color={profile?.avatar_color || THEME.accent} style={{ filter: `drop-shadow(0 0 5px ${profile?.avatar_color || THEME.accent})` }} />
          <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-1px', margin: 0 }}>VOID_NET</h1>
        </div>

        <NavButton icon={LayoutGrid} label="Зашифрованный Чат" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} color={profile?.avatar_color} />
        <NavButton icon={UserCircle} label="Мой Профиль" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} color={profile?.avatar_color} />
        
        {profile?.is_admin && (
          <NavButton icon={ShieldAlert} label="Админ Панель" active={activeTab === "admin"} onClick={() => setActiveTab("admin")} color="#ef4444" />
        )}

        <div style={{ marginTop: 'auto', borderTop: `1px solid ${THEME.border}`, paddingTop: '20px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: THEME.card, padding: '10px', borderRadius: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: profile?.avatar_color || THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {profile?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.username || user.email}</div>
              <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><LogOut size={16} /></button>
            </div>
          ) : (
            <button onClick={handleAuth} style={{ width: '100%', background: THEME.accent, color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <LogIn size={18} /> ВОЙТИ В СЕТЬ
            </button>
          )}
        </div>
      </nav>

      {/* CONTENT */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '20px 30px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', margin: 0 }}>
            {activeTab === "chat" && "Encrypted Channel"}
            {activeTab === "profile" && "Node Settings"}
            {activeTab === "admin" && "Control Center"}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(145deg, #111, #050505)', padding: '10px 20px', borderRadius: '20px', border: `1px solid ${THEME.border}`, color: THEME.gold, fontWeight: 'bold', fontSize: '18px' }}>
            <Coins size={20} />
            {profile?.balance?.toFixed(2) || "0.00"}
          </div>
        </header>

        <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          {activeTab === "chat" && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.muted, fontSize: '12px' }}>
                <Lock size={16} style={{ marginRight: '10px' }} /> Канал пуст. Отправьте первый пакет данных.
              </div>
              <div style={{ display: 'flex', gap: '10px', background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
                <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type encrypted packet..." style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${THEME.border}`, background: THEME.bg, color: THEME.text, outline: 'none' }} />
                <button style={{ background: profile?.avatar_color || THEME.accent, color: '#fff', border: 'none', padding: '0 20px', borderRadius: '10px', cursor: 'pointer' }}><Send size={18} /></button>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: THEME.card, padding: '25px', borderRadius: '20px', border: `1px solid ${THEME.border}` }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Palette size={18} /> Кастомизация Ноды</h3>
                <label style={{ fontSize: '12px', color: THEME.muted, display: 'block', marginBottom: '8px' }}>Позывной (Username)</label>
                <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${THEME.border}`, background: THEME.bg, color: THEME.text, marginBottom: '20px' }} />
                <label style={{ fontSize: '12px', color: THEME.muted, display: 'block', marginBottom: '8px' }}>Цвет Нейросети (Accent Color)</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                  {['#2563eb', '#10b981', '#a855f7', '#f97316', '#ec4899'].map(color => (
                    <button key={color} onClick={() => setNewColor(color)} style={{ width: '40px', height: '40px', borderRadius: '10px', background: color, border: newColor === color ? '2px solid #fff' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {newColor === color && <Check size={18} color="#fff" />}
                    </button>
                  ))}
                </div>
                <button onClick={handleUpdateProfile} style={{ background: THEME.text, color: THEME.bg, border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>СОХРАНИТЬ ИЗМЕНЕНИЯ</button>
              </div>
            </div>
          )}

          {activeTab === "admin" && profile?.is_admin && (
            <div style={{ background: THEME.card, padding: '25px', borderRadius: '20px', border: `1px solid ${THEME.border}` }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Управление Нодами (Пользователи)</h3>
              <div style={{ fontSize: '12px', color: THEME.muted }}>Модуль управления доступом активен.</div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

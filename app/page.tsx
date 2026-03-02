"use client";

import { useState, useEffect } from "react";
import { 
  LayoutGrid, UserCircle, ShieldAlert, Coins, Send, LogIn, LogOut, 
  Palette, Check, LoaderCircle, Zap, Lock, ShieldCheck, Gavel, Eye, Trash2, Ban 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// --- КОНСТАНТЫ ДИЗАЙНА ---
const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#555', accent: '#2563eb', gold: '#eab308', red: '#ef4444'
};

const NavButton = ({ icon: Icon, label, active, onClick, color = THEME.accent }: any) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '12px',
    background: active ? `${color}15` : 'none', border: 'none', color: active ? color : THEME.text,
    cursor: 'pointer', textAlign: 'left', transition: '0.2s', fontWeight: active ? 'bold' : 'normal',
    boxShadow: active ? `inset 0 0 10px ${color}10` : 'none'
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
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newColor, setNewColor] = useState(THEME.accent);

  // Безопасный клиент (защита от ошибок билда Vercel)
  const getSupabase = () => (typeof window !== "undefined" ? createClient() : null);

  useEffect(() => {
    const initNode = async () => {
      const supabase = getSupabase();
      if (!supabase) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (prof) {
            setProfile(prof);
            setNewUsername(prof.username || "");
            setNewColor(prof.avatar_color || THEME.accent);
            
            // Если зашел Админ — грузим список всех юзеров
            if (prof.role === 'superadmin' || prof.role === 'admin') {
              const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
              setAllUsers(users || []);
            }
          }
        }
      } catch (e) {
        console.error("Критический сбой инициализации:", e);
      } finally {
        setLoading(false);
      }
    };
    initNode();
    const timeout = setTimeout(() => setLoading(false), 4000); // Страховка от зависания
    return () => clearTimeout(timeout);
  }, [activeTab]);

  // --- ЛОГИКА АВТОРИЗАЦИИ (Анонимная) ---
  const handleAuth = async () => {
    const nick = prompt("Введите ПОЗЫВНОЙ:");
    const pass = prompt("Введите ПАРОЛЬ:");
    if (!nick || !pass) return;

    const supabase = getSupabase();
    const virtualEmail = `${nick.toLowerCase()}@void.network`;

    setLoading(true);
    const { error: signInError } = await supabase!.auth.signInWithPassword({ email: virtualEmail, password: pass });

    if (signInError) {
      const { error: signUpError } = await supabase!.auth.signUp({
        email: virtualEmail, password: pass, options: { data: { username: nick } }
      });
      if (signUpError) alert("ОШИБКА: " + signUpError.message);
      else alert("АККАУНТ СОЗДАН. Войдите еще раз.");
    } else {
      window.location.reload();
    }
    setLoading(false);
  };

  // --- АДМИН-ФУНКЦИИ ---
  const toggleBan = async (id: string, currentStatus: boolean) => {
    const supabase = getSupabase();
    await supabase?.from('profiles').update({ is_banned: !currentStatus }).eq('id', id);
    alert("Статус блокировки изменен");
    window.location.reload();
  };

  if (loading) return (
    <div style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <LoaderCircle size={40} color={THEME.accent} style={{ animation: 'spin 1s linear infinite' }} />
      <div style={{ fontSize: '10px', letterSpacing: '3px', opacity: 0.5 }}>CONNECTING TO VOID_NET...</div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR (Discord Style) */}
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <Zap size={24} color={profile?.avatar_color || THEME.accent} style={{ filter: `drop-shadow(0 0 5px ${profile?.avatar_color || THEME.accent})` }} />
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>VOID_NETWORK</h1>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <NavButton icon={LayoutGrid} label="Канал Связи" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} color={profile?.avatar_color} />
          <NavButton icon={UserCircle} label="Моя Нода" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} color={profile?.avatar_color} />
          
          {(profile?.role === 'superadmin' || profile?.role === 'admin') && (
            <NavButton icon={ShieldAlert} label="АДМИН-ЦЕНТР" active={activeTab === "admin"} onClick={() => setActiveTab("admin")} color={THEME.red} />
          )}
        </div>

        <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: '20px' }}>
          {user ? (
            <div style={{ background: THEME.card, padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '35px', height: '35px', borderRadius: '10px', background: profile?.avatar_color || THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {profile?.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {profile?.username}
                {profile?.role === 'superadmin' && <ShieldCheck size={14} color={THEME.gold} />}
              </div>
              <button onClick={() => getSupabase()?.auth.signOut().then(() => window.location.reload())} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}><LogOut size={18} /></button>
            </div>
          ) : (
            <button onClick={handleAuth} style={{ width: '100%', background: THEME.accent, color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>ВХОД В СИСТЕМУ</button>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '25px 40px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050505' }}>
          <div style={{ fontSize: '12px', color: THEME.muted, textTransform: 'uppercase', letterSpacing: '2px' }}>
            STATUS: {profile?.is_banned ? "BANNED" : "ENCRYPTED_CONNECTION"} // ID: {user?.id?.slice(0,8)}
          </div>
          <div style={{ background: '#111', padding: '10px 20px', borderRadius: '20px', border: `1px solid ${THEME.border}`, color: THEME.gold, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Coins size={18} />
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{profile?.balance?.toFixed(2) || "0.00"}</span>
          </div>
        </header>

        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          
          {/* ВКЛАДКА ЧАТА */}
          {activeTab === "chat" && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                <Lock size={50} style={{ marginBottom: '20px' }} />
                <p style={{ fontSize: '12px', letterSpacing: '5px' }}>END-TO-END ENCRYPTION ACTIVE</p>
              </div>
              <div style={{ display: 'flex', gap: '15px', background: THEME.card, padding: '20px', borderRadius: '25px', border: `1px solid ${THEME.border}` }}>
                <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Введите пакет данных..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '16px' }} />
                <button style={{ background: profile?.avatar_color || THEME.accent, color: '#fff', border: 'none', width: '50px', height: '50px', borderRadius: '15px', cursor: 'pointer' }}><Send size={20} /></button>
              </div>
            </div>
          )}

          {/* ВКЛАДКА ПРОФИЛЯ */}
          {activeTab === "profile" && (
            <div style={{ maxWidth: '500px', background: THEME.card, padding: '40px', borderRadius: '30px', border: `1px solid ${THEME.border}` }}>
              <h3 style={{ margin: '0 0 30px 0', fontSize: '20px' }}>Конфигурация Ноды</h3>
              <label style={{ fontSize: '10px', color: THEME.muted }}>PUBLIC_ID</label>
              <div style={{ padding: '15px', background: '#000', borderRadius: '12px', marginBottom: '25px', fontSize: '13px', border: `1px solid ${THEME.border}` }}>{profile?.username}</div>
              
              <label style={{ fontSize: '10px', color: THEME.muted }}>ЦВЕТ НЕЙРОСЕТИ</label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                {['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#a855f7'].map(c => (
                  <div key={c} onClick={() => setNewColor(c)} style={{ width: '40px', height: '40px', borderRadius: '12px', background: c, cursor: 'pointer', border: newColor === c ? '3px solid #fff' : 'none', transition: '0.2s' }} />
                ))}
              </div>
              <button style={{ width: '100%', marginTop: '40px', background: '#fff', color: '#000', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>СОХРАНИТЬ ПАРАМЕТРЫ</button>
            </div>
          )}

          {/* ВКЛАДКА АДМИНКИ */}
          {activeTab === "admin" && (profile?.role === 'superadmin' || profile?.role === 'admin') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <h3 style={{ color: THEME.red, display: 'flex', alignItems: 'center', gap: '12px' }}><Gavel size={24} /> ROOT_ACCESS: Управление Сетью</h3>
              <div style={{ background: THEME.card, borderRadius: '25px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#111', fontSize: '11px', color: THEME.muted }}>
                    <tr>
                      <th style={{ padding: '20px' }}>ID / ПОЗЫВНОЙ</th>
                      <th>РОЛЬ</th>
                      <th>СТАТУС</th>
                      <th>ДЕЙСТВИЯ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${THEME.border}`, fontSize: '13px' }}>
                        <td style={{ padding: '20px' }}>{u.username}</td>
                        <td style={{ color: u.role === 'superadmin' ? THEME.gold : '#fff' }}>{u.role.toUpperCase()}</td>
                        <td style={{ color: u.is_banned ? THEME.red : '#22c55e' }}>{u.is_banned ? "BANNED" : "ACTIVE"}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={() => toggleBan(u.id, u.is_banned)} style={{ background: 'none', border: 'none', color: THEME.muted, cursor: 'pointer' }} title="Ban/Unban"><Ban size={18} /></button>
                            <button style={{ background: 'none', border: 'none', color: THEME.red, cursor: 'pointer' }} title="Delete Root Account"><Trash2 size={18} /></button>
                            <button style={{ background: 'none', border: 'none', color: THEME.accent, cursor: 'pointer' }} title="Inspect Traffic"><Eye size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}

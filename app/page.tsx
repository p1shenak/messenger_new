"use client";

import { useState, useEffect } from "react";
import { 
  LayoutGrid, UserCircle, ShieldAlert, Coins, Send, LogIn, LogOut, 
  Palette, Check, LoaderCircle, Zap, Lock, ShieldCheck, Gavel, Eye, Trash2, Ban 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#555', accent: '#2563eb', gold: '#eab308', red: '#ef4444'
};

const NavButton = ({ icon: Icon, label, active, onClick, color = THEME.accent }: any) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '12px',
    background: active ? `${color}15` : 'none', border: 'none', color: active ? color : THEME.text,
    cursor: 'pointer', textAlign: 'left', transition: '0.2s', fontWeight: active ? 'bold' : 'normal',
  }}>
    <Icon size={20} color={active ? color : THEME.muted} />
    {label}
  </button>
);

export default function Home() {
  const [mounted, setMounted] = useState(false); // Защита от гидратации
  const [activeTab, setActiveTab] = useState("chat");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // 1. Сначала просто рендерим пустую оболочку
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Только после отрисовки идем в базу
  useEffect(() => {
    if (!mounted) return;

    const initNode = async () => {
      try {
        const supabase = createClient();
        if (!supabase) throw new Error("No client");

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (prof) {
            setProfile(prof);
            if (prof.role === 'superadmin' || prof.role === 'admin') {
              const { data: users } = await supabase.from('profiles').select('*');
              setAllUsers(users || []);
            }
          }
        }
      } catch (e) {
        console.error("Connection failed:", e);
      } finally {
        setLoading(false);
      }
    };

    initNode();
  }, [mounted, activeTab]);

  const handleAuth = async () => {
    const nick = prompt("НИК:");
    const pass = prompt("ПАРОЛЬ:");
    if (!nick || !pass) return;

    const supabase = createClient();
    const virtualEmail = `${nick.toLowerCase()}@void.network`;

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: virtualEmail, password: pass });

    if (signInError) {
      await supabase.auth.signUp({
        email: virtualEmail, password: pass, options: { data: { username: nick } }
      });
      alert("НОДА СОЗДАНА. Войдите снова.");
    } else {
      window.location.reload();
    }
  };

  // Если страница еще не готова в браузере, ничего не показываем (избегаем зависания)
  if (!mounted) return <div style={{ background: '#000', minHeight: '100vh' }} />;

  if (loading) return (
    <div style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <LoaderCircle size={40} color={THEME.accent} style={{ animation: 'spin 1s linear infinite' }} />
      <div style={{ fontSize: '10px', letterSpacing: '3px', opacity: 0.5 }}>SYNCHRONIZING VOID_NET...</div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <Zap size={24} color={profile?.avatar_color || THEME.accent} />
          <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>VOID_NETWORK</h1>
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
              <div style={{ flex: 1, fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {profile?.username}
                {profile?.role === 'superadmin' && <ShieldCheck size={14} color={THEME.gold} />}
              </div>
              <button onClick={() => createClient().auth.signOut().then(() => window.location.reload())} style={{ background: 'none', border: 'none', color: '#444' }}><LogOut size={18} /></button>
            </div>
          ) : (
            <button onClick={handleAuth} style={{ width: '100%', background: THEME.accent, color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold' }}>ВХОД</button>
          )}
        </div>
      </nav>

      <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '25px 40px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: THEME.muted }}>PROTOCOL: AES-256-VOID</div>
          <div style={{ background: '#111', padding: '10px 20px', borderRadius: '20px', border: `1px solid ${THEME.border}`, color: THEME.gold }}>
            <Coins size={18} /> {profile?.balance?.toFixed(2) || "0.00"}
          </div>
        </header>

        <div style={{ flex: 1, padding: '40px' }}>
          {activeTab === "chat" && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
                <Lock size={60} />
              </div>
              <div style={{ display: 'flex', gap: '15px', background: THEME.card, padding: '20px', borderRadius: '25px', border: `1px solid ${THEME.border}` }}>
                <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type encrypted message..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none' }} />
                <button style={{ background: profile?.avatar_color || THEME.accent, color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '15px' }}><Send size={20} /></button>
              </div>
            </div>
          )}
          
          {activeTab === "admin" && (
             <div style={{ background: THEME.card, padding: '20px', borderRadius: '20px' }}>
               <h2 style={{ color: THEME.red }}>Terminal: Superuser</h2>
               {allUsers.map(u => <div key={u.id} style={{ padding: '10px', borderBottom: '1px solid #222' }}>{u.username} - {u.role}</div>)}
             </div>
          )}
        </div>
      </section>
    </main>
  );
}

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
    cursor: 'pointer', textAlign: 'left', transition: '0.2s', fontWeight: active ? 'bold' : 'normal'
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
  const [allUsers, setAllUsers] = useState<any[]>([]); // Для админки
  const [reports, setReports] = useState<any[]>([]); // Для админки

  const getSupabase = () => (typeof window !== "undefined" ? createClient() : null);

  useEffect(() => {
    const init = async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
        
        // Если админ — подгружаем данные управления
        if (prof?.role === 'superadmin' || prof?.role === 'admin') {
          const { data: users } = await supabase.from('profiles').select('*');
          setAllUsers(users || []);
          const { data: reps } = await supabase.from('reports').select('*, reporter:profiles!reporter_id(username)');
          setReports(reps || []);
        }
      }
      setLoading(false);
    };
    init();
  }, [activeTab]);

  // --- АДМИН ФУНКЦИИ ---
  const handleSetRole = async (targetId: string, newRole: string) => {
    const supabase = getSupabase();
    await supabase?.from('profiles').update({ role: newRole }).eq('id', targetId);
    alert(`Роль ${newRole} выдана`);
  };

  const handleBan = async (targetId: string) => {
    const supabase = getSupabase();
    await supabase?.from('profiles').update({ is_banned: true }).eq('id', targetId);
    alert("Пользователь заблокирован");
  };

  const handleDeleteAccount = async (targetId: string) => {
    if (!confirm("Удалить аккаунт безвозвратно?")) return;
    const supabase = getSupabase();
    // В реальном приложении удаление делается через Edge Function, тут пометим как удаленный
    await supabase?.from('profiles').delete().eq('id', targetId);
    alert("Аккаунт стерт из системы");
  };

  const handleAuth = async () => {
    const nick = prompt("НИК:"); const pass = prompt("ПАРОЛЬ:");
    if (!nick || !pass) return;
    const supabase = getSupabase();
    const email = `${nick.toLowerCase()}@void.network`;
    const { error } = await supabase!.auth.signInWithPassword({ email, password: pass });
    if (error) {
      await supabase!.auth.signUp({ email, password: pass, options: { data: { username: nick } } });
      alert("НОДА СОЗДАНА. Войдите снова.");
    } else window.location.reload();
  };

  if (loading) return <div style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoaderCircle className="animate-spin" /></div>;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <Zap size={24} color={profile?.avatar_color || THEME.accent} />
          <h1 style={{ fontSize: '20px', fontWeight: '900' }}>VOID_ROOT</h1>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavButton icon={LayoutGrid} label="Канал связи" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} />
          <NavButton icon={UserCircle} label="Моя Нода" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
          
          {(profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'moder') && (
            <NavButton icon={ShieldAlert} label="АДМИН-ЦЕНТР" active={activeTab === "admin"} onClick={() => setActiveTab("admin")} color={THEME.red} />
          )}
        </div>

        {user ? (
          <div style={{ background: THEME.card, padding: '12px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, fontSize: '13px', fontWeight: 'bold' }}>{profile?.username}</div>
            {profile?.role === 'superadmin' && <ShieldCheck size={16} color={THEME.gold} />}
            <button onClick={() => getSupabase()?.auth.signOut().then(() => window.location.reload())} style={{ background: 'none', border: 'none', color: THEME.muted }}><LogOut size={18} /></button>
          </div>
        ) : (
          <button onClick={handleAuth} style={{ width: '100%', background: THEME.accent, color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold' }}>ВХОД</button>
        )}
      </nav>

      {/* CONTENT AREA */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ padding: '25px 40px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '14px', color: THEME.muted, textTransform: 'uppercase' }}>{activeTab}</h2>
          <div style={{ color: THEME.gold, fontWeight: 'bold' }}>{profile?.balance?.toFixed(2)} CREDITS</div>
        </header>

        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          
          {activeTab === "admin" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <section>
                <h3 style={{ color: THEME.red, display: 'flex', alignItems: 'center', gap: '10px' }}><Gavel /> Управление пользователями</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                  <thead>
                    <tr style={{ color: THEME.muted, fontSize: '12px', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                        <td style={{ padding: '15px 10px' }}>{u.username}</td>
                        <td>
                          <select 
                            defaultValue={u.role} 
                            onChange={(e) => handleSetRole(u.id, e.target.value)}
                            style={{ background: '#000', color: '#fff', border: '1px solid #333' }}
                            disabled={profile.role !== 'superadmin'}
                          >
                            <option value="user">User</option>
                            <option value="moder">Moder</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={{ color: u.is_banned ? THEME.red : '#22c55e' }}>{u.is_banned ? 'BANNED' : 'ACTIVE'}</td>
                        <td style={{ display: 'flex', gap: '10px', paddingTop: '10px' }}>
                          <button onClick={() => handleBan(u.id)} title="Ban IP & User"><Ban size={16} /></button>
                          <button onClick={() => handleDeleteAccount(u.id)} style={{ color: THEME.red }}><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Eye /> Просмотр трафика (Reports)</h3>
                {reports.length === 0 ? <p style={{ fontSize: '12px', color: THEME.muted }}>Жалоб нет</p> : (
                  reports.map(r => (
                    <div key={r.id} style={{ background: THEME.card, padding: '15px', borderRadius: '10px', marginBottom: '10px' }}>
                      Report from {r.reporter?.username}: {r.reason}
                    </div>
                  ))
                )}
              </section>
            </div>
          )}

          {activeTab === "chat" && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
               <div style={{ flex: 1, textAlign: 'center', opacity: 0.2, paddingTop: '100px' }}>
                  <Lock size={40} />
                  <p>КАНАЛ ЗАШИФРОВАН</p>
               </div>
               <div style={{ display: 'flex', gap: '10px', background: THEME.card, padding: '20px', borderRadius: '20px' }}>
                 <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Сообщение..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none' }} />
                 <button style={{ background: THEME.accent, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px' }}><Send size={18} /></button>
               </div>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}

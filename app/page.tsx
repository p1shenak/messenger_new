"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, Zap, Lock, Users, Gift, ShoppingBag, Store, Send, MessageSquare 
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
  
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [message, setMessage] = useState("");

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
      let { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (!prof) {
        const { data: newProf } = await supabase.from('profiles').insert([{ 
          id: user.id, username: user.user_metadata?.username || "VoidUser", balance: 5000 
        }]).select().single();
        setProfile(newProf);
      } else {
        setProfile(prof);
      }
      // Загрузка друзей (для теста добавим пустой массив)
      setFriends([]); 
    }
    setLoading(false);
  }

  const handleAuth = async () => {
    const supabase = createClient();
    if (!supabase) {
      alert("КРИТИЧЕСКАЯ ОШИБКА: Ключи Supabase не найдены в Vercel! Кнопка не сработает.");
      return;
    }

    const nick = prompt("ВВЕДИТЕ НИК:");
    const pass = prompt("ВВЕДИТЕ ПАРОЛЬ:");
    if (!nick || !pass) return;

    const email = `${nick.toLowerCase()}@void.network`;
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: pass });

    if (loginError) {
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, password: pass, options: { data: { username: nick } } 
      });
      if (signUpError) alert("Ошибка: " + signUpError.message);
      else alert("Аккаунт создан! Нажми ВХОД еще раз.");
    } else {
      window.location.reload();
    }
  };

  if (!mounted) return null;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '260px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap color={THEME.accent} fill={THEME.accent} size={22} />
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>VOID_OS</span>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button onClick={() => setActiveTab("chat")} style={{ background: activeTab === 'chat' ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><MessageSquare size={18}/> ЧАТЫ</button>
          <button onClick={() => setActiveTab("store")} style={{ background: activeTab === 'store' ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><Store size={18}/> МАГАЗИН</button>
          <button onClick={() => setActiveTab("profile")} style={{ background: activeTab === 'profile' ? '#111' : 'none', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><UserCircle size={18}/> ПРОФИЛЬ</button>
        </div>

        {user ? (
          <div style={{ background: THEME.card, padding: '15px', borderRadius: '12px', border: `1px solid ${THEME.border}` }}>
            <div style={{ color: THEME.gold, fontSize: '11px', fontWeight: 'bold' }}>{profile?.balance} CR</div>
            <div style={{ fontSize: '14px' }}>{profile?.username}</div>
          </div>
        ) : (
          <button onClick={handleAuth} style={{ background: THEME.accent, color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>ВХОД</button>
        )}
      </nav>

      {/* CHAT AREA */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === "chat" ? (
          <div style={{ display: 'flex', height: '100%' }}>
            {/* Список друзей */}
            <div style={{ width: '250px', borderRight: `1px solid ${THEME.border}`, padding: '20px' }}>
              <p style={{ fontSize: '12px', color: THEME.muted, marginBottom: '15px' }}>КОНТАКТЫ</p>
              {friends.length === 0 ? (
                <div style={{ fontSize: '11px', color: THEME.muted }}>Список пуст. Добавьте друга по ID в профиле.</div>
              ) : (
                friends.map(f => (
                  <div key={f.id} onClick={() => setSelectedFriend(f)} style={{ padding: '10px', cursor: 'pointer', borderRadius: '8px', background: selectedFriend?.id === f.id ? '#111' : 'none' }}>
                    {f.username}
                  </div>
                ))
              )}
            </div>

            {/* Окно сообщений */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {selectedFriend ? (
                <>
                  <div style={{ padding: '20px', borderBottom: `1px solid ${THEME.border}`, fontWeight: 'bold' }}>
                    Чат с {selectedFriend.username}
                  </div>
                  <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                    {/* Тут будут сообщения */}
                    <div style={{ color: THEME.muted, textAlign: 'center', marginTop: '20%' }}>История сообщений зашифрована.</div>
                  </div>
                  <div style={{ padding: '20px', borderTop: `1px solid ${THEME.border}`, display: 'flex', gap: '10px' }}>
                    <input 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Введите сообщение..." 
                      style={{ flex: 1, background: '#111', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px' }}
                    />
                    <button style={{ background: THEME.accent, border: 'none', padding: '10px 20px', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                      <Send size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.muted }}>
                  <div style={{ textAlign: 'center' }}>
                    <Lock size={40} style={{ marginBottom: '10px' }} />
                    <p>ВЫБЕРИТЕ КОНТАКТ ДЛЯ СВЯЗИ</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px' }}>
            {/* Тут контент магазина или профиля */}
            <p>Переключитесь на вкладку Профиль, чтобы увидеть свой ID.</p>
          </div>
        )}
      </section>
    </main>
  );
}

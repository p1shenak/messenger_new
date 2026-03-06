"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const { 
  UserCircle, Store, MessageSquare, ShieldAlert, CheckCircle2, 
  Ban, Trash2, Send, ShoppingBag, Tag, Lock, Gift, Share2, 
  UserPlus, UserCheck, UserX, Search, LogIn, UserPlus: RegisterIcon
} = LucideIcons;

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#777', accent: '#2563eb', gold: '#eab308', red: '#dc2626', success: '#22c55e'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Data states
  const [inventory, setInventory] = useState<any[]>([]);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");

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
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      setProfile(prof);
      if (prof) loadData(prof.id);
    }
    setLoading(false);
  }

  const loadData = (uid: string) => {
    loadInventory(uid);
    loadFriends(uid);
    loadRequests(uid);
    loadStore();
  };

  const loadInventory = async (uid: string) => {
    const { data } = await supabase.from('inventory').select('*, gifts(*)').eq('user_id', uid);
    setInventory(data || []);
  };

  const loadStore = async () => {
    const { data } = await supabase.from('gifts').select('*').order('created_at', { ascending: false });
    setStoreGifts(data || []);
  };

  const loadFriends = async (uid: string) => {
    const { data } = await supabase.from('friends')
      .select('*, profiles!friends_friend_id_fkey(*), requester:profiles!friends_user_id_fkey(*)')
      .eq('status', 'accepted')
      .or(`user_id.eq.${uid},friend_id.eq.${uid}`);
    const formatted = data?.map(f => f.user_id === uid ? f.profiles : f.requester);
    setFriends(formatted || []);
  };

  const loadRequests = async (uid: string) => {
    const { data } = await supabase.from('friends')
      .select('*, requester:profiles!friends_user_id_fkey(*)')
      .eq('friend_id', uid)
      .eq('status', 'pending');
    setFriendRequests(data || []);
  };

  // --- AUTH FUNCTIONS ---
  const handleAuth = async () => {
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert("Проверьте почту для подтверждения!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else window.location.reload();
    }
  };

  // --- ACTION FUNCTIONS ---
  const acceptReq = async (id: string) => {
    await supabase.from('friends').update({ status: 'accepted' }).eq('id', id);
    loadData(profile.id);
  };

  const buyItem = async (gift: any) => {
    if (profile.balance < gift.price) return alert("Мало кредитов!");
    const { error } = await supabase.from('profiles').update({ balance: profile.balance - gift.price }).eq('id', profile.id);
    if (!error) {
      await supabase.from('inventory').insert([{ user_id: profile.id, gift_id: gift.id }]);
      alert("Куплено!");
      checkUser();
    }
  };

  if (!mounted) return null;

  // ЭКРАН ВХОДА / РЕГИСТРАЦИИ
  if (!profile && !loading) {
    return (
      <div style={{ background: THEME.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'monospace' }}>
        <div style={{ background: THEME.card, padding: '30px', borderRadius: '20px', border: `1px solid ${THEME.border}`, width: '100%', maxWidth: '400px' }}>
          <h2 style={{ color: THEME.accent, textAlign: 'center', marginBottom: '20px' }}>VOID_OS ACCESS</h2>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />
          <button onClick={handleAuth} style={{ width: '100%', background: THEME.accent, color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>
            {isRegistering ? "CREATE ACCOUNT" : "LOGIN"}
          </button>
          <div onClick={() => setIsRegistering(!isRegistering)} style={{ color: THEME.muted, textAlign: 'center', cursor: 'pointer', fontSize: '12px' }}>
            {isRegistering ? "Already have account? Login" : "No account? Register here"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', flexDirection: window?.innerWidth < 768 ? 'column' : 'row', fontFamily: 'monospace' }}>
      
      {/* САЙДБАР */}
      <nav style={{ width: window?.innerWidth < 768 ? '100%' : '260px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: THEME.accent, marginBottom: '20px' }}>VOID_OS</h2>
        <div style={{ flex: 1, display: 'flex', flexDirection: window?.innerWidth < 768 ? 'row' : 'column', gap: '5px', overflowX: 'auto' }}>
          <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={18}/> ПРОФИЛЬ</button>
          <button onClick={() => setActiveTab("store")} style={btnTab(activeTab === "store")}><ShoppingBag size={18}/> МАГАЗИН</button>
          <button onClick={() => setActiveTab("requests")} style={btnTab(activeTab === "requests")}><UserPlus size={18}/> ЗАЯВКИ {friendRequests.length > 0 && <span style={badgeStyle}>{friendRequests.length}</span>}</button>
          <button onClick={() => setActiveTab("chat")} style={btnTab(activeTab === "chat")}><MessageSquare size={18}/> ЧАТ</button>
        </div>
        <div style={{ marginTop: '10px', padding: '10px', background: THEME.card, borderRadius: '10px', fontSize: '10px' }}>
          ID: {profile?.id} <br/> <span style={{color: THEME.gold}}>{profile?.balance} CR</span>
        </div>
      </nav>

      {/* КОНТЕНТ */}
      <section style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        
        {/* МАГАЗИН */}
        {activeTab === "store" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
            {storeGifts.length === 0 && <p style={{color: THEME.muted}}>Магазин пуст...</p>}
            {storeGifts.map(g => (
              <div key={g.id} style={{ background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
                <img src={g.image_url} style={{ width: '100%', height: '100px', objectFit: 'contain' }} alt=""/>
                <div style={{fontWeight:'bold', fontSize:'14px', marginTop:'10px'}}>{g.name}</div>
                <div style={{color: THEME.gold, margin: '10px 0'}}>{g.price} CR</div>
                <button onClick={() => buyItem(g)} style={btnAction}>КУПИТЬ</button>
              </div>
            ))}
          </div>
        )}

        {/* НОВАЯ ВКЛАДКА: ЗАЯВКИ */}
        {activeTab === "requests" && (
          <div style={{ maxWidth: '500px' }}>
            <h3>ВХОДЯЩИЕ ЗАЯВКИ</h3>
            {friendRequests.length === 0 && <p style={{color: THEME.muted}}>Пока заявок нет...</p>}
            {friendRequests.map(r => (
              <div key={r.id} style={{ background: THEME.card, padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '10px', border: `1px solid ${THEME.border}` }}>
                <span>{r.requester?.username} хочет в друзья</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => acceptReq(r.id)} style={{ color: THEME.success, background: 'none', border: 'none', cursor: 'pointer' }}><UserCheck /></button>
                  <button onClick={() => supabase.from('friends').delete().eq('id', r.id)} style={{ color: THEME.red, background: 'none', border: 'none', cursor: 'pointer' }}><UserX /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ПРОФИЛЬ */}
        {activeTab === "profile" && (
          <div>
            <h3>ИНВЕНТАРЬ</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
              {inventory.map(i => (
                <div key={i.id} style={{ background: THEME.card, padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                  <img src={i.gifts?.image_url} style={{ width: '100%', height: '60px', objectFit: 'contain' }} alt=""/>
                  <div style={{fontSize: '10px', marginTop: '5px'}}>{i.gifts?.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>
    </main>
  );
}

// СТИЛИ
function btnTab(active: boolean): React.CSSProperties {
  return {
    background: active ? '#111' : 'none', border: 'none', color: active ? '#fff' : '#777', padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', minWidth: 'max-content'
  };
}
const inputStyle: React.CSSProperties = { width: '100%', background: '#000', border: `1px solid ${THEME.border}`, color: '#fff', padding: '12px', borderRadius: '10px', outline: 'none' };
const btnAction: React.CSSProperties = { width: '100%', background: '#fff', color: '#000', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' };
const badgeStyle: React.CSSProperties = { background: THEME.red, color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', marginLeft: '5px' };

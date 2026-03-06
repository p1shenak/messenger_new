"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, Zap, Lock, Users, Gift, ShoppingBag, Store, Send, MessageSquare, Plus, Loader2, LogOut, ShieldAlert, Image, Ban, MailWarning, Eye, Search, CheckCircle2, UserPlus, Clock
} from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#777', accent: '#2563eb', gold: '#eab308', red: '#dc2626', success: '#22c55e'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [adminHover, setAdminHover] = useState(false);

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => { setMounted(true); checkUser(); }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      setProfile(prof);
      loadStore();
      loadInventory(user.id);
      loadFriends(user.id);
    }
    setLoading(false);
  }

  async function loadStore() { const { data } = await supabase.from('gifts').select('*').eq('is_official', true); setStoreGifts(data || []); }
  async function loadInventory(uid: string) { const { data } = await supabase.from('inventory').select('id, gifts(*)').eq('user_id', uid); setInventory(data || []); }
  
  async function loadFriends(uid: string) {
    const { data } = await supabase.from('friends').select('*, profiles!friends_friend_id_fkey(username, avatar_url, id)').eq('user_id', uid);
    const { data: incoming } = await supabase.from('friends').select('*, profiles!friends_user_id_fkey(username, avatar_url, id)').eq('friend_id', uid);
    setFriends([...(data || []), ...(incoming || [])]);
  }

  const handleAuth = async () => {
    const nick = prompt("НИК:"); const pass = prompt("ПАРОЛЬ:");
    if (!nick || !pass) return;
    const email = `${nick.toLowerCase()}@void.network`;
    const { data: sD, error: sE } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (sE) {
      const { error: uE } = await supabase.auth.signUp({ email, password: pass, options: { data: { username: nick } } });
      if (!uE) alert("АККАУНТ СОЗДАН! ВОЙДИТЕ.");
    } else { window.location.reload(); }
  };

  // --- ПОИСК И ДРУЗЬЯ ---
  const searchUser = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', searchId).maybeSingle();
    setFoundUser(data);
  };

  const sendFriendRequest = async (fid: string) => {
    await supabase.from('friends').insert([{ user_id: profile.id, friend_id: fid, status: 'pending' }]);
    alert("Заявка отправлена!");
    loadFriends(profile.id);
  };

  const acceptFriend = async (reqId: string) => {
    await supabase.from('friends').update({ status: 'accepted' }).eq('id', reqId);
    loadFriends(profile.id);
  };

  // --- ПОДАРКИ ДРУЗЬЯМ ---
  const handleGiftToFriend = async (gift: any) => {
    const acceptedFriends = friends.filter(f => f.status === 'accepted');
    if (acceptedFriends.length === 0) return alert("У вас нет друзей, чтобы дарить подарки!");
    
    const friendList = acceptedFriends.map((f, i) => `${i+1}. ${f.profiles.username}`).join('\n');
    const choice = prompt(`КОМУ ПОДАРИТЬ ${gift.name} за ${gift.price} CR?\n\n${friendList}`);
    const index = parseInt(choice || "0") - 1;

    if (acceptedFriends[index]) {
       if (profile.balance < gift.price) return alert("Мало кредитов!");
       const target = acceptedFriends[index].profiles;
       
       await supabase.from('profiles').update({ balance: profile.balance - gift.price }).eq('id', profile.id);
       await supabase.from('inventory').insert([{ user_id: target.id, gift_id: gift.id, from_id: profile.id }]);
       setProfile({...profile, balance: profile.balance - gift.price});
       alert(`Подарок отправлен пользователю ${target.username}!`);
    }
  };

  if (!mounted) return null;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap color={THEME.accent} size={20} />
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>VOID_OS</span>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button onClick={() => setActiveTab("chat")} style={{ background: activeTab==='chat'?'#111':'none', border:'none', color:'#fff', padding:'12px', borderRadius:'10px', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px' }}><MessageSquare size={18}/> СВЯЗЬ</button>
          <button onClick={() => setActiveTab("store")} style={{ background: activeTab==='store'?'#111':'none', border:'none', color:'#fff', padding:'12px', borderRadius:'10px', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px' }}><Store size={18}/> МАГАЗИН</button>
          <button onClick={() => setActiveTab("profile")} style={{ background: activeTab==='profile'?'#111':'none', border:'none', color:'#fff', padding:'12px', borderRadius:'10px', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px' }}><UserCircle size={18}/> ПРОФИЛЬ</button>
        </div>

        {profile && (
          <div style={{ background: THEME.card, padding: '15px', borderRadius: '12px', border: `1px solid ${THEME.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={profile.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', position: 'relative' }}>
                  <b>{profile.username}</b>
                  {profile.is_admin && (
                    <div onMouseEnter={()=>setAdminHover(true)} onMouseLeave={()=>setAdminHover(false)} style={{ cursor:'pointer' }}>
                       <CheckCircle2 size={14} color={THEME.accent} fill={THEME.accent} />
                       {adminHover && (
                         <div style={{ position:'absolute', bottom:'25px', left:'0', background:THEME.accent, color:'#fff', padding:'5px 10px', borderRadius:'8px', fontSize:'10px', whiteSpace:'nowrap', animation:'fadeIn 0.2s' }}>ADMIN_ACCESS_GRANTED</div>
                       )}
                    </div>
                  )}
                </div>
                <div style={{ color: THEME.gold, fontSize: '11px' }}>{profile.balance} CR</div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* CONTENT */}
      <section style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* ЧАТ И ПОИСК ДРУЗЕЙ */}
        {activeTab === "chat" && (
          <div>
            <div style={{ display:'flex', gap:'10px', marginBottom:'30px' }}>
              <input value={searchId} onChange={(e)=>setSearchId(e.target.value)} placeholder="ПОИСК ПО ID..." style={{ flex:1, background:THEME.card, border:`1px solid ${THEME.border}`, color:'#fff', padding:'12px', borderRadius:'10px' }} />
              <button onClick={searchUser} style={{ background:THEME.accent, border:'none', padding:'0 20px', borderRadius:'10px', color:'#fff' }}><Search size={18}/></button>
            </div>

            {foundUser && (
              <div style={{ background:THEME.card, padding:'20px', borderRadius:'15px', border:`1px solid ${THEME.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px' }}>
                <div style={{ display:'flex', gap:'15px', alignItems:'center' }}>
                  <img src={foundUser.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} style={{ width:'50px', height:'50px', borderRadius:'50%' }} />
                  <div><b>{foundUser.username}</b><div style={{ fontSize:'10px', color:THEME.muted }}>{foundUser.id}</div></div>
                </div>
                <button onClick={()=>sendFriendRequest(foundUser.id)} style={{ background:THEME.accent, border:'none', color:'#fff', padding:'8px 15px', borderRadius:'8px', cursor:'pointer' }}><UserPlus size={16}/></button>
              </div>
            )}

            <h3>СПИСОК КОНТАКТОВ</h3>
            <div style={{ marginTop:'20px', display:'grid', gap:'10px' }}>
               {friends.map(f => (
                 <div key={f.id} style={{ background:THEME.card, padding:'15px', borderRadius:'12px', border:`1px solid ${THEME.border}`, display:'flex', justifyContent:'space-between' }}>
                   <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                     <img src={f.profiles.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} style={{ width:'30px', height:'30px', borderRadius:'50%' }} />
                     <span>{f.profiles.username}</span>
                   </div>
                   {f.status === 'pending' && f.friend_id === profile.id ? (
                     <button onClick={()=>acceptFriend(f.id)} style={{ background:THEME.success, border:'none', color:'#fff', padding:'5px 10px', borderRadius:'5px' }}>ПРИНЯТЬ</button>
                   ) : f.status === 'accepted' ? (
                     <button style={{ background:THEME.accent, border:'none', color:'#fff', padding:'5px 10px', borderRadius:'5px' }}>ЧАТ</button>
                   ) : (
                     <span style={{ color:THEME.muted, fontSize:'11px' }}>ОЖИДАНИЕ...</span>
                   )}
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* МАГАЗИН */}
        {activeTab === "store" && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'20px' }}>
            {storeGifts.map(g => (
              <div key={g.id} style={{ background:THEME.card, borderRadius:'15px', border:`1px solid ${THEME.border}`, overflow:'hidden' }}>
                <div style={{ height:'120px', background:g.bg_color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <img src={g.image_url} style={{ width:'60px' }} />
                </div>
                <div style={{ padding:'15px' }}>
                  <b>{g.name}</b>
                  <div style={{ color:THEME.gold, margin:'5px 0' }}>{g.price} CR</div>
                  <div style={{ display:'flex', gap:'5px' }}>
                    <button style={{ flex:1, background:'#fff', border:'none', padding:'8px', borderRadius:'8px', fontWeight:'bold' }}>КУПИТЬ</button>
                    <button onClick={()=>handleGiftToFriend(g)} style={{ background:THEME.accent, border:'none', color:'#fff', width:'40px', borderRadius:'8px' }}><Gift size={16}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </section>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}

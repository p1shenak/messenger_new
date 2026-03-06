"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, Zap, Lock, Store, MessageSquare, ShieldAlert, CheckCircle2, 
  Ban, Trash2, Edit3, Image as ImageIcon, Sparkles, ShoppingCart
} from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#777', accent: '#2563eb', gold: '#eab308', red: '#dc2626'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => { setMounted(true); checkUser(); }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      setProfile(prof);
      loadInventory(user.id);
      loadStore();
      if (prof?.is_admin) loadAllUsers();
    }
  }

  const loadInventory = async (uid: string) => {
    const { data } = await supabase.from('inventory').select('*, gifts(*)').eq('user_id', uid);
    setInventory(data || []);
  };

  const loadStore = async () => {
    const { data } = await supabase.from('gifts').select('*');
    setStoreGifts(data || []);
  };

  const loadAllUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    setAllUsers(data || []);
  };

  // --- ФУНКЦИИ ПРОФИЛЯ ---
  const updateProfileMedia = async (type: 'avatar_url' | 'banner_url') => {
    const url = prompt(`Введите ссылку на ${type === 'avatar_url' ? 'аватар' : 'баннер'}:`);
    if (url) {
      const { error } = await supabase.from('profiles').update({ [type]: url }).eq('id', profile.id);
      if (!error) window.location.reload();
    }
  };

  // --- ПОКУПКА NFT (С РАНДОМОМ И НОМЕРОМ) ---
  const buyNFT = async (gift: any) => {
    if (gift.max_supply && gift.current_supply >= gift.max_supply) return alert("ЛИМИТ ИСЧЕРПАН!");
    if (profile.balance < gift.price) return alert("НЕДОСТАТОЧНО КРЕДИТОВ!");

    // Генерация рандомных свойств
    const backgrounds = ['#ff0055', '#00ff99', '#0066ff', '#ffcc00', '#9900ff'];
    const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    const nftNumber = (gift.current_supply || 0) + 1;

    // 1. Списание денег
    await supabase.from('profiles').update({ balance: profile.balance - gift.price }).eq('id', profile.id);
    
    // 2. Добавление в инвентарь
    await supabase.from('inventory').insert([{
      user_id: profile.id,
      gift_id: gift.id,
      nft_number: nftNumber,
      metadata: { bg: randomBg, pattern: 'Gen_' + Math.random().toString(36).substring(7) }
    }]);

    // 3. Обновление счетчика в магазине
    await supabase.from('gifts').update({ current_supply: nftNumber }).eq('id', gift.id);

    alert(`Успешно! Вы получили NFT #${nftNumber}`);
    window.location.reload();
  };

  // --- АДМИН ПАНЕЛЬ ---
  const setAccountStatus = async (uid: string, status: string) => {
    if (!confirm(`Изменить статус на ${status}?`)) return;
    await supabase.from('profiles').update({ status: status }).eq('id', uid);
    loadAllUsers();
  };

  if (!mounted) return null;

  // Экран блокировки для забаненных
  if (profile?.status === 'Banned') {
    return <div style={{background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.red, fontSize: '30px', fontWeight: 'bold'}}>ACCESS_DENIED: ACCOUNT_BANNED</div>;
  }

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '280px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '40px', fontWeight: 'bold', fontSize: '22px', color: THEME.accent }}>VOID_OS</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setActiveTab("profile")} style={{ background: activeTab==='profile'?'#111':'none', border:'none', color:'#fff', padding:'12px', borderRadius:'10px', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px' }}><UserCircle size={18}/> ПРОФИЛЬ</button>
          <button onClick={() => setActiveTab("store")} style={{ background: activeTab==='store'?'#111':'none', border:'none', color:'#fff', padding:'12px', borderRadius:'10px', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px' }}><Store size={18}/> МАРКЕТ NFT</button>
          {profile?.is_admin && (
            <button onClick={() => setActiveTab("admin")} style={{ border: `1px solid ${THEME.red}`, color: THEME.red, padding: '12px', borderRadius: '10px', cursor:'pointer', marginTop:'20px' }}><ShieldAlert size={18}/> АДМИНКА</button>
          )}
        </div>
      </nav>

      {/* CONTENT */}
      <section style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* ПРОФИЛЬ */}
        {activeTab === "profile" && (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ height: '200px', background: `url(${profile?.banner_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400'})`, backgroundSize: 'cover', borderRadius: '25px', position: 'relative', border: `1px solid ${THEME.border}` }}>
              <button onClick={() => updateProfileMedia('banner_url')} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', padding: '5px', borderRadius: '50%', cursor: 'pointer' }}><ImageIcon size={16}/></button>
              <div style={{ position: 'absolute', bottom: '-50px', left: '40px' }}>
                <div style={{ position: 'relative' }}>
                  <img src={profile?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} style={{ width: '100px', height: '100px', borderRadius: '50%', border: `5px solid ${THEME.bg}`, objectFit: 'cover' }} />
                  <button onClick={() => updateProfileMedia('avatar_url')} style={{ position: 'absolute', bottom: '0', right: '0', background: THEME.accent, border: 'none', color: '#fff', padding: '5px', borderRadius: '50%', cursor: 'pointer' }}><Edit3 size={14}/></button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '60px', marginLeft: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0 }}>{profile?.username}</h1>
                {profile?.is_admin && <CheckCircle2 size={20} color={THEME.accent} fill={THEME.accent} />}
              </div>
              <p style={{ color: THEME.muted }}>STATUS: {profile?.status}</p>
              
              <h3 style={{ marginTop: '40px' }}>МОЯ КОЛЛЕКЦИЯ</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
                {inventory.map(item => (
                  <div key={item.id} style={{ background: item.metadata?.bg || THEME.card, padding: '10px', borderRadius: '15px', border: `1px solid ${THEME.border}`, textAlign: 'center' }}>
                    {/* Используем обычный img для GIF */}
                    <img src={item.gifts.image_url} style={{ width: '100%', height: '100px', objectFit: 'contain' }} alt="item" />
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '5px' }}>{item.gifts.name}</div>
                    {item.nft_number && <div style={{ fontSize: '10px', color: '#fff', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>#{item.nft_number}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* МАГАЗИН NFT */}
        {activeTab === "store" && (
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Sparkles color={THEME.gold}/> OFFICIAL NFT DROP</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px', marginTop: '20px' }}>
              {storeGifts.map(g => (
                <div key={g.id} style={{ background: THEME.card, borderRadius: '20px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
                  <div style={{ height: '160px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={g.image_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 'bold' }}>{g.name}</div>
                    <div style={{ fontSize: '11px', color: THEME.muted, marginBottom: '10px' }}>Выпуск: {g.current_supply}/{g.max_supply || '∞'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: THEME.gold }}>{g.price} CR</span>
                      <button onClick={() => buyNFT(g)} style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>КУПИТЬ</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* АДМИНКА */}
        {activeTab === "admin" && (
          <div>
            <h2>USER_MANAGEMENT</h2>
            <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
              {allUsers.map(u => (
                <div key={u.id} style={{ background: THEME.card, padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <b>{u.username}</b> 
                    <span style={{ marginLeft: '10px', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: u.status === 'Banned' ? THEME.red : THEME.accent }}>
                      {u.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setAccountStatus(u.id, 'Banned')} style={{ background: 'none', border: `1px solid ${THEME.red}`, color: THEME.red, padding: '5px 10px', borderRadius: '8px' }}><Ban size={14}/></button>
                    <button onClick={() => setAccountStatus(u.id, 'Deleted')} style={{ background: 'none', border: `1px solid ${THEME.muted}`, color: THEME.muted, padding: '5px 10px', borderRadius: '8px' }}><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>
    </main>
  );
}

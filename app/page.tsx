"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const { 
  UserCircle, MessageSquare, ShieldAlert, Send, ShoppingBag, 
  Gift, UserPlus, UserCheck, Search, Ban, Flag, Edit3, Save, Eye, Tag, Sparkles, Coins, Users
} = LucideIcons;

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#777', accent: '#2563eb', gold: '#eab308', mythic: '#a855f7', red: '#dc2626'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [adminSubTab, setAdminSubTab] = useState("items"); // items, reports, grant
  const [profile, setProfile] = useState<any>(null);
  
  // Data State
  const [inventory, setInventory] = useState<any[]>([]);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Interaction State
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);

  // Admin Create State
  const [newGift, setNewGift] = useState({ name: '', image_url: '', price: 0, is_nft: false, rarity: 'common' });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  // Перезагрузка данных при смене вкладок
  useEffect(() => {
    if (profile) {
      if (activeTab === "store") loadStore();
      if (activeTab === "market") loadMarket();
      if (activeTab === "profile") loadInventory(profile.id);
      if (activeTab === "admin") loadAdminData();
    }
  }, [activeTab]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      setProfile(prof);
    }
  }

  const loadStore = async () => {
    const { data } = await supabase.from('gifts').select('*').order('created_at', { ascending: false });
    setStoreGifts(data || []);
  };

  const loadMarket = async () => {
    const { data } = await supabase.from('inventory').select('*, gifts(*), profiles(username)').eq('is_on_sale', true);
    setMarketItems(data || []);
  };

  const loadInventory = async (uid: string) => {
    const { data } = await supabase.from('inventory').select('*, gifts(*)').eq('user_id', uid);
    setInventory(data || []);
  };

  const loadAdminData = async () => {
    const { data: reps } = await supabase.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(username), target:profiles!reports_target_id_fkey(username)');
    setReports(reps || []);
    const { data: usrs } = await supabase.from('profiles').select('*');
    setAllUsers(usrs || []);
  };

  // --- ADMIN ACTIONS ---
  const grantCurrency = async (uid: string) => {
    const amount = prompt("Сколько CR выдать?");
    if (!amount) return;
    const { data: user } = await supabase.from('profiles').select('balance').eq('id', uid).single();
    await supabase.from('profiles').update({ balance: (user?.balance || 0) + parseInt(amount) }).eq('id', uid);
    alert("Валюта выдана!");
    loadAdminData();
  };

  const grantGift = async (uid: string, isNft: boolean) => {
    const gId = prompt("Введите ID подарка из БД:");
    if (!gId) return;
    await supabase.from('inventory').insert([{ 
        user_id: uid, 
        gift_id: gId, 
        nft_id: isNft ? `ADMIN-NFT-${Math.floor(Math.random()*999)}` : null 
    }]);
    alert("Подарок отправлен в инвентарь!");
  };

  const spyOnChat = async (u1: string, u2: string) => {
    const { data } = await supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${u1},receiver_id.eq.${u2}),and(sender_id.eq.${u2},receiver_id.eq.${u1})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setSelectedChat({ username: "⚠️ SYSTEM_VIEW", id: "spy" });
    setActiveTab("chat");
  };

  const getRarityStyle = (rarity: string) => {
    if (rarity === 'rare') return { border: `2px solid ${THEME.gold}`, boxShadow: `0 0 10px ${THEME.gold}44` };
    if (rarity === 'mythic') return { border: `2px solid ${THEME.mythic}`, boxShadow: `0 0 15px ${THEME.mythic}66` };
    return { border: `1px solid ${THEME.border}` };
  };

  if (!mounted) return null;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '250px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ color: THEME.accent, letterSpacing: '2px' }}>VOID_OS</h2>
        <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={18}/> ПРОФИЛЬ</button>
        <button onClick={() => setActiveTab("store")} style={btnTab(activeTab === "store")}><ShoppingBag size={18}/> МАГАЗИН</button>
        <button onClick={() => setActiveTab("market")} style={btnTab(activeTab === "market")}><Tag size={18}/> РЫНОК NFT</button>
        <button onClick={() => setActiveTab("chat")} style={btnTab(activeTab === "chat")}><MessageSquare size={18}/> СВЯЗЬ</button>
        {profile?.is_admin && <button onClick={() => setActiveTab("admin")} style={{...btnTab(activeTab === "admin"), color: THEME.red} as any}><ShieldAlert size={18}/> АДМИНКА</button>}
        
        <div style={{ marginTop: 'auto', background: THEME.card, padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
          <div style={{fontWeight:'bold', color:THEME.gold}}>{profile?.balance} CR</div>
          <div style={{fontSize:'10px', color:THEME.muted}}>{profile?.username}</div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <section style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* STORE */}
        {activeTab === "store" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {storeGifts.map(g => (
              <div key={g.id} style={{ ...cardBase, ...getRarityStyle(g.rarity) }}>
                {g.is_nft && <div style={nftBadge}>NFT</div>}
                <img src={g.image_url} style={{ width: '100%', height: '140px', objectFit: 'contain' }} />
                <div style={{ fontWeight: 'bold', marginTop: '10px' }}>{g.name}</div>
                <div style={{ color: THEME.gold, margin: '10px 0' }}>{g.price} CR</div>
                <button onClick={async () => {
                    if (profile.balance < g.price) return alert("Low balance");
                    await supabase.from('profiles').update({ balance: profile.balance - g.price }).eq('id', profile.id);
                    await supabase.from('inventory').insert([{ user_id: profile.id, gift_id: g.id, nft_id: g.is_nft ? `VOID-${Math.random().toString(36).substr(2, 5)}` : null }]);
                    checkUser();
                }} style={btnAction}>КУПИТЬ</button>
              </div>
            ))}
          </div>
        )}

        {/* MARKET */}
        {activeTab === "market" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {marketItems.map(m => (
              <div key={m.id} style={{ ...cardBase, ...getRarityStyle(m.gifts?.rarity) }}>
                <div style={{fontSize:'10px', color:THEME.muted, marginBottom:'5px'}}>Sellers: {m.profiles?.username}</div>
                <img src={m.gifts?.image_url} style={{ width: '100%', height: '120px', objectFit: 'contain' }} />
                <div style={{ fontWeight: 'bold' }}>{m.gifts?.name}</div>
                <div style={{ color: THEME.accent, margin: '5px 0' }}>{m.price_on_market} CR</div>
                <button style={btnAction}>BUY FROM USER</button>
              </div>
            ))}
          </div>
        )}

        {/* ADMIN COMPLEX */}
        {activeTab === "admin" && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <button onClick={() => setAdminSubTab("items")} style={btnSubTab(adminSubTab === "items")}>ТОВАРЫ</button>
                <button onClick={() => setAdminSubTab("reports")} style={btnSubTab(adminSubTab === "reports")}>ЖАЛОБЫ ({reports.length})</button>
                <button onClick={() => setAdminSubTab("grant")} style={btnSubTab(adminSubTab === "grant")}>ВЫДАЧА</button>
            </div>

            {adminSubTab === "items" && (
                <div style={adminCard}>
                    <h3>СОЗДАТЬ ТОВАР</h3>
                    <input placeholder="Название" onChange={e => setNewGift({...newGift, name: e.target.value})} style={inputStyle} />
                    <input placeholder="GIF URL" onChange={e => setNewGift({...newGift, image_url: e.target.value})} style={inputStyle} />
                    <input type="number" placeholder="Цена" onChange={e => setNewGift({...newGift, price: parseInt(e.target.value)})} style={inputStyle} />
                    <div style={{display:'flex', gap:'10px', margin:'10px 0'}}>
                        <label><input type="checkbox" onChange={e => setNewGift({...newGift, is_nft: e.target.checked})} /> NFT</label>
                        <select onChange={e => setNewGift({...newGift, rarity: e.target.value})} style={selectStyle}>
                            <option value="common">Обычный</option>
                            <option value="rare">Золотой</option>
                            <option value="mythic">Мифический</option>
                        </select>
                    </div>
                    <button onClick={async () => {
                        await supabase.from('gifts').insert([newGift]);
                        alert("Done!"); loadStore();
                    }} style={btnMain}>ОПУБЛИКОВАТЬ</button>
                </div>
            )}

            {adminSubTab === "reports" && (
                <div style={adminCard}>
                    {reports.map(r => (
                        <div key={r.id} style={{ padding: '15px', borderBottom: `1px solid ${THEME.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div>
                                <span style={{color:THEME.accent}}>{r.reporter?.username}</span> ➔ <span style={{color:THEME.red}}>{r.target?.username}</span>
                                <div style={{fontSize:'12px', marginTop:'5px'}}>"{r.reason}"</div>
                            </div>
                            <button onClick={() => spyOnChat(r.reporter_id, r.target_id)} style={btnSpy}><Eye size={14}/> СМОТРЕТЬ ЧАТ</button>
                        </div>
                    ))}
                </div>
            )}

            {adminSubTab === "grant" && (
                <div style={adminCard}>
                    <h3>УПРАВЛЕНИЕ ИГРОКАМИ</h3>
                    {allUsers.map(u => (
                        <div key={u.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px', background:'#000', borderRadius:'10px', marginBottom:'5px' }}>
                            <span>{u.username}</span>
                            <div style={{display:'flex', gap:'5px'}}>
                                <button onClick={() => grantCurrency(u.id)} style={btnSmall}><Coins size={14}/></button>
                                <button onClick={() => grantGift(u.id, false)} style={btnSmall}><Gift size={14}/></button>
                                <button onClick={() => grantGift(u.id, true)} style={{...btnSmall, color:THEME.mythic}}><Sparkles size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        )}

        {/* CHAT / SPY MODE */}
        {activeTab === "chat" && (
            <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
                <div style={{flex: 1, background: THEME.card, borderRadius: '25px', padding: '20px', display: 'flex', flexDirection: 'column'}}>
                    <div style={{flex:1, overflowY:'auto'}}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ textAlign: m.sender_id === profile?.id ? 'right' : 'left', marginBottom: '10px' }}>
                                <span style={{ background: m.sender_id === profile?.id ? THEME.accent : THEME.sidebar, padding: '10px 15px', borderRadius: '15px', display:'inline-block' }}>{m.text}</span>
                            </div>
                        ))}
                    </div>
                    {selectedChat?.id === 'spy' && <div style={{textAlign:'center', color:THEME.red, padding:'10px', fontSize:'12px'}}>РЕЖИМ ПРОСМОТРА АДМИНИСТРАТОРОМ</div>}
                </div>
            </div>
        )}

      </section>
    </main>
  );
}

// СТИЛИ
const btnTab = (active: boolean) => ({ background: active ? THEME.accent : 'none', border: 'none', color: '#fff', padding: '12px 15px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left' as const, fontWeight: 'bold' as const });
const btnSubTab = (active: boolean) => ({ background: active ? '#fff' : 'none', color: active ? '#000' : '#fff', border: `1px solid ${THEME.border}`, padding: '8px 20px', borderRadius: '10px', cursor: 'pointer' });
const inputStyle = { width: '100%' as const, background: '#000', border: `1px solid ${THEME.border}`, color: '#fff', padding: '12px', borderRadius: '12px', marginBottom: '8px', outline: 'none' };
const btnAction = { background: '#fff', color: '#000', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' as const, width: '100%' as const };
const btnMain = { background: THEME.accent, color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold' as const, cursor: 'pointer', width: '100%' as const };
const cardBase: React.CSSProperties = { background: THEME.card, padding: '15px', borderRadius: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position:'relative' };
const nftBadge: React.CSSProperties = { position:'absolute', top:'10px', left:'10px', background:THEME.accent, fontSize:'9px', padding:'2px 6px', borderRadius:'5px' };
const adminCard = { background: THEME.card, padding: '20px', borderRadius: '25px', border: `1px solid ${THEME.border}` };
const btnSpy = { background: THEME.accent, color:'#fff', border:'none', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' };
const btnSmall = { background: THEME.sidebar, border:`1px solid ${THEME.border}`, color:'#fff', padding:'5px', borderRadius:'8px', cursor:'pointer' };
const selectStyle = { background:'#000', color:'#fff', border:`1px solid ${THEME.border}`, borderRadius:'10px', padding:'5px' };

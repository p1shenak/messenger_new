"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

const { 
  UserCircle, MessageSquare, ShieldAlert, Send, ShoppingBag, 
  Gift, UserPlus, UserCheck, Search, Ban, Flag, Edit3, Save, Eye, Tag, Sparkles
} = LucideIcons;

const THEME = {
  bg: '#020202', sidebar: '#080808', card: '#0c0c0c', border: '#1a1a1a',
  text: '#e0e0e0', muted: '#777', accent: '#2563eb', gold: '#eab308', mythic: '#a855f7', red: '#dc2626'
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Данные
  const [inventory, setInventory] = useState<any[]>([]);
  const [storeGifts, setStoreGifts] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  
  // Админ и Создание
  const [newGift, setNewGift] = useState({ name: '', image_url: '', price: 0, is_nft: false, rarity: 'common' });

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

  const loadData = async (uid: string) => {
    // Загрузка Магазина
    const { data: gs } = await supabase.from('gifts').select('*').order('created_at', { ascending: false });
    setStoreGifts(gs || []);

    // Загрузка Инвентаря
    const { data: inv } = await supabase.from('inventory').select('*, gifts(*)').eq('user_id', uid);
    setInventory(inv || []);

    // Загрузка Рынка
    const { data: mkt } = await supabase.from('inventory').select('*, gifts(*), profiles(username)').eq('is_on_sale', true);
    setMarketItems(mkt || []);
  };

  // --- ЛОГИКА ---
  const handlePublish = async () => {
    if (!newGift.name || !newGift.image_url) return alert("Заполни поля!");
    const { error } = await supabase.from('gifts').insert([newGift]);
    if (error) alert("Ошибка: " + error.message);
    else {
      alert("Опубликовано!");
      loadData(profile.id); // Перезагружаем магазин
    }
  };

  const buyFromStore = async (gift: any) => {
    if (profile.balance < gift.price) return alert("Недостаточно CR");
    const { error: updErr } = await supabase.from('profiles').update({ balance: profile.balance - gift.price }).eq('id', profile.id);
    if (!updErr) {
      const nftId = gift.is_nft ? `NFT-${Math.floor(1000 + Math.random() * 9000)}` : null;
      await supabase.from('inventory').insert([{ 
        user_id: profile.id, 
        gift_id: gift.id, 
        nft_id: nftId 
      }]);
      alert("Покупка завершена!");
      checkUser();
    }
  };

  const listOnMarket = async (itemId: string) => {
    const price = prompt("Введите цену продажи (CR):");
    if (!price || isNaN(parseInt(price))) return;
    await supabase.from('inventory').update({ is_on_sale: true, price_on_market: parseInt(price) }).eq('id', itemId);
    alert("Выставлено на рынок!");
    loadData(profile.id);
  };

  const getRarityStyle = (rarity: string) => {
    if (rarity === 'rare') return { border: `2px solid ${THEME.gold}`, boxShadow: `0 0 10px ${THEME.gold}44` };
    if (rarity === 'mythic') return { border: `2px solid ${THEME.mythic}`, boxShadow: `0 0 15px ${THEME.mythic}66` };
    return { border: `1px solid ${THEME.border}` };
  };

  if (!mounted) return null;

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      {/* САЙДБАР */}
      <nav style={{ width: '250px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ color: THEME.accent }}>VOID_OS</h2>
        <button onClick={() => setActiveTab("profile")} style={btnTab(activeTab === "profile")}><UserCircle size={18}/> ПРОФИЛЬ</button>
        <button onClick={() => setActiveTab("store")} style={btnTab(activeTab === "store")}><ShoppingBag size={18}/> МАГАЗИН</button>
        <button onClick={() => setActiveTab("market")} style={btnTab(activeTab === "market")}><Tag size={18}/> РЫНОК NFT</button>
        {profile?.is_admin && <button onClick={() => setActiveTab("admin")} style={{...btnTab(activeTab === "admin"), color: THEME.red} as any}><ShieldAlert size={18}/> АДМИНКА</button>}
        
        <div style={{ marginTop: 'auto', background: THEME.card, padding: '15px', borderRadius: '15px' }}>
          <div style={{fontWeight:'bold', color:THEME.gold}}>{profile?.balance} CR</div>
        </div>
      </nav>

      {/* КОНТЕНТ */}
      <section style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* МАГАЗИН */}
        {activeTab === "store" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {storeGifts.map(g => (
              <div key={g.id} style={{ ...cardBase, ...getRarityStyle(g.rarity) }}>
                {g.is_nft && <div style={nftBadge}>NFT</div>}
                <img src={g.image_url} style={{ width: '100%', height: '120px', objectFit: 'contain' }} />
                <div style={{ fontWeight: 'bold', marginTop: '10px' }}>{g.name}</div>
                <div style={{ color: THEME.gold, margin: '10px 0' }}>{g.price} CR</div>
                <button onClick={() => buyFromStore(g)} style={btnAction}>КУПИТЬ</button>
              </div>
            ))}
          </div>
        )}

        {/* РЫНОК NFT */}
        {activeTab === "market" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {marketItems.map(item => (
              <div key={item.id} style={{ ...cardBase, ...getRarityStyle(item.gifts?.rarity) }}>
                <div style={{fontSize:'10px', color:THEME.muted, marginBottom:'5px'}}>Продавец: {item.profiles?.username}</div>
                <img src={item.gifts?.image_url} style={{ width: '100%', height: '100px', objectFit: 'contain' }} />
                <div style={{ fontWeight: 'bold' }}>{item.gifts?.name}</div>
                <div style={{ color: THEME.accent, margin: '5px 0' }}>{item.price_on_market} CR</div>
                <button style={btnAction}>КУПИТЬ С РЫНКА</button>
              </div>
            ))}
          </div>
        )}

        {/* ПРОФИЛЬ (Инвентарь + Продажа) */}
        {activeTab === "profile" && (
          <div>
            <h3>МОЙ ИНВЕНТАРЬ</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
              {inventory.map(i => (
                <div key={i.id} style={{ ...cardBase, ...getRarityStyle(i.gifts?.rarity) }}>
                  <img src={i.gifts?.image_url} style={{ width: '100%', height: '80px', objectFit: 'contain' }} />
                  <div style={{fontSize:'11px'}}>{i.gifts?.name}</div>
                  {i.nft_id && <div style={{fontSize:'9px', color:THEME.gold}}>{i.nft_id}</div>}
                  {!i.is_on_sale && <button onClick={() => listOnMarket(i.id)} style={{...btnAction, marginTop:'10px', fontSize:'9px'}}>ПРОДАТЬ</button>}
                  {i.is_on_sale && <div style={{fontSize:'9px', color:THEME.red, marginTop:'10px'}}>НА ПРОДАЖЕ</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* АДМИНКА */}
        {activeTab === "admin" && (
          <div style={{ maxWidth: '500px', background: THEME.card, padding: '30px', borderRadius: '25px' }}>
            <h3>СОЗДАТЬ ТОВАР</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="Название" onChange={e => setNewGift({...newGift, name: e.target.value})} style={inputStyle} />
              <input placeholder="URL картинки / GIF" onChange={e => setNewGift({...newGift, image_url: e.target.value})} style={inputStyle} />
              <input type="number" placeholder="Цена в магазине" onChange={e => setNewGift({...newGift, price: parseInt(e.target.value)})} style={inputStyle} />
              
              <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
                <label style={{fontSize:'13px'}}><input type="checkbox" onChange={e => setNewGift({...newGift, is_nft: e.target.checked})} /> Это NFT</label>
                
                <select onChange={e => setNewGift({...newGift, rarity: e.target.value})} style={{...inputStyle, width:'auto', marginBottom:0}}>
                  <option value="common">Обычный (Серый)</option>
                  <option value="rare">Редкий (Золотой)</option>
                  <option value="mythic">Мифический (Фиолет)</option>
                </select>
              </div>

              <button onClick={handlePublish} style={btnMain}><Sparkles size={16}/> ОПУБЛИКОВАТЬ В МАГАЗИН</button>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}

// СТИЛИ
const cardBase: React.CSSProperties = { background: THEME.card, padding: '15px', borderRadius: '20px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' };
const nftBadge: React.CSSProperties = { position: 'absolute', top: '10px', left: '10px', background: THEME.accent, color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '5px', fontWeight: 'bold' };
const btnTab = (active: boolean) => ({ background: active ? THEME.accent : 'none', border: 'none', color: '#fff', padding: '12px 15px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', fontWeight: 'bold' as const });
const inputStyle = { width: '100%' as const, background: '#000', border: `1px solid ${THEME.border}`, color: '#fff', padding: '12px', borderRadius: '12px', marginBottom: '10px' };
const btnMain = { background: THEME.accent, color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold' as const, cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' };
const btnAction = { background: '#fff', color: '#000', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' as const, width: '100%' as const };

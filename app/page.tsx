"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, UserCircle, ShieldAlert, Coins, Send, LogIn, LogOut, Palette, Check, LoaderCircle, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// --- КОНСТАНТЫ СТИЛЕЙ (Киберпанк/Дискорд) ---
const THEME = {
  bg: '#020202',
  sidebar: '#080808',
  card: '#0c0c0c',
  border: '#1a1a1a',
  text: '#e0e0e0',
  muted: '#555',
  accent: '#2563eb', // Основной неон
  gold: '#eab308',
};

// Вспомогательный компонент для кнопок навигации
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
  
  // Состояния для UI
  const [msg, setMsg] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newColor, setNewColor] = useState(THEME.accent);

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
        setNewUsername(prof?.username || "");
        setNewColor(prof?.avatar_color || THEME.accent);
      }
      setLoading(false);
    };
    getData();
  }, []);

  // --- ЛОГИКА ---
  const handleAuth = async () => {
    const email = prompt("Email:"); const pass = prompt("Password:");
    if (!email || !pass) return;
    const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { username: email.split('@')[0] } } });
    if (error) alert(error.message); else alert("Проверьте почту!");
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ username: newUsername, avatar_color: newColor }).eq('id', user.id);
    if (error) alert("Ошибка обновления"); else { alert("VOID профиль обновлен!"); window.location.reload(); }
  };

  if (loading) return (
    <div style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
      <LoaderCircle className="animate-spin" size={32} color={THEME.accent} />
    </div>
  );

  return (
    <main style={{ background: THEME.bg, color: THEME.text, height: '100vh', display: 'flex', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* 1. ЛЕВАЯ ПАНЕЛЬ (NAVIGATION) */}
      <nav style={{ width: '260px', background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', padding: '0 10px' }}>
          <Zap size={22} color={profile?.avatar_color || THEME.accent} style={{ filter: `drop-shadow(0 0 5px ${profile?.avatar_color || THEME.accent})` }} />
          <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-1px', margin:

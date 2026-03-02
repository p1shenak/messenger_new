"use client";

import { useState, useEffect } from "react";
// Импортируем клиент из твоей папки lib, которую мы сохранили
import { createClient } from "@/lib/supabase/client"; 
import { Send, Coins, Lock, Shield } from "lucide-react";

export default function Home() {
  const supabase = createClient();
  const [msg, setMsg] = useState("");
  const [balance, setBalance] = useState(0);

  // Пример того, как мы будем работать с базой в будущем
  useEffect(() => {
    console.log("VOID: Подключение к Supabase активно");
  }, []);

  const handleSend = () => {
    if (!msg.trim()) return;
    // Логика начисления монет
    setBalance(prev => prev + 0.90);
    setMsg("");
    alert("Пакет данных зашифрован и отправлен в сеть.");
  };

  return (
    <main style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ border: '1px solid #222', padding: '40px', borderRadius: '35px', background: '#050505', textAlign: 'center', width: '90%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
          <Shield size={18} color="#2563eb" />
          <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-1px', margin: 0 }}>VOID V1</h1>
        </div>
        
        <p style={{ fontSize: '9px', color: '#444', letterSpacing: '3px', marginBottom: '25px', textTransform: 'uppercase' }}>Secure Database Linked</p>
        
        <div style={{ margin: '20px 0', padding: '20px', background: 'linear-gradient(145deg, #0a0a0a, #111)', borderRadius: '25px', border: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: '10px', color: '#555', marginBottom: '5px' }}>NODE CREDITS</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#eab308' }}>
            <Coins size={20} style={{ marginRight: '8px' }} />
            {balance.toFixed(2)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            value={msg} 
            onChange={(e) => setMsg(e.target.value)} 
            placeholder="Зашифрованное сообщение..." 
            style={{ padding: '18px', borderRadius: '18px', border: '1px solid #222', background: '#0a0a0a', color: '#fff', outline: 'none', fontSize: '14px' }}
          />
          <button 
            onClick={handleSend}
            style={{ padding: '18px', borderRadius: '18px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            ОТПРАВИТЬ <Send size={16} />
          </button>
        </div>

        <div style={{ marginTop: '25px', color: '#222', fontSize: '10px' }}>
          <Lock size={10} /> AES-256 TUNNEL ACTIVE
        </div>
      </div>
    </main>
  );
}

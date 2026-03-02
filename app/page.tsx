"use client";

import { useState, useEffect } from "react";
import { Send, Coins, Shield, Lock, Terminal } from "lucide-react";
// Импорт клиента выносим в динамику через useEffect, чтобы не ломать билд
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [msg, setMsg] = useState("");
  const [balance, setBalance] = useState(0);
  const [status, setStatus] = useState("OFFLINE");

  // Инициализация базы только в браузере
  useEffect(() => {
    try {
      const supabase = createClient();
      if (supabase) {
        setStatus("SECURE NODE ACTIVE");
        console.log("VOID: Канал связи с Supabase установлен");
      }
    } catch (e) {
      console.error("Ошибка подключения:", e);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!msg.trim()) return;

    // Логика начисления (пока локально, чтобы ты видел результат сразу)
    setBalance((prev) => prev + 0.90);
    
    // Эффект отправки
    const currentMsg = msg;
    setMsg("");
    console.log("Отправка зашифрованного пакета:", currentMsg);
    
    // Здесь будет вызов supabase.from('messages').insert(...) после настройки таблицы
  };

  return (
    <main style={{ 
      backgroundColor: '#000', 
      color: '#fff', 
      minHeight: '100vh', 
      fontFamily: 'monospace', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* ОСНОВНОЙ ТЕРМИНАЛ */}
      <div style={{ 
        width: '100%', 
        maxWidth: '450px', 
        border: '1px solid #1a1a1a', 
        borderRadius: '20px', 
        background: '#050505',
        overflow: 'hidden',
        boxShadow: '0 0 40px rgba(37, 99, 235, 0.1)'
      }}>
        
        {/* ХЕДЕР */}
        <div style={{ padding: '20px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="#2563eb" />
            <span style={{ fontWeight: 'bold', letterSpacing: '2px' }}>VOID_OS</span>
          </div>
          <div style={{ fontSize: '10px', color: status.includes("ACTIVE") ? "#22c55e" : "#ef4444" }}>
            ● {status}
          </div>
        </div>

        {/* БАЛАНС */}
        <div style={{ padding: '30px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#444', marginBottom: '10px', textTransform: 'uppercase' }}>Available Credits</div>
          <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Coins size={32} />
            {balance.toFixed(2)}
          </div>
        </div>

        {/* ЭКРАН СООБЩЕНИЙ (ЗАГЛУШКА) */}
        <div style={{ height: '150px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid #111' }}>
          <div style={{ textAlign: 'center', opacity: 0.2 }}>
            <Lock size={24} style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: '10px' }}>END-TO-END ENCRYPTION ENABLED</div>
          </div>
        </div>

        {/* ВВОД */}
        <div style={{ padding: '20px', background: '#0a0a0a', borderTop: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type encrypted packet..."
              style={{ 
                flex: 1, 
                padding: '15px', 
                borderRadius: '12px', 
                border: '1px solid #222', 
                background: '#000', 
                color: '#22c55e',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            <button 
              onClick={handleSendMessage}
              style={{ 
                background: '#2563eb', 
                border: 'none', 
                padding: '15px', 
                borderRadius: '12px', 
                color: '#fff', 
                cursor: 'pointer',
                transition: '0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '10px', color: '#333', textAlign: 'center' }}>
        SYSTEM_ID: {Math.random().toString(16).slice(2, 10).toUpperCase()} <br />
        ENCRYPTION: AES-256-GCM
      </div>
    </main>
  );
}

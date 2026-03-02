"use client";

import { useState, useEffect } from "react";
import { Send, Coins, Lock, Terminal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [msg, setMsg] = useState("");
  const [balance, setBalance] = useState(0);
  const [status, setStatus] = useState("OFFLINE");
  const [systemId, setSystemId] = useState("LOADING...");

  useEffect(() => {
    // 1. Инициализация ID (теперь безопасно для билда)
    setSystemId(Math.random().toString(16).slice(2, 10).toUpperCase());

    // 2. Инициализация базы
    try {
      const supabase = createClient();
      if (supabase) {
        setStatus("SECURE NODE ACTIVE");
      }
    } catch (e) {
      console.error("Ошибка подключения:", e);
    }
  }, []);

  const handleSendMessage = () => {
    if (!msg.trim()) return;
    setBalance((prev) => prev + 0.90);
    setMsg("");
    console.log("Пакет отправлен:", msg);
  };

  return (
    <main style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      
      <div style={{ width: '100%', maxWidth: '450px', border: '1px solid #1a1a1a', borderRadius: '20px', background: '#050505', overflow: 'hidden', boxShadow: '0 0 40px rgba(37, 99, 235, 0.1)' }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="#2563eb" />
            <span style={{ fontWeight: 'bold', letterSpacing: '2px' }}>VOID_OS</span>
          </div>
          <div style={{ fontSize: '10px', color: status.includes("ACTIVE") ? "#22c55e" : "#ef4444" }}>
            ● {status}
          </div>
        </div>

        <div style={{ padding: '30px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#444', marginBottom: '10px', textTransform: 'uppercase' }}>Credits</div>
          <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Coins size={32} />
            {balance.toFixed(2)}
          </div>
        </div>

        <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
          <Lock size={20} />
        </div>

        <div style={{ padding: '20px', background: '#0a0a0a', borderTop: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type message..."
              style={{ flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid #222', background: '#000', color: '#22c55e', outline: 'none' }}
            />
            <button 
              onClick={handleSendMessage}
              style={{ background: '#2563eb', border: 'none', padding: '15px', borderRadius: '12px', color: '#fff', cursor: 'pointer' }}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '10px', color: '#333', textAlign: 'center' }}>
        SYSTEM_ID: {systemId} <br />
        ENCRYPTION: AES-256-GCM
      </div>
    </main>
  );
}

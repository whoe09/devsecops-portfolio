import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [health, setHealth] = useState({ status: 'CHECKING...' });
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Server');

  const fetchHealth = () => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: 'DOWN', database: 'UNREACHABLE' }));
  };

  const fetchItems = () => {
    fetch('/api/items')
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setItems(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchHealth();
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category }),
    });
    setName('');
    fetchItems();
  };

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto', padding: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginTop: 0 }}>🛡️ DevSecOps Security Asset Portal</h2>
      
      <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '6px', background: health.status === 'UP' ? '#e6f4ea' : '#fce8e6' }}>
        <strong>System Health:</strong> {health.status} | <strong>DB:</strong> {health.database || 'N/A'} | <strong>Runtime:</strong> {health.runtime || 'N/A'}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="자산명 입력 (예: prod-bastion-ec2)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1, padding: '8px' }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px' }}>
          <option value="Server">Server</option>
          <option value="Database">Database</option>
          <option value="IAM/Secret">IAM/Secret</option>
        </select>
        <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px' }}>
          자산 등록
        </button>
      </form>

      <h3>등록된 보안 자산 목록 ({items.length})</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id} style={{ padding: '6px 0' }}>
            <strong>[{item.category}]</strong> {item.name} <span style={{ color: '#888', fontSize: '12px' }}>({new Date(item.created_at).toLocaleString()})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

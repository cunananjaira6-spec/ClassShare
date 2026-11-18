import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState(localStorage.getItem('classshare_token'));
    const [user, setUser] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const loadDashboard = async (authToken = token) => {
        try {
            const response = await fetch('/api/announcements', {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Unable to load announcements.');
            }

            const data = await response.json();
            setAnnouncements(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (!token) return;

        const restoreSession = async () => {
            try {
                const response = await fetch('/api/user', { headers });

                if (!response.ok) {
                    throw new Error('Session expired. Please log in again.');
                }

                const data = await response.json();
                setUser(data);
                await loadDashboard(token);
            } catch (err) {
                localStorage.removeItem('classshare_token');
                setToken(null);
                setUser(null);
                setError(err.message);
            }
        };

        restoreSession();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.errors?.email?.[0] || data.message || 'Login failed.');
            }

            localStorage.setItem('classshare_token', data.token);
            setToken(data.token);
            setUser(data.user);
            await loadDashboard(data.token);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers,
            });
        } finally {
            localStorage.removeItem('classshare_token');
            setToken(null);
            setUser(null);
            setAnnouncements([]);
            setPassword('');
        }
    };

    if (!user) {
        return (
            <main style={pageStyle}>
                <section style={cardStyle}>
                    <h1 style={brandStyle}>ClassShare</h1>
                    <p style={subtitleStyle}>Your classroom announcement platform</p>
                    <h2>Login to your account</h2>

                    {error && <p style={errorStyle}>{error}</p>}

                    <form onSubmit={handleLogin}>
                        <label>Email Address</label>
                        <input
                            style={inputStyle}
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />

                        <label>Password</label>
                        <input
                            style={inputStyle}
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />

                        <button style={buttonStyle} disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </section>
            </main>
        );
    }

    return (
        <main style={pageStyle}>
            <section style={{ ...cardStyle, maxWidth: '850px' }}>
                <header style={headerStyle}>
                    <div>
                        <h1 style={brandStyle}>ClassShare</h1>
                        <p style={subtitleStyle}>Classroom Dashboard</p>
                    </div>
                    <button onClick={handleLogout} style={logoutStyle}>
                        Logout
                    </button>
                </header>

                <hr />

                <h2>Welcome, {user.name}!</h2>
                <p>Your role: <strong>{user.role}</strong></p>

                <h2>Announcements</h2>

                {error && <p style={errorStyle}>{error}</p>}

                {announcements.length === 0 ? (
                    <p>No announcements available.</p>
                ) : (
                    announcements.map(item => (
                        <article key={item.id} style={announcementStyle}>
                            <h3>{item.title}</h3>
                            <p>{item.content}</p>
                            <p style={metaStyle}>
                                Category: {item.category?.name || 'Uncategorized'}
                            </p>
                            <p style={metaStyle}>
                                Posted by: {item.user?.name || 'Unknown'}
                            </p>
                            <span style={statusStyle(item.status)}>
                                {item.status}
                            </span>
                        </article>
                    ))
                )}
            </section>
        </main>
    );
}

const pageStyle = {
    minHeight: '100vh',
    background: '#f3f4f6',
    padding: '30px 15px',
    fontFamily: 'Arial, sans-serif',
};

const cardStyle = {
    maxWidth: '400px',
    margin: '40px auto',
    padding: '30px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
};

const brandStyle = { color: '#2563eb', marginBottom: '5px' };
const subtitleStyle = { color: '#6b7280', marginTop: '0' };

const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '12px',
    margin: '8px 0 18px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
};

const buttonStyle = {
    width: '100%',
    padding: '12px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
};

const logoutStyle = {
    padding: '10px 18px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px',
};

const announcementStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '18px',
    marginBottom: '15px',
};

const metaStyle = { color: '#6b7280', fontSize: '13px' };
const errorStyle = {
    color: '#b91c1c',
    background: '#fee2e2',
    padding: '10px',
    borderRadius: '6px',
};

const statusStyle = status => ({
    display: 'inline-block',
    padding: '5px 10px',
    borderRadius: '5px',
    background: status === 'published' ? '#dcfce7' : '#fef3c7',
    color: status === 'published' ? '#166534' : '#92400e',
    fontSize: '12px',
});

const container = document.getElementById('app');

if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

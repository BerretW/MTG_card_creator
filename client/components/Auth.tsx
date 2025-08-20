import React, { useState } from 'react';

interface AuthProps {
    onLoginSuccess: (token: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // URL vašeho back-endu
    // const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const endpoint = isRegistering ? '/auth/register' : '/auth/login';
        
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Došlo k chybě.');
            }

            if (isRegistering) {
                // Po úspěšné registraci přepneme na přihlášení
                setIsRegistering(false);
                alert('Registrace úspěšná! Nyní se můžete přihlásit.');
            } else {
                // Po úspěšném přihlášení zavoláme callback
                onLoginSuccess(data.accessToken);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-sans">
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
                <h1 className="text-4xl font-beleren text-yellow-300 tracking-wider text-center mb-2">
                    {isRegistering ? 'Registrace' : 'Přihlášení'}
                </h1>
                <p className="text-center text-gray-400 mb-6">do MTG Card Creator</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Uživatelské jméno</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Heslo</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                        />
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg disabled:bg-green-800 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Pracuji...' : (isRegistering ? 'Zaregistrovat' : 'Přihlásit')}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-yellow-400 hover:underline">
                        {isRegistering ? 'Máte již účet? Přihlaste se' : 'Nemáte účet? Zaregistrujte se'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
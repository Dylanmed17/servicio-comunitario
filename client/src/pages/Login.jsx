import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const apiBase = window.location.port === '5173'
                ? `${window.location.protocol}//${window.location.hostname}:3000/api`
                : `${window.location.origin}/api`;
            const response = await axios.post(`${apiBase}/auth/login`, { username, password });
            localStorage.setItem('token', response.data.accessToken);
            localStorage.setItem('user', JSON.stringify(response.data));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Error de autenticación');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md shadow-xl border-l-4 border-l-[#ED1C24]">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Acceso Administrativo</CardTitle>
                    <CardDescription>E.B.D. "José Antonio González"</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-md">Usuario</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="text-md py-6"
                                placeholder="admin"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-md">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="text-md py-6"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-md text-sm font-medium bg-red-100 text-red-700">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full bg-[#ED1C24] hover:bg-[#c4161c] text-white py-6 text-lg">
                            Ingresar al Sistema
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 justify-center text-xs text-muted-foreground">
                    <p>Sistema de Gestión Digital v1.0</p>
                    <div className="w-full border-t border-gray-200 pt-4 mt-2">
                        <Button
                            variant="ghost"
                            className="w-full text-gray-500 hover:text-[#ED1C24] hover:bg-red-50 transition-colors"
                            onClick={() => window.location.href = '/'}
                        >
                            &larr; Volver al Inicio
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;

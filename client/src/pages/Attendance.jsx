import React, { useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const Attendance = () => {
    const [cedula, setCedula] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState(''); // 'success' or 'error'

    const handleAttendance = async (e) => {
        e.preventDefault();
        setMessage('');
        setStatus('');

        if (!cedula) return;

        try {
            const response = await axios.post('http://localhost:3000/api/attendance', { cedula });
            setMessage(response.data.message);
            setStatus('success');
            setCedula('');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error al registrar asistencia');
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md shadow-xl border-l-4 border-l-[#ED1C24]">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Control de Asistencia</CardTitle>
                    <CardDescription>U.E.N. "Cardenal José Humberto Quintero"</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAttendance} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cedula">Ingrese su Cédula</Label>
                            <Input
                                id="cedula"
                                type="text"
                                placeholder="V-12345678"
                                value={cedula}
                                onChange={(e) => setCedula(e.target.value)}
                                className="text-lg py-6"
                                autoFocus
                            />
                        </div>
                        {message && (
                            <div className={`p-3 rounded-md text-sm font-medium ${status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message}
                            </div>
                        )}
                        <Button type="submit" className="w-full bg-[#ED1C24] hover:bg-[#c4161c] text-white py-6 text-lg">
                            Marcar Asistencia
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 justify-center text-xs text-muted-foreground">
                    <p>Sistema de Gestión Digital v1.0</p>
                    <div className="w-full border-t border-gray-200 pt-4 mt-2">
                        <Button
                            variant="ghost"
                            className="w-full text-gray-500 hover:text-[#ED1C24] hover:bg-red-50 transition-colors"
                            onClick={() => window.location.href = '/dashboard'}
                        >
                            Acceso Administrativo
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Attendance;

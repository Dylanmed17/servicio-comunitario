import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Clock, UserCheck, QrCode, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

const QrScan = () => {
    const [savedDocente, setSavedDocente] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state for first-time onboarding
    const [formData, setFormData] = useState({
        cedula: '',
        nombre: '',
        apellido: ''
    });

    // Result state
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // Check if device already has saved credentials
        const saved = localStorage.getItem('docente_identidad');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.cedula) {
                    setSavedDocente(parsed);
                    // Automatic recognition and marking
                    autoMarkAttendance(parsed.cedula);
                    return;
                }
            } catch (e) {
                localStorage.removeItem('docente_identidad');
            }
        }
        setIsChecking(false);
    }, []);

    const getApiUrl = () => {
        if (window.location.port === '5173') {
            return `${window.location.protocol}//${window.location.hostname}:3000/api/attendance/qr-scan`;
        }
        return `${window.location.origin}/api/attendance/qr-scan`;
    };

    const autoMarkAttendance = async (cedula) => {
        setIsChecking(true);
        setErrorMsg('');
        try {
            const res = await axios.post(getApiUrl(), { cedula });
            if (res.data.needsRegistration) {
                // If not found in DB, clear localStorage and ask to register
                localStorage.removeItem('docente_identidad');
                setSavedDocente(null);
                setFormData(prev => ({ ...prev, cedula }));
                setErrorMsg(res.data.message);
            } else {
                setResult(res.data);
                // Update stored info with official DB names
                if (res.data.profesor) {
                    localStorage.setItem('docente_identidad', JSON.stringify({
                        cedula: res.data.profesor.cedula,
                        nombre: res.data.profesor.nombre,
                        apellido: res.data.profesor.apellido
                    }));
                }
            }
        } catch (err) {
            console.error('Error auto-marking attendance:', err);
            setErrorMsg(err.response?.data?.message || err.response?.data?.error || err.message || 'Error al conectar con el servidor.');
        } finally {
            setIsChecking(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.cedula || !formData.nombre || !formData.apellido) {
            setErrorMsg('Por favor complete todos los campos.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await axios.post(getApiUrl(), {
                cedula: formData.cedula.trim(),
                nombre: formData.nombre.trim(),
                apellido: formData.apellido.trim()
            });

            if (res.data.profesor) {
                const identity = {
                    cedula: res.data.profesor.cedula,
                    nombre: res.data.profesor.nombre,
                    apellido: res.data.profesor.apellido
                };
                localStorage.setItem('docente_identidad', JSON.stringify(identity));
                setSavedDocente(identity);
            }

            setResult(res.data);
        } catch (err) {
            console.error('Error registering attendance:', err);
            setErrorMsg(err.response?.data?.message || err.response?.data?.error || err.message || 'Error al registrar asistencia.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetIdentity = () => {
        if (confirm('¿Deseas desvincular este dispositivo para ingresar con otra cédula?')) {
            localStorage.removeItem('docente_identidad');
            setSavedDocente(null);
            setResult(null);
            setFormData({ cedula: '', nombre: '', apellido: '' });
            setErrorMsg('');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                
                {/* 1. Loading State */}
                {isChecking && (
                    <Card className="shadow-lg text-center p-8 border-t-4 border-t-[#ED1C24] bg-white rounded-xl">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-[#ED1C24] border-t-transparent rounded-full animate-spin"></div>
                            <h3 className="text-lg font-semibold text-gray-800">Reconociendo identidad...</h3>
                            <p className="text-sm text-gray-500">Procesando marcaje de asistencia institucional</p>
                        </div>
                    </Card>
                )}

                {/* 2. Success Result View */}
                {!isChecking && result && (
                    <Card className="shadow-xl border border-gray-100 overflow-hidden bg-white rounded-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className={`p-6 text-center text-white ${
                            result.type === 'Entrada' ? 'bg-gradient-to-r from-green-600 to-emerald-500' :
                            result.type === 'Salida' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' :
                            'bg-gradient-to-r from-gray-700 to-gray-800'
                        }`}>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-3 backdrop-blur-sm">
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold">¡Asistencia Registrada!</h2>
                            <p className="text-white/90 text-sm mt-1">E.B.D. "José Antonio González"</p>
                        </div>

                        <CardContent className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Docente</p>
                                <h3 className="text-xl font-bold text-gray-800 mt-1">
                                    {result.profesor?.nombre} {result.profesor?.apellido}
                                </h3>
                                <p className="text-sm text-gray-500 font-mono mt-0.5">{result.profesor?.cedula}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-500 font-medium">Tipo</p>
                                    <span className={`inline-block mt-1 font-bold text-sm px-2.5 py-0.5 rounded-full ${
                                        result.type === 'Entrada' ? 'bg-green-100 text-green-700' :
                                        result.type === 'Salida' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {result.type}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-500 font-medium">Hora</p>
                                    <p className="text-sm font-bold text-gray-800 mt-1 flex items-center justify-center font-mono">
                                        <Clock className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                        {result.hora || result.horaEntrada}
                                    </p>
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-xs text-green-800 text-center">
                                {result.message}
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-2 p-6 pt-0 border-t border-gray-50">
                            <Button 
                                className="w-full bg-[#ED1C24] hover:bg-[#c4161c] text-white py-5 font-semibold text-sm shadow-md transition-all"
                                onClick={() => setResult(null)}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Volver / Listo
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full text-xs text-gray-500 hover:text-gray-700"
                                onClick={() => autoMarkAttendance(result.profesor?.cedula)}
                            >
                                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-verificar marcaje
                            </Button>
                            <button
                                onClick={handleResetIdentity}
                                className="text-xs text-gray-400 hover:text-[#ED1C24] underline transition-colors pt-2 cursor-pointer"
                            >
                                ¿No eres tú? Cambiar de usuario o cédula
                            </button>
                        </CardFooter>
                    </Card>
                )}

                {/* 3. Existing User Ready Card (when user clicks Volver or is ready to mark) */}
                {!isChecking && !result && savedDocente && (
                    <Card className="shadow-xl border border-gray-100 bg-white rounded-xl overflow-hidden animate-in fade-in">
                        <CardHeader className="text-center bg-gradient-to-b from-gray-50 to-white pb-6 border-b border-gray-100">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-[#ED1C24] mb-2 mx-auto">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-800">
                                ¡Hola, {savedDocente.nombre}!
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500 font-mono">
                                Cédula: {savedDocente.cedula}
                            </CardDescription>
                            <div className="mt-3 bg-green-50 text-green-700 text-xs p-2 rounded-lg border border-green-100">
                                Dispositivo vinculado correctamente
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-4">
                            {errorMsg && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start">
                                    <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <p className="text-xs text-gray-500 text-center">
                                Pulsa el botón para registrar tu salida o actualizar tu asistencia en la <strong>E.B.D. "José Antonio González"</strong>:
                            </p>

                            <Button
                                onClick={() => autoMarkAttendance(savedDocente.cedula)}
                                className="w-full bg-[#ED1C24] hover:bg-[#c4161c] text-white py-6 font-semibold text-sm shadow-md flex items-center justify-center"
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                Marcar Salida / Actualizar Asistencia
                            </Button>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-2 p-6 pt-0 border-t border-gray-50 text-center">
                            <button
                                onClick={handleResetIdentity}
                                className="text-xs text-gray-400 hover:text-[#ED1C24] underline pt-2 cursor-pointer"
                            >
                                ¿No eres tú? Cambiar de usuario o cédula
                            </button>
                        </CardFooter>
                    </Card>
                )}

                {/* 4. First-time Registration Form View (only if no saved identity) */}
                {!isChecking && !result && !savedDocente && (
                    <Card className="shadow-xl border border-gray-100 bg-white rounded-xl overflow-hidden">
                        <CardHeader className="text-center bg-gradient-to-b from-gray-50 to-white pb-6 border-b border-gray-100">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-[#ED1C24] mb-2 mx-auto">
                                <QrCode className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-800">
                                Registro de Asistencia QR
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500">
                                E.B.D. "José Antonio González"
                            </CardDescription>
                            <div className="mt-3 bg-blue-50 text-blue-700 text-xs p-2.5 rounded-lg border border-blue-100 text-left">
                                <span className="font-semibold block mb-0.5">ℹ️ Registro por primera vez</span>
                                Ingrese sus datos una sola vez. En los próximos días este dispositivo lo reconocerá de forma automática.
                            </div>
                        </CardHeader>

                        <CardContent className="p-6">
                            {errorMsg && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start">
                                    <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="cedula" className="text-xs font-semibold text-gray-700">Cédula de Identidad</Label>
                                    <Input
                                        id="cedula"
                                        placeholder="V-12345678"
                                        value={formData.cedula}
                                        onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="nombre" className="text-xs font-semibold text-gray-700">Nombre</Label>
                                    <Input
                                        id="nombre"
                                        placeholder="Ej: Carlos"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="apellido" className="text-xs font-semibold text-gray-700">Apellido</Label>
                                    <Input
                                        id="apellido"
                                        placeholder="Ej: Pérez"
                                        value={formData.apellido}
                                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-[#ED1C24] hover:bg-[#c4161c] text-white py-6 font-semibold text-base shadow-md transition-all mt-2"
                                >
                                    {submitting ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Guardando y Marcando...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center space-x-2">
                                            <UserCheck className="w-5 h-5 mr-1" />
                                            <span>Registrar y Marcar Asistencia</span>
                                        </div>
                                    )}
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="text-center justify-center pb-6 pt-0 text-xs text-gray-400">
                            DigitalCheck • Sistema Escolar Inteligente
                        </CardFooter>
                    </Card>
                )}

            </div>
        </div>
    );
};

export default QrScan;

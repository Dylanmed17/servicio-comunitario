import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { QrCode, Keyboard, ExternalLink, Printer, CheckCircle2, AlertCircle, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';

const Attendance = () => {
    // Mode: 'qr' | 'manual'
    const [mode, setMode] = useState('qr');

    // Manual form state
    const [cedula, setCedula] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState(''); // 'success' or 'error'
    const [loading, setLoading] = useState(false);

    // QR Configuration
    const [customHost, setCustomHost] = useState('');
    const [showHostInput, setShowHostInput] = useState(false);

    // Determine the base URL for the QR code
    const currentOrigin = window.location.origin;
    const scanUrl = customHost 
        ? `${window.location.protocol}//${customHost}:5173/scan` 
        : `${currentOrigin}/scan`;

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(scanUrl)}&margin=8&color=111827`;

    const handleManualAttendance = async (e) => {
        e.preventDefault();
        setMessage('');
        setStatus('');

        if (!cedula) return;

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:3000/api/attendance', { cedula });
            setMessage(response.data.message);
            setStatus('success');
            setCedula('');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error al registrar asistencia');
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const handlePrintPoster = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor permita ventanas emergentes para imprimir el cartel.');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Cartel de Asistencia QR - E.B.D. José Antonio González</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        margin: 0;
                        padding: 40px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        color: #1f2937;
                    }
                    .poster-card {
                        border: 4px solid #ED1C24;
                        border-radius: 24px;
                        padding: 48px;
                        max-width: 580px;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                    }
                    .institution-badge {
                        background-color: #ED1C24;
                        color: white;
                        padding: 8px 24px;
                        border-radius: 50px;
                        font-size: 16px;
                        font-weight: bold;
                        letter-spacing: 1px;
                        display: inline-block;
                        margin-bottom: 20px;
                    }
                    h1 {
                        font-size: 32px;
                        margin: 0 0 8px 0;
                        color: #111827;
                    }
                    h2 {
                        font-size: 20px;
                        color: #4b5563;
                        margin: 0 0 32px 0;
                        font-weight: 500;
                    }
                    .qr-container {
                        background: #ffffff;
                        padding: 20px;
                        border-radius: 16px;
                        border: 2px dashed #d1d5db;
                        display: inline-block;
                        margin-bottom: 28px;
                    }
                    .qr-container img {
                        width: 280px;
                        height: 280px;
                        display: block;
                    }
                    .instructions {
                        background: #f9fafb;
                        border-radius: 12px;
                        padding: 16px 24px;
                        font-size: 15px;
                        line-height: 1.6;
                        color: #374151;
                        text-align: left;
                    }
                    .instructions ol {
                        margin: 0;
                        padding-left: 20px;
                    }
                    .instructions li {
                        margin-bottom: 6px;
                    }
                    .footer-note {
                        margin-top: 28px;
                        font-size: 13px;
                        color: #9ca3af;
                    }
                    @media print {
                        body { padding: 0; }
                        .poster-card { border: 3px solid #ED1C24; }
                    }
                </style>
            </head>
            <body>
                <div class="poster-card">
                    <div class="institution-badge">SISTEMA DE ASISTENCIA DIGITAL</div>
                    <h1>E.B.D. "José Antonio González"</h1>
                    <h2>Control Inteligente de Entrada y Salida</h2>

                    <div class="qr-container">
                        <img src="${qrImageUrl}" alt="Código QR de Asistencia" />
                    </div>

                    <div class="instructions">
                        <strong>¿Cómo marcar mi asistencia?</strong>
                        <ol>
                            <li>Abre la cámara de tu teléfono móvil y apunta al código QR.</li>
                            <li><strong>Primera vez:</strong> Completa tu Cédula, Nombre y Apellido.</li>
                            <li><strong>Próximas veces:</strong> El sistema te reconocerá en 1 segundo de forma automática.</li>
                        </ol>
                    </div>

                    <div class="footer-note">
                        Ubicación: Recepción • DigitalCheck v2.0
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/80 p-4">
            <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-[#ED1C24] bg-white rounded-xl overflow-hidden">
                <CardHeader className="text-center pb-4 border-b border-gray-100">
                    <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#ED1C24] text-xs font-semibold uppercase tracking-wider mb-2 mx-auto">
                        <Sparkles className="w-3.5 h-3.5" />
                        Control de Asistencia Digital
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
                        E.B.D. "José Antonio González"
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                        Seleccione el método de registro de su jornada laboral
                    </CardDescription>

                    {/* Mode Selector Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg mt-4 max-w-xs mx-auto">
                        <button
                            type="button"
                            onClick={() => setMode('qr')}
                            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                                mode === 'qr' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            <QrCode className="w-4 h-4 mr-1.5 text-[#ED1C24]" />
                            Código QR (Móvil)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('manual')}
                            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                                mode === 'manual' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            <Keyboard className="w-4 h-4 mr-1.5 text-gray-600" />
                            Cédula Manual
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* TAB 1: QR Code Mode */}
                    {mode === 'qr' && (
                        <div className="flex flex-col items-center text-center space-y-5 animate-in fade-in duration-200">
                            {/* QR Frame */}
                            <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-[#ED1C24]/30 shadow-inner group hover:border-[#ED1C24] transition-all">
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                    <img 
                                        src={qrImageUrl} 
                                        alt="Código QR de Asistencia" 
                                        className="w-56 h-56 object-contain rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Instructions List */}
                            <div className="w-full bg-gray-50 rounded-xl p-4 border border-gray-100 text-left text-xs space-y-2.5">
                                <div className="flex items-start space-x-2.5">
                                    <div className="w-5 h-5 rounded-full bg-red-100 text-[#ED1C24] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                        1
                                    </div>
                                    <p className="text-gray-600">
                                        <strong className="text-gray-800">Escanea con tu celular:</strong> Apunta la cámara hacia el código QR.
                                    </p>
                                </div>
                                <div className="flex items-start space-x-2.5">
                                    <div className="w-5 h-5 rounded-full bg-red-100 text-[#ED1C24] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                        2
                                    </div>
                                    <p className="text-gray-600">
                                        <strong className="text-gray-800">Registro inicial:</strong> La primera vez completa tu Cédula, Nombre y Apellido.
                                    </p>
                                </div>
                                <div className="flex items-start space-x-2.5">
                                    <div className="w-5 h-5 rounded-full bg-red-100 text-[#ED1C24] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                        3
                                    </div>
                                    <p className="text-gray-600">
                                        <strong className="text-gray-800">Reconocimiento automático:</strong> Las siguientes veces marcarás asistencia en 1 segundo.
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="w-full grid grid-cols-2 gap-3 pt-1">
                                <Button
                                    variant="outline"
                                    onClick={() => window.open('/scan', '_blank')}
                                    className="w-full text-xs font-medium text-gray-700 hover:text-gray-900 border-gray-200"
                                >
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                                    Probar en Navegador
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handlePrintPoster}
                                    className="w-full text-xs font-medium text-gray-700 hover:text-gray-900 border-gray-200"
                                >
                                    <Printer className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                                    Imprimir Cartel QR
                                </Button>
                            </div>

                            {/* Network IP configuration helper (if scanning from separate phone on Wi-Fi) */}
                            <div className="w-full pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowHostInput(!showHostInput)}
                                    className="text-[11px] text-gray-400 hover:text-gray-600 underline"
                                >
                                    {showHostInput ? 'Ocultar ajustes de red' : '⚙️ Configurar IP de red para escaneo Wi-Fi'}
                                </button>

                                {showHostInput && (
                                    <div className="mt-3 p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-left text-xs space-y-2">
                                        <p className="text-blue-900 font-medium">IP local de la computadora:</p>
                                        <p className="text-gray-500 text-[11px]">
                                            Si escaneas desde tu teléfono móvil conectado a la misma red Wi-Fi, ingresa la IP de esta PC (ej: <code>192.168.1.15</code>) para que el QR abra la dirección correcta:
                                        </p>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Ej: 192.168.110.119"
                                                value={customHost}
                                                onChange={(e) => setCustomHost(e.target.value.trim())}
                                                className="h-8 text-xs bg-white"
                                            />
                                            {customHost && (
                                                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setCustomHost('')}>
                                                    Restablecer
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Manual Cédula Mode */}
                    {mode === 'manual' && (
                        <form onSubmit={handleManualAttendance} className="space-y-4 animate-in fade-in duration-200">
                            <div className="space-y-2">
                                <Label htmlFor="cedula" className="text-sm font-semibold text-gray-700">
                                    Ingrese su Cédula de Identidad
                                </Label>
                                <Input
                                    id="cedula"
                                    type="text"
                                    placeholder="V-12345678"
                                    value={cedula}
                                    onChange={(e) => setCedula(e.target.value)}
                                    className="text-base py-5 tracking-wider"
                                    autoFocus
                                    required
                                />
                            </div>

                            {message && (
                                <div className={`p-3 rounded-lg text-xs font-medium flex items-center ${
                                    status === 'success' 
                                        ? 'bg-green-50 text-green-700 border border-green-200' 
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                    {status === 'success' ? (
                                        <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                                    )}
                                    <span>{message}</span>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-[#ED1C24] hover:bg-[#c4161c] text-white py-6 text-base font-semibold shadow-md transition-all"
                            >
                                {loading ? 'Registrando...' : 'Marcar Asistencia'}
                            </Button>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3 justify-center text-xs text-muted-foreground border-t border-gray-100 bg-gray-50/50 p-4">
                    <p className="font-medium text-gray-400">DigitalCheck • Sistema de Gestión Escolar v2.0</p>
                    <div className="w-full border-t border-gray-200/60 pt-3">
                        <Button
                            variant="ghost"
                            className="w-full text-xs text-gray-500 hover:text-[#ED1C24] hover:bg-red-50 transition-colors h-8"
                            onClick={() => window.location.href = '/dashboard'}
                        >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                            Acceso Administrativo
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Attendance;

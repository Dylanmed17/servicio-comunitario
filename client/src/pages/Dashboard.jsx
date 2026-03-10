import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LayoutDashboard, Users, LogOut, Clock, CalendarDays, List, LayoutGrid } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });
    const [personnel, setPersonnel] = useState([]);
    
    // UI State
    const [activeTab, setActiveTab] = useState('monitoreo'); // 'monitoreo' or 'personal'
    const [monitoringView, setMonitoringView] = useState('timeline'); // 'timeline' or 'table'

    // Form State (Personnel CRUD)
    const [formData, setFormData] = useState({ id: null, cedula: '', nombre: '', apellido: '', cargo: '', telefono: '' });
    const [isEditing, setIsEditing] = useState(false);
    
    // Mock Data for Timeline until backend is ready
    const [attendances, setAttendances] = useState([]);

    const token = localStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchStats();
        fetchPersonnel();
        // Here we will eventually fetch today's attendances
        setAttendances([
            { id: 1, nombre: 'Admin Seed', hora: '07:05 AM', estado: 'A tiempo', tipo: 'Entrada' }
        ]);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/dashboard/stats', authHeader);
            setStats(res.data);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401) handleLogout();
        }
    };

    const fetchPersonnel = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/personnel', authHeader);
            setPersonnel(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // --- Personnel CRUD Handlers ---
    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put(`http://localhost:3000/api/personnel/${formData.id}`, formData, authHeader);
            } else {
                await axios.post('http://localhost:3000/api/personnel', formData, authHeader);
            }
            setFormData({ id: null, cedula: '', nombre: '', apellido: '', cargo: '', telefono: '' });
            setIsEditing(false);
            fetchPersonnel();
            fetchStats();
        } catch (error) {
            alert('Error al guardar: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleEdit = (p) => { setFormData(p); setIsEditing(true); };

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de eliminar este personal?')) {
            try {
                await axios.delete(`http://localhost:3000/api/personnel/${id}`, authHeader);
                fetchPersonnel();
                fetchStats();
            } catch (error) {
                console.error(error);
            }
        }
    };

    // --- Sub-components for Views ---

    const renderMonitoreo = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Monitoreo en Vivo</h2>
                    <p className="text-sm text-gray-500">Registro de entradas y salidas del día de hoy.</p>
                </div>
                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                    <Button 
                        variant={monitoringView === 'timeline' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setMonitoringView('timeline')}
                        className={monitoringView === 'timeline' ? 'bg-[#ED1C24] hover:bg-[#c4161c]' : 'text-gray-500'}
                    >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Timeline
                    </Button>
                    <Button 
                        variant={monitoringView === 'table' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setMonitoringView('table')}
                        className={monitoringView === 'table' ? 'bg-[#ED1C24] hover:bg-[#c4161c]' : 'text-gray-500'}
                    >
                        <List className="w-4 h-4 mr-2" />
                        Tabla
                    </Button>
                </div>
            </div>

            {monitoringView === 'timeline' ? (
                <div className="grid gap-4">
                    {attendances.map((att) => (
                        <Card key={att.id} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                                        {att.nombre.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{att.nombre}</p>
                                        <p className="text-sm text-gray-500">Marcó {att.tipo}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">{att.hora}</p>
                                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                        {att.estado}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {attendances.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No hay marcajes registrados hoy.</p>
                    )}
                </div>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Empleado</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Hora</th>
                                    <th className="px-4 py-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendances.map((att) => (
                                    <tr key={att.id} className="border-b">
                                        <td className="px-4 py-3 font-medium">{att.nombre}</td>
                                        <td className="px-4 py-3">{att.tipo}</td>
                                        <td className="px-4 py-3 font-mono">{att.hora}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-green-600 font-medium">{att.estado}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );

    const renderPersonal = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-fit shadow-sm border-t-4 border-t-[#ED1C24]">
                <CardHeader>
                    <CardTitle>{isEditing ? 'Editar Personal' : 'Nuevo Personal'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="cedula">Cédula</Label>
                            <Input name="cedula" value={formData.cedula} onChange={handleInputChange} placeholder="V-12345678" required />
                        </div>
                        <div>
                            <Label htmlFor="nombre">Nombre</Label>
                            <Input name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Juan" required />
                        </div>
                        <div>
                            <Label htmlFor="apellido">Apellido</Label>
                            <Input name="apellido" value={formData.apellido} onChange={handleInputChange} placeholder="Pérez" required />
                        </div>
                        <div>
                            <Label htmlFor="cargo">Cargo</Label>
                            <Input name="cargo" value={formData.cargo} onChange={handleInputChange} placeholder="Docente" required />
                        </div>
                        <div>
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder="0414-1234567" />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" className="w-full bg-[#ED1C24] hover:bg-[#c4161c]">{isEditing ? 'Actualizar' : 'Guardar'}</Button>
                            {isEditing && (
                                <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setFormData({ id: null, cedula: '', nombre: '', apellido: '', cargo: '', telefono: '' }); }}>
                                    Cancelar
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-sm">
                <CardHeader>
                    <CardTitle>Nómina de Personal</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-y">
                                <tr>
                                    <th className="px-4 py-3">Cédula</th>
                                    <th className="px-4 py-3">Nombre</th>
                                    <th className="px-4 py-3">Cargo</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {personnel.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-8 text-gray-500">No hay personal registrado en el sistema.</td></tr>
                                ) : (
                                    personnel.map((p) => (
                                        <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{p.cedula}</td>
                                            <td className="px-4 py-3">{p.nombre} {p.apellido}</td>
                                            <td className="px-4 py-3 text-gray-600">{p.cargo}</td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>Editar</Button>
                                                <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" size="sm" onClick={() => handleDelete(p.id)}>
                                                    Eliminar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r shadow-sm flex flex-col hidden md:flex">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                        DigitalCheck
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">U.E.N. Cardenal Quintero</p>
                </div>
                
                <div className="flex-1 py-6 px-4 space-y-2">
                    <Button 
                        variant={activeTab === 'monitoreo' ? 'secondary' : 'ghost'} 
                        className={`w-full justify-start ${activeTab === 'monitoreo' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('monitoreo')}
                    >
                        <Clock className="mr-3 h-5 w-5" />
                        Monitoreo en Vivo
                    </Button>
                    <Button 
                        variant={activeTab === 'personal' ? 'secondary' : 'ghost'} 
                        className={`w-full justify-start ${activeTab === 'personal' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('personal')}
                    >
                        <Users className="mr-3 h-5 w-5" />
                        Gestión de Personal
                    </Button>
                    <Button 
                        variant="ghost" 
                        disabled
                        className="w-full justify-start text-gray-400"
                    >
                        <CalendarDays className="mr-3 h-5 w-5" />
                        Historial (Próximamente)
                    </Button>
                </div>

                <div className="p-4 border-t">
                    <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50 cursor-pointer" onClick={handleLogout}>
                        <LogOut className="mr-3 h-5 w-5" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar for mobile could go here */}
                
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-6xl mx-auto space-y-8">
                        
                        {/* Fixed Metrics Header */}
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800 mb-6">Resumen del Día</h1>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="shadow-sm border-none bg-gradient-to-br from-white to-gray-50">
                                    <CardContent className="p-6">
                                        <p className="text-sm font-medium text-gray-500">Total Plantel</p>
                                        <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</h3>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-sm border-none bg-gradient-to-br from-green-50 to-white">
                                    <CardContent className="p-6">
                                        <p className="text-sm font-medium text-green-600">Presentes Hoy</p>
                                        <h3 className="text-3xl font-bold text-green-700 mt-2">{stats.present}</h3>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-sm border-none bg-gradient-to-br from-red-50 to-white">
                                    <CardContent className="p-6">
                                        <p className="text-sm font-medium text-red-600">Ausentes Hoy</p>
                                        <h3 className="text-3xl font-bold text-red-700 mt-2">{stats.absent}</h3>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-sm border-none bg-gradient-to-br from-yellow-50 to-white">
                                    <CardContent className="p-6">
                                        <p className="text-sm font-medium text-yellow-600">Retrasos Hoy</p>
                                        <h3 className="text-3xl font-bold text-yellow-700 mt-2">--</h3>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Dynamic View Content */}
                        <div className="mt-8">
                            {activeTab === 'monitoreo' && renderMonitoreo()}
                            {activeTab === 'personal' && renderPersonal()}
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;

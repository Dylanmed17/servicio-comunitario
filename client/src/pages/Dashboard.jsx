import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LayoutDashboard, Users, LogOut, Clock, CalendarDays, List, LayoutGrid, Search } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, retrasos: 0 });
    const [personnel, setPersonnel] = useState([]);

    // UI State
    const [activeTab, setActiveTab] = useState('monitoreo'); // 'monitoreo', 'personal', 'historial'
    const [monitoringView, setMonitoringView] = useState('timeline'); // 'timeline' or 'table'

    // Form State (Personnel CRUD)
    const [formData, setFormData] = useState({ id: null, cedula: '', nombre: '', apellido: '', cargo: '', telefono: '' });
    const [isEditing, setIsEditing] = useState(false);

    // Timeline State
    const [attendances, setAttendances] = useState([]);

    // History State
    const [history, setHistory] = useState([]);
    const [historyFilters, setHistoryFilters] = useState({
        startDate: '2026-03-01', // Default for seed data visibility
        endDate: '2026-03-09',
        cedula: '',
        estado: 'Todos'
    });

    const token = localStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchStats();
        fetchPersonnel();
        fetchAttendances();
        fetchHistory(); // Base fetch
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

    const fetchAttendances = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/dashboard/attendances/today', authHeader);
            setAttendances(res.data);
        } catch (error) {
            console.error('Error fetching attendances:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const params = new URLSearchParams(historyFilters).toString();
            const res = await axios.get(`http://localhost:3000/api/dashboard/attendances/history?${params}`, authHeader);
            setHistory(res.data);
        } catch (error) {
            console.error('Error fetching history:', error);
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

    // --- History Filter Handlers ---
    const handleFilterChange = (e) => {
        setHistoryFilters({ ...historyFilters, [e.target.name]: e.target.value });
    };

    const submitFilter = (e) => {
        e.preventDefault();
        fetchHistory();
    }

    // --- Sub-components for Views ---

    const renderMonitoreo = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Monitoreo en Vivo (Hoy)</h2>
                    <p className="text-sm text-gray-500">Registro de entradas y salidas del día.</p>
                </div>
                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                    <Button
                        variant={monitoringView === 'timeline' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setMonitoringView('timeline')}
                        className={monitoringView === 'timeline' ? 'bg-[#ED1C24] hover:bg-[#c4161c] text-white' : 'text-gray-500'}
                    >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Timeline
                    </Button>
                    <Button
                        variant={monitoringView === 'table' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setMonitoringView('table')}
                        className={monitoringView === 'table' ? 'bg-[#ED1C24] hover:bg-[#c4161c] text-white' : 'text-gray-500'}
                    >
                        <List className="w-4 h-4 mr-2" />
                        Tabla
                    </Button>
                </div>
            </div>

            {monitoringView === 'timeline' ? (
                <div className="grid gap-4">
                    {attendances.map((att) => (
                        <Card key={att.id} className={`border-l-4 ${att.estado === 'Retraso' ? 'border-l-yellow-500' : att.estado === 'Reposo Médico' ? 'border-l-blue-500' : 'border-l-green-500'}`}>
                            <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 shrink-0">
                                        {att.nombre.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{att.nombre}</p>
                                        <p className="text-sm text-gray-500">Marcó {att.tipo}</p>
                                    </div>
                                </div>
                                <div className="text-left md:text-right">
                                    <p className="font-bold text-lg">{att.hora}</p>
                                    <div className="flex space-x-2 mt-1">
                                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${att.estado === 'Retraso' ? 'bg-yellow-100 text-yellow-800' :
                                                att.estado === 'Reposo Médico' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {att.estado}
                                        </span>
                                        {att.observaciones && <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">{att.observaciones}</span>}
                                    </div>
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
                                    <th className="px-4 py-3">Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendances.map((att) => (
                                    <tr key={att.id} className="border-b">
                                        <td className="px-4 py-3 font-medium">{att.nombre}</td>
                                        <td className="px-4 py-3">{att.tipo}</td>
                                        <td className="px-4 py-3 font-mono">{att.hora}</td>
                                        <td className="px-4 py-3">
                                            <span className={`${att.estado === 'Retraso' ? 'text-yellow-600' : att.estado === 'Reposo Médico' ? 'text-blue-600' : 'text-green-600'} font-medium`}>
                                                {att.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{att.observaciones}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );

    const renderHistorial = () => (
        <div className="space-y-6">
            <Card className="shadow-sm border-t-4 border-t-gray-800">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submitFilter} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <Label htmlFor="startDate">Desde</Label>
                            <Input type="date" name="startDate" value={historyFilters.startDate} onChange={handleFilterChange} />
                        </div>
                        <div>
                            <Label htmlFor="endDate">Hasta</Label>
                            <Input type="date" name="endDate" value={historyFilters.endDate} onChange={handleFilterChange} />
                        </div>
                        <div>
                            <Label htmlFor="cedula">Cédula del Prof.</Label>
                            <Input type="text" name="cedula" value={historyFilters.cedula} onChange={handleFilterChange} placeholder="Ej. 12325158" />
                        </div>
                        <div>
                            <Label htmlFor="estado">Estado</Label>
                            <select
                                name="estado"
                                value={historyFilters.estado}
                                onChange={handleFilterChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="Todos">Todos</option>
                                <option value="A tiempo">A tiempo</option>
                                <option value="Retraso">Retraso</option>
                                <option value="Reposo Médico">Reposo Médico</option>
                            </select>
                        </div>
                        <div>
                            <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white">
                                <Search className="w-4 h-4 mr-2" /> Buscar
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 border-b">Fecha</th>
                                <th className="px-4 py-3 border-b">Cédula</th>
                                <th className="px-4 py-3 border-b">Nombre</th>
                                <th className="px-4 py-3 border-b">H. Entrada</th>
                                <th className="px-4 py-3 border-b">H. Salida</th>
                                <th className="px-4 py-3 border-b">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No se encontraron registros.</td></tr>
                            ) : (
                                history.map((record) => (
                                    <tr key={record.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono">{record.fecha}</td>
                                        <td className="px-4 py-3">{record.cedula}</td>
                                        <td className="px-4 py-3 font-medium">{record.nombre}</td>
                                        <td className="px-4 py-3 font-mono">{record.hora_entrada || '--:--'}</td>
                                        <td className="px-4 py-3 font-mono">{record.hora_salida || '--:--'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                                                ${record.estado === 'Retraso' ? 'bg-yellow-100 text-yellow-800' :
                                                    record.estado === 'Reposo Médico' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'}
                                            `}>
                                                {record.estado}
                                            </span>
                                            {record.observaciones && <p className="text-xs text-gray-500 mt-1">{record.observaciones}</p>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
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
                            <Button type="submit" className="w-full bg-[#ED1C24] hover:bg-[#c4161c] text-white">{isEditing ? 'Actualizar' : 'Guardar'}</Button>
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
                        variant={activeTab === 'historial' ? 'secondary' : 'ghost'}
                        className={`w-full justify-start ${activeTab === 'historial' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('historial')}
                    >
                        <CalendarDays className="mr-3 h-5 w-5" />
                        Historial y Reportes
                    </Button>
                    <Button
                        variant={activeTab === 'personal' ? 'secondary' : 'ghost'}
                        className={`w-full justify-start ${activeTab === 'personal' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('personal')}
                    >
                        <Users className="mr-3 h-5 w-5" />
                        Gestión de Personal
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
                                        <h3 className="text-3xl font-bold text-yellow-700 mt-2">{stats.retrasos}</h3>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Dynamic View Content */}
                        <div className="mt-8">
                            {activeTab === 'monitoreo' && renderMonitoreo()}
                            {activeTab === 'historial' && renderHistorial()}
                            {activeTab === 'personal' && renderPersonal()}
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;

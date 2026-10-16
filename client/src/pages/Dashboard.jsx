import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LayoutDashboard, Users, LogOut, Clock, CalendarDays, List, LayoutGrid, Search, CalendarPlus, Pencil, X } from 'lucide-react';

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

    // History Pagination State
    const [historyPage, setHistoryPage] = useState(1);
    const recordsPerPage = 10;

    // Personnel Pagination State
    const [personnelPage, setPersonnelPage] = useState(1);

    // Derived Pagination variables
    const indexOfLastHistory = historyPage * recordsPerPage;
    const indexOfFirstHistory = indexOfLastHistory - recordsPerPage;
    const currentHistory = history.slice(indexOfFirstHistory, indexOfLastHistory);
    const totalHistoryPages = Math.ceil(history.length / recordsPerPage);

    const indexOfLastPersonnel = personnelPage * recordsPerPage;
    const indexOfFirstPersonnel = indexOfLastPersonnel - recordsPerPage;
    const currentPersonnel = personnel.slice(indexOfFirstPersonnel, indexOfLastPersonnel);
    const totalPersonnelPages = Math.ceil(personnel.length / recordsPerPage);
    
    // Observations State Modal
    const [bulkModal, setBulkModal] = useState({ isOpen: false, id_profesor: null, nombre_profesor: '', fecha_inicio: '', fecha_fin: '', motivo: 'Reposo Médico' });
    const [singleModal, setSingleModal] = useState({ isOpen: false, id_asistencia: null, nombre_profesor: '', observaciones: '' });

    // UI Helpers
    const baseCardClass = "bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 p-0 overflow-hidden";

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
            setHistoryPage(1); // Reset page on new fetch
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const fetchPersonnel = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/personnel', authHeader);
            setPersonnel(res.data);
            setPersonnelPage(1); // Reset page on new fetch
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

    // --- Observations Handlers ---
    const submitBulkObservation = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/api/dashboard/attendances/observations/bulk', bulkModal, authHeader);
            setBulkModal({ isOpen: false, id_profesor: null, nombre_profesor: '', fecha_inicio: '', fecha_fin: '', motivo: 'Reposo Médico' });
            fetchHistory();
            fetchAttendances();
        } catch (error) {
            alert('Error al guardar novedad: ' + (error.response?.data?.message || error.message));
        }
    };

    const submitSingleObservation = async (e) => {
        e.preventDefault();
        try {
            const dbId = singleModal.id_asistencia.toString().split('_')[0]; // Handle timeline IDs (123_in)
            await axios.put(`http://localhost:3000/api/dashboard/attendances/${dbId}/observation`, { observaciones: singleModal.observaciones }, authHeader);
            setSingleModal({ isOpen: false, id_asistencia: null, nombre_profesor: '', observaciones: '' });
            fetchHistory();
            fetchAttendances();
        } catch (error) {
            alert('Error al guardar nota: ' + (error.response?.data?.message || error.message));
        }
    };


    // --- Sub-components for Views ---

    const renderMonitoreo = () => (
        <div className="space-y-6">
            <div className={`flex justify-between items-center bg-white p-6 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100`}>
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
                        <Card key={att.id} className={`${baseCardClass} border-l-4 ${att.estado === 'Retraso' ? 'border-l-yellow-500' : att.estado === 'Reposo Médico' ? 'border-l-blue-500' : 'border-l-green-500'}`}>
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
                                    <div className="flex items-center justify-end space-x-2 mt-1">
                                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${att.estado === 'Retraso' ? 'bg-yellow-100 text-yellow-800' :
                                                att.estado === 'Reposo Médico' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {att.estado}
                                        </span>
                                        {att.observaciones && <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full truncate max-w-[150px]">{att.observaciones}</span>}
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 bg-blue-50 rounded-full" onClick={() => setSingleModal({ isOpen: true, id_asistencia: att.id, nombre_profesor: att.nombre, observaciones: att.observaciones || '' })}>
                                            <Pencil className="h-3 w-3" />
                                        </Button>
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
                <Card className={baseCardClass}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4">Empleado</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Hora</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendances.map((att) => (
                                    <tr key={att.id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{att.nombre}</td>
                                        <td className="px-6 py-4">{att.tipo}</td>
                                        <td className="px-6 py-4 font-mono">{att.hora}</td>
                                        <td className="px-6 py-4">
                                            <span className={`${att.estado === 'Retraso' ? 'text-yellow-600' : att.estado === 'Reposo Médico' ? 'text-blue-600' : 'text-green-600'} font-medium`}>
                                                {att.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-gray-500 text-xs">{att.observaciones || '--'}</span>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 bg-blue-50" onClick={() => setSingleModal({ isOpen: true, id_asistencia: att.id, nombre_profesor: att.nombre, observaciones: att.observaciones || '' })}>
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            </div>
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

    const renderHistorial = () => (
        <div className="space-y-6">
            <Card className={baseCardClass}>
                <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
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

            <Card className={baseCardClass}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Cédula</th>
                                <th className="px-6 py-4">Nombre</th>
                                <th className="px-6 py-4">H. Entrada</th>
                                <th className="px-6 py-4">H. Salida</th>
                                <th className="px-6 py-4">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentHistory.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No se encontraron registros.</td></tr>
                            ) : (
                                currentHistory.map((record) => (
                                    <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono">{record.fecha}</td>
                                        <td className="px-6 py-4">{record.cedula}</td>
                                        <td className="px-6 py-4 font-medium">{record.nombre}</td>
                                        <td className="px-6 py-4 font-mono">{record.hora_entrada || '--:--'}</td>
                                        <td className="px-6 py-4 font-mono">{record.hora_salida || '--:--'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                                                    ${record.estado === 'Retraso' ? 'bg-yellow-100 text-yellow-800' :
                                                        record.estado === 'Reposo Médico' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-green-100 text-green-800'}
                                                `}>
                                                    {record.estado}
                                                </span>
                                                <div className="flex items-center space-x-1 mt-1">
                                                    {record.observaciones ? (
                                                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[150px]" title={record.observaciones}>
                                                            {record.observaciones}
                                                        </span>
                                                    ) : null}
                                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600" onClick={() => setSingleModal({ isOpen: true, id_asistencia: record.id, nombre_profesor: record.nombre, observaciones: record.observaciones || '' })}>
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                {totalHistoryPages > 1 && (
                    <div className="flex items-center justify-end px-6 py-4 border-t bg-gray-50/50">
                        <div className="flex space-x-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                disabled={historyPage === 1}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                &laquo; Anterior
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                                disabled={historyPage === totalHistoryPages}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                Siguiente &raquo;
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );

    const renderPersonal = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className={`lg:col-span-1 h-fit ${baseCardClass}`}>
                <CardHeader className="p-6 pb-4 bg-gray-50/50 border-b">
                     <CardTitle>{isEditing ? 'Editar Personal' : 'Nuevo Personal'}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
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
                        <div className="flex gap-2 pt-2">
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

            <Card className={`lg:col-span-2 ${baseCardClass}`}>
                 <CardHeader className="p-6 pb-4 border-b">
                     <CardTitle>Nómina de Personal</CardTitle>
                 </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4">Cédula</th>
                                     <th className="px-6 py-4">Nombre</th>
                                     <th className="px-6 py-4">Cargo</th>
                                     <th className="px-6 py-4 text-right">Acciones</th>
                                 </tr>
                            </thead>
                            <tbody>
                                {currentPersonnel.length === 0 ? (
                                     <tr><td colSpan="4" className="text-center py-8 text-gray-500">No hay personal registrado en el sistema.</td></tr>
                                ) : (
                                    currentPersonnel.map((p) => (
                                        <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                                             <td className="px-6 py-4 font-medium text-gray-900">{p.cedula}</td>
                                             <td className="px-6 py-4">{p.nombre} {p.apellido}</td>
                                             <td className="px-6 py-4 text-gray-600">{p.cargo}</td>
                                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                                <Button variant="ghost" size="sm" className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 mr-1" onClick={() => setBulkModal({ isOpen: true, id_profesor: p.id, nombre_profesor: `${p.nombre} ${p.apellido}`, fecha_inicio: '', fecha_fin: '', motivo: 'Reposo Médico' })} title="Añadir Novedad (Reposo/Permiso)">
                                                    <CalendarPlus className="w-4 h-4 mr-1" /> Novedad
                                                </Button>
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
                {/* Pagination Controls */}
                {totalPersonnelPages > 1 && (
                    <div className="flex items-center justify-end px-6 py-4 border-t bg-gray-50/50">
                        <div className="flex space-x-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setPersonnelPage(p => Math.max(1, p - 1))}
                                disabled={personnelPage === 1}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                &laquo; Anterior
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setPersonnelPage(p => Math.min(totalPersonnelPages, p + 1))}
                                disabled={personnelPage === totalPersonnelPages}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                Siguiente &raquo;
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r shadow-[2px_0_10px_-3px_rgba(6,81,237,0.1)] flex flex-col hidden md:flex z-10">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#ED1C24] to-red-400 bg-clip-text text-transparent">
                        DigitalCheck
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 font-medium">E.B.D. José Antonio González</p>
                </div>
                
                <div className="flex-1 py-6 px-4 space-y-2">
                    <Button 
                        variant={activeTab === 'monitoreo' ? 'secondary' : 'ghost'} 
                        className={`w-full justify-start font-medium transition-all ${activeTab === 'monitoreo' ? 'bg-[#ED1C24]/10 text-[#ED1C24] hover:bg-[#ED1C24]/20' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'}`}
                        onClick={() => setActiveTab('monitoreo')}
                    >
                        <Clock className={`mr-3 h-5 w-5 ${activeTab === 'monitoreo' ? 'text-[#ED1C24]' : 'text-gray-400'}`} />
                        Monitoreo en Vivo
                    </Button>
                    <Button 
                        variant={activeTab === 'historial' ? 'secondary' : 'ghost'} 
                        className={`w-full justify-start font-medium transition-all ${activeTab === 'historial' ? 'bg-[#ED1C24]/10 text-[#ED1C24] hover:bg-[#ED1C24]/20' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'}`}
                        onClick={() => setActiveTab('historial')}
                    >
                        <CalendarDays className={`mr-3 h-5 w-5 ${activeTab === 'historial' ? 'text-[#ED1C24]' : 'text-gray-400'}`} />
                        Historial y Reportes
                    </Button>
                    <Button 
                        variant={activeTab === 'personal' ? 'secondary' : 'ghost'} 
                        className={`w-full justify-start font-medium transition-all ${activeTab === 'personal' ? 'bg-[#ED1C24]/10 text-[#ED1C24] hover:bg-[#ED1C24]/20' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'}`}
                        onClick={() => setActiveTab('personal')}
                    >
                        <Users className={`mr-3 h-5 w-5 ${activeTab === 'personal' ? 'text-[#ED1C24]' : 'text-gray-400'}`} />
                        Gestión de Personal
                    </Button>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 font-medium cursor-pointer transition-colors" onClick={handleLogout}>
                        <LogOut className="mr-3 h-5 w-5" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-6xl mx-auto space-y-8">
                        
                        {/* Conditional Header based on Active Tab */}
                        <div>
                            {activeTab === 'monitoreo' && (
                                <>
                                    <h1 className="text-2xl font-bold text-gray-800 mb-6 tracking-tight">Resumen Operativo del Día</h1>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Card className="shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 bg-white rounded-xl">
                                            <CardContent className="p-6">
                                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Plantel</p>
                                                <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</h3>
                                            </CardContent>
                                        </Card>
                                        <Card className="shadow-[0_2px_10px_-3px_rgba(22,163,74,0.15)] border border-green-50 bg-gradient-to-br from-green-50/50 to-white rounded-xl">
                                            <CardContent className="p-6">
                                                <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Presentes Hoy</p>
                                                <h3 className="text-3xl font-bold text-green-700 mt-2">{stats.present}</h3>
                                            </CardContent>
                                        </Card>
                                        <Card className="shadow-[0_2px_10px_-3px_rgba(220,38,38,0.15)] border border-red-50 bg-gradient-to-br from-red-50/50 to-white rounded-xl">
                                            <CardContent className="p-6">
                                                <p className="text-sm font-medium text-red-600 uppercase tracking-wider">Ausentes Hoy</p>
                                                <h3 className="text-3xl font-bold text-red-700 mt-2">{stats.absent}</h3>
                                            </CardContent>
                                        </Card>
                                        <Card className="shadow-[0_2px_10px_-3px_rgba(202,138,4,0.15)] border border-yellow-50 bg-gradient-to-br from-yellow-50/50 to-white rounded-xl">
                                            <CardContent className="p-6">
                                                <p className="text-sm font-medium text-yellow-600 uppercase tracking-wider">Retrasos Hoy</p>
                                                <h3 className="text-3xl font-bold text-yellow-700 mt-2">{stats.retrasos}</h3>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </>
                            )}
                            {activeTab === 'historial' && (
                                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Auditoría de Historial e Informes</h1>
                            )}
                            {activeTab === 'personal' && (
                                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Directorio y Gestión de Empleados</h1>
                            )}
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

            {/* Modal: Bulk Observation (Novedad Planificada) */}
            {bulkModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader className="border-b bg-gray-50 pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg text-blue-800 flex items-center">
                                    <CalendarPlus className="w-5 h-5 mr-2" />
                                    Registrar Novedad
                                </CardTitle>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-200" onClick={() => setBulkModal({ ...bulkModal, isOpen: false })}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Para: <span className="font-semibold text-gray-800">{bulkModal.nombre_profesor}</span></p>
                        </CardHeader>
                        <CardContent className="p-6 pt-6">
                            <form onSubmit={submitBulkObservation} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Motivo de la Novedad</Label>
                                    <select 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={bulkModal.motivo}
                                        onChange={(e) => setBulkModal({...bulkModal, motivo: e.target.value})}
                                        required
                                    >
                                        <option value="Reposo Médico">Reposo Médico</option>
                                        <option value="Permiso Personal">Permiso Personal</option>
                                        <option value="Día Libre Justificado">Día Libre Justificado</option>
                                        <option value="Vacaciones">Vacaciones</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Desde la Fecha</Label>
                                        <Input type="date" required value={bulkModal.fecha_inicio} onChange={(e) => setBulkModal({...bulkModal, fecha_inicio: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Hasta la Fecha</Label>
                                        <Input type="date" required value={bulkModal.fecha_fin} onChange={(e) => setBulkModal({...bulkModal, fecha_fin: e.target.value})} />
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-2">
                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Guardar Novedad</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Modal: Single Observation (Nota Rápida) */}
            {singleModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader className="pb-3 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg flex items-center text-gray-800">
                                    <Pencil className="w-4 h-4 mr-2 text-blue-500" />
                                    Nota Rápida
                                </CardTitle>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSingleModal({ ...singleModal, isOpen: false })}><X className="h-4 w-4" /></Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Agregando nota al registro de <span className="font-semibold text-gray-700">{singleModal.nombre_profesor}</span>
                            </p>
                        </CardHeader>
                        <CardContent className="pt-5 pb-6">
                            <form onSubmit={submitSingleObservation} className="space-y-4">
                                <div>
                                    <Input 
                                        autoFocus
                                        placeholder="Ej: Tráfico denso, Se retiró temprano..."
                                        value={singleModal.observaciones}
                                        onChange={(e) => setSingleModal({ ...singleModal, observaciones: e.target.value })}
                                        className="h-10 border-blue-200 focus-visible:ring-blue-500"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white">Guardar Nota</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

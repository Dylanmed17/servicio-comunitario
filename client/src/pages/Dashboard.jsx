import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });
    const [personnel, setPersonnel] = useState([]);
    const [formData, setFormData] = useState({ id: null, cedula: '', nombre: '', apellido: '', cargo: '', telefono: '' });
    const [isEditing, setIsEditing] = useState(false);
    const token = localStorage.getItem('token');

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchStats();
        fetchPersonnel();
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

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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

    const handleEdit = (p) => {
        setFormData(p);
        setIsEditing(true);
    };

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

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">Panel Administrativo</h1>
                    <Button variant="destructive" onClick={handleLogout}>Cerrar Sesión</Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Personal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Asistentes Hoy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Ausentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Section */}
                    <Card className="lg:col-span-1 h-fit">
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
                                    <Button type="submit" className="w-full">{isEditing ? 'Actualizar' : 'Guardar'}</Button>
                                    {isEditing && (
                                        <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setFormData({ id: null, cedula: '', nombre: '', apellido: '', cargo: '', telefono: '' }); }}>
                                            Cancelar
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Table Section */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Nómina de Personal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3">Cédula</th>
                                            <th className="px-4 py-3">Nombre</th>
                                            <th className="px-4 py-3">Cargo</th>
                                            <th className="px-4 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {personnel.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-4">No hay personal registrado.</td></tr>
                                        ) : (
                                            personnel.map((p) => (
                                                <tr key={p.id} className="border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium">{p.cedula}</td>
                                                    <td className="px-4 py-3">{p.nombre} {p.apellido}</td>
                                                    <td className="px-4 py-3">{p.cargo}</td>
                                                    <td className="px-4 py-3 text-right space-x-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                                                            Editar
                                                        </Button>
                                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>
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
            </div>
        </div>
    );
};

export default Dashboard;

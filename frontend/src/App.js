import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { Camera, Trophy, Zap, Star, Crown, Settings, Users, Eye, Trash2, Edit, Plus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Admin Panel Component
const AdminPanel = ({ onClose }) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [matti, setMatti] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('stats');
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ username: '', password: '' });

  const adminLogin = async () => {
    try {
      await axios.post(`${API}/admin/login`, { password: adminPassword });
      setIsAuthenticated(true);
      loadAdminData();
    } catch (error) {
      alert('Password admin errata!');
    }
  };

  const loadAdminData = async () => {
    try {
      const [statsRes, usersRes, mattiRes] = await Promise.all([
        axios.get(`${API}/admin/stats?admin_password=${adminPassword}`),
        axios.get(`${API}/admin/users?admin_password=${adminPassword}`),
        axios.get(`${API}/admin/matti?admin_password=${adminPassword}`)
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setMatti(mattiRes.data);
    } catch (error) {
      console.error('Errore nel caricamento dati admin:', error);
    }
  };

  const createUser = async () => {
    if (!newUser.username.trim() || !newUser.password.trim()) {
      alert('Compila tutti i campi!');
      return;
    }

    try {
      await axios.post(`${API}/admin/users?admin_password=${adminPassword}`, newUser);
      setNewUser({ username: '', password: '' });
      loadAdminData();
      alert('Utente creato con successo!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore nella creazione utente');
    }
  };

  const updateUser = async (userId, updateData) => {
    try {
      await axios.put(`${API}/admin/users/${userId}?admin_password=${adminPassword}`, updateData);
      setEditingUser(null);
      loadAdminData();
      alert('Utente aggiornato!');
    } catch (error) {
      alert('Errore nell\'aggiornamento utente');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo utente?')) return;
    
    try {
      await axios.delete(`${API}/admin/users/${userId}?admin_password=${adminPassword}`);
      loadAdminData();
      alert('Utente eliminato!');
    } catch (error) {
      alert('Errore nell\'eliminazione utente');
    }
  };

  const deleteMatto = async (mattoId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo matto?')) return;
    
    try {
      await axios.delete(`${API}/admin/matti/${mattoId}?admin_password=${adminPassword}`);
      loadAdminData();
      alert('Matto eliminato!');
    } catch (error) {
      alert('Errore nell\'eliminazione matto');
    }
  };

  const resetPoints = async () => {
    if (!window.confirm('Sei sicuro di voler resettare tutti i punti? Questa azione non può essere annullata!')) return;
    
    try {
      await axios.post(`${API}/admin/reset-points?admin_password=${adminPassword}`);
      loadAdminData();
      alert('Punti resettati con successo!');
    } catch (error) {
      alert('Errore nel reset punti');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <Card className="bg-gray-900 border-red-500 border-2 w-96">
          <CardHeader>
            <CardTitle className="text-red-400">🔐 ADMIN LOGIN</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Password Admin"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="bg-black border-red-500 text-red-400"
                onKeyPress={(e) => e.key === 'Enter' && adminLogin()}
              />
              <div className="flex gap-2">
                <Button onClick={adminLogin} className="bg-red-600 hover:bg-red-700 text-white flex-1">
                  LOGIN
                </Button>
                <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white">
                  CHIUDI
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-400 pixel-text">⚙️ ADMIN PANEL</h1>
          <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white">
            CHIUDI
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'stats', label: '📊 STATISTICHE', icon: Trophy },
            { id: 'users', label: '👥 UTENTI', icon: Users },
            { id: 'matti', label: '🎭 MATTI', icon: Eye }
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id ? 'bg-red-600' : 'bg-gray-700'
              } hover:bg-red-700 text-white pixel-button`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-900 border-blue-500 border-2">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{stats.total_users}</div>
                  <div className="text-gray-400">Utenti Totali</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-green-500 border-2">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{stats.total_matti}</div>
                  <div className="text-gray-400">Matti Totali</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-yellow-500 border-2">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">{stats.total_points}</div>
                  <div className="text-gray-400">Punti Totali</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-purple-500 border-2">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{stats.pending_matti}</div>
                  <div className="text-gray-400">Matti Pending</div>
                </div>
              </CardContent>
            </Card>
            
            <div className="col-span-full">
              <Button 
                onClick={resetPoints}
                className="bg-red-600 hover:bg-red-700 text-white w-full pixel-button"
              >
                🔄 RESET TUTTI I PUNTI
              </Button>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Create User Form */}
            <Card className="bg-gray-900 border-green-500 border-2">
              <CardHeader>
                <CardTitle className="text-green-400">➕ CREA NUOVO UTENTE</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="bg-black border-green-500 text-green-400"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="bg-black border-green-500 text-green-400"
                  />
                  <Button onClick={createUser} className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    CREA
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card className="bg-gray-900 border-blue-500 border-2">
              <CardHeader>
                <CardTitle className="text-blue-400">👥 LISTA UTENTI ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-black rounded border border-gray-700">
                      <div className="flex items-center gap-4">
                        <span className="text-white font-bold">{user.username}</span>
                        <Badge className="bg-yellow-600">{user.total_points} punti</Badge>
                        <Badge className={user.is_active ? 'bg-green-600' : 'bg-red-600'}>
                          {user.is_active ? 'Attivo' : 'Disattivo'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => setEditingUser(user)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Matti Tab */}
        {activeTab === 'matti' && (
          <Card className="bg-gray-900 border-purple-500 border-2">
            <CardHeader>
              <CardTitle className="text-purple-400">🎭 LISTA MATTI ({matti.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matti.map((matto) => (
                  <div key={matto.id} className="bg-black border border-gray-700 rounded-lg p-4">
                    <img 
                      src={matto.photo_data} 
                      alt={matto.nickname}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-white font-bold text-sm">{matto.nickname}</h4>
                        <Badge className={`${
                          matto.rarity === 'legendary' ? 'bg-yellow-500' :
                          matto.rarity === 'epic' ? 'bg-purple-500' :
                          matto.rarity === 'rare' ? 'bg-blue-500' :
                          'bg-gray-500'
                        } text-xs`}>
                          {matto.rarity.toUpperCase()}
                        </Badge>
                      </div>
                      {matto.description && (
                        <p className="text-gray-400 text-xs">{matto.description}</p>
                      )}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-blue-400">@{matto.username}</span>
                        <span className="text-yellow-400">{matto.points}pt</span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => deleteMatto(matto.id)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        ELIMINA
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-60">
            <Card className="bg-gray-900 border-blue-500 border-2 w-96">
              <CardHeader>
                <CardTitle className="text-blue-400">✏️ MODIFICA UTENTE</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="Username"
                    defaultValue={editingUser.username}
                    onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                    className="bg-black border-blue-500 text-blue-400"
                  />
                  <Input
                    type="number"
                    placeholder="Punti"
                    defaultValue={editingUser.total_points}
                    onChange={(e) => setEditingUser({...editingUser, total_points: parseInt(e.target.value)})}
                    className="bg-black border-blue-500 text-blue-400"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingUser.is_active}
                      onChange={(e) => setEditingUser({...editingUser, is_active: e.target.checked})}
                    />
                    <span className="text-white">Attivo</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => updateUser(editingUser.id, editingUser)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                    >
                      SALVA
                    </Button>
                    <Button 
                      onClick={() => setEditingUser(null)}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      ANNULLA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [matti, setMatti] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Upload form state
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [nickname, setNickname] = useState('');
  const [description, setDescription] = useState('');
  const [rarity, setRarity] = useState('common');

  useEffect(() => {
    fetchLeaderboard();
    fetchMatti();
  }, []);

  const loginUser = async () => {
    if (!username.trim() || !password.trim()) {
      alert('Inserisci username e password!');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/login`, {
        username: username.trim(),
        password: password.trim()
      });
      setCurrentUser(response.data);
      setUsername('');
      setPassword('');
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore nel login');
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/leaderboard`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Errore nel caricamento classifica:', error);
    }
  };

  const fetchMatti = async () => {
    try {
      const response = await axios.get(`${API}/matti`);
      setMatti(response.data);
    } catch (error) {
      console.error('Errore nel caricamento matti:', error);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadMatto = async () => {
    if (!currentUser || !photo || !nickname.trim()) {
      alert('Compila tutti i campi obbligatori!');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const photoData = e.target.result;
        
        await axios.post(`${API}/matti`, {
          user_id: currentUser.id,
          username: currentUser.username,
          photo_data: photoData,
          nickname: nickname.trim(),
          description: description.trim(),
          rarity: rarity
        });

        // Reset form
        setPhoto(null);
        setPhotoPreview(null);
        setNickname('');
        setDescription('');
        setRarity('common');
        setShowUpload(false);

        // Refresh data
        fetchLeaderboard();
        fetchMatti();
        
        // Update current user
        const userResponse = await axios.post(`${API}/login`, {
          username: currentUser.username,
          password: 'temp' // This will need to be handled better in production
        });
        // For now, just refresh leaderboard to see updated points
        alert('Matto caricato con successo!');
      };
      reader.readAsDataURL(photo);
    } catch (error) {
      alert('Errore nel caricamento del matto');
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'bg-yellow-500 text-black';
      case 'epic': return 'bg-purple-500';
      case 'rare': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getRarityIcon = (rarity) => {
    switch (rarity) {
      case 'legendary': return <Crown className="w-4 h-4" />;
      case 'epic': return <Star className="w-4 h-4" />;
      case 'rare': return <Zap className="w-4 h-4" />;
      default: return <Trophy className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Admin Panel */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      {/* Hero Section */}
      <div 
        className="relative h-96 bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1511512578047-dfb367046420?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxyZXRybyUyMGdhbWluZ3xlbnwwfHx8YmxhY2t8MTc1Mzk2NzQ4Mnww&ixlib=rb-4.1.0&q=85)',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-70"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-6xl font-bold text-red-500 mb-4 pixel-text">
            🌀 FANTAMATTO
          </h1>
          <p className="text-xl text-yellow-400 max-w-2xl mx-auto">
            CACCIA AI PERSONAGGI PIÙ PAZZI DI PONZA
          </p>
          <p className="text-lg text-green-300 mt-2">
            Scatta, classifica, conquista la vetta!
          </p>
        </div>
        
        {/* Admin Button */}
        <Button
          onClick={() => setShowAdmin(true)}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white z-20"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* User Login/Status */}
        <div className="mb-8">
          {!currentUser ? (
            <Card className="bg-gray-900 border-green-500 border-2">
              <CardHeader>
                <CardTitle className="text-green-400">🎮 ACCEDI AL GIOCO</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-black border-green-500 text-green-400"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black border-green-500 text-green-400"
                    onKeyPress={(e) => e.key === 'Enter' && loginUser()}
                  />
                  <Button 
                    onClick={loginUser}
                    className="bg-red-600 hover:bg-red-700 text-white pixel-button"
                  >
                    ENTRA
                  </Button>
                  <div className="text-center text-gray-400 text-sm">
                    Contatta admin per credenziali
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-900 border-yellow-500 border-2">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-yellow-400">
                      👤 {currentUser.username}
                    </h2>
                    <p className="text-green-400">
                      💰 PUNTI: {currentUser.total_points}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowUpload(!showUpload)}
                      className="bg-purple-600 hover:bg-purple-700 text-white pixel-button"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {showUpload ? 'CHIUDI' : 'SCATTA MATTO'}
                    </Button>
                    <Button 
                      onClick={() => setCurrentUser(null)}
                      className="bg-red-600 hover:bg-red-700 text-white pixel-button"
                    >
                      LOGOUT
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upload Form */}
        {showUpload && currentUser && (
          <Card className="mb-8 bg-gray-900 border-purple-500 border-2">
            <CardHeader>
              <CardTitle className="text-purple-400">📸 CARICA UN MATTO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    id="photo"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <label 
                    htmlFor="photo"
                    className="block w-full h-64 border-2 border-dashed border-purple-500 rounded-lg cursor-pointer hover:border-purple-400 flex items-center justify-center"
                  >
                    {photoPreview ? (
                      <img 
                        src={photoPreview} 
                        alt="Preview" 
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-purple-400">
                        <Camera className="w-12 h-12 mx-auto mb-2" />
                        <p>Clicca per caricare foto</p>
                      </div>
                    )}
                  </label>
                </div>
                
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Soprannome del matto"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-black border-purple-500 text-purple-400"
                  />
                  
                  <Textarea
                    placeholder="Descrizione (opzionale)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-black border-purple-500 text-purple-400"
                  />
                  
                  <div>
                    <p className="text-purple-400 mb-2">RARITÀ:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'common', label: 'COMUNE (10pt)', color: 'bg-gray-600' },
                        { value: 'rare', label: 'RARO (25pt)', color: 'bg-blue-600' },
                        { value: 'epic', label: 'EPICO (50pt)', color: 'bg-purple-600' },
                        { value: 'legendary', label: 'LEGGENDARIO (100pt)', color: 'bg-yellow-600' }
                      ].map((rarityOption) => (
                        <Button
                          key={rarityOption.value}
                          onClick={() => setRarity(rarityOption.value)}
                          className={`${rarityOption.color} ${
                            rarity === rarityOption.value 
                              ? 'ring-2 ring-white' 
                              : 'opacity-70 hover:opacity-100'
                          } text-white text-xs pixel-button`}
                        >
                          {rarityOption.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={uploadMatto}
                    className="w-full bg-red-600 hover:bg-red-700 text-white pixel-button"
                  >
                    🎯 AGGIUNGI MATTO
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leaderboard */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-yellow-500 border-2">
              <CardHeader>
                <CardTitle className="text-yellow-400">🏆 CLASSIFICA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((user, index) => (
                    <div 
                      key={user.id}
                      className={`flex justify-between items-center p-2 rounded ${
                        index === 0 ? 'bg-yellow-900 border border-yellow-500' :
                        index === 1 ? 'bg-gray-700 border border-gray-500' :
                        index === 2 ? 'bg-orange-900 border border-orange-500' :
                        'bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">
                          {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </span>
                        <span className={
                          user.id === currentUser?.id ? 'text-green-400 font-bold' : 'text-white'
                        }>
                          {user.username}
                        </span>
                      </div>
                      <span className="text-yellow-400 font-bold">
                        {user.total_points}pt
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Matti Gallery */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-green-500 border-2">
              <CardHeader>
                <CardTitle className="text-green-400">🎭 GALLERIA DEI MATTI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matti.slice(0, 10).map((matto) => (
                    <div 
                      key={matto.id}
                      className="bg-black border border-gray-700 rounded-lg p-4"
                    >
                      <img 
                        src={matto.photo_data} 
                        alt={matto.nickname}
                        className="w-full h-48 object-cover rounded mb-3"
                      />
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-white font-bold">{matto.nickname}</h3>
                        <Badge className={`${getRarityColor(matto.rarity)} flex items-center gap-1`}>
                          {getRarityIcon(matto.rarity)}
                          {matto.rarity.toUpperCase()}
                        </Badge>
                      </div>
                      {matto.description && (
                        <p className="text-gray-400 text-sm mb-2">{matto.description}</p>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-400">@{matto.username}</span>
                        <span className="text-yellow-400 font-bold">+{matto.points}pt</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
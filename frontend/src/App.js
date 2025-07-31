import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { Camera, Trophy, Zap, Star, Crown } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [matti, setMatti] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  
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

  const createUser = async () => {
    if (!username.trim()) return;
    
    try {
      const response = await axios.post(`${API}/users`, {
        username: username.trim()
      });
      setCurrentUser(response.data);
      setUsername('');
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore nella creazione utente');
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/users`);
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
        const userResponse = await axios.get(`${API}/users/${currentUser.id}`);
        setCurrentUser(userResponse.data);
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
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* User Login/Status */}
        <div className="mb-8">
          {!currentUser ? (
            <Card className="bg-gray-900 border-green-500 border-2">
              <CardHeader>
                <CardTitle className="text-green-400">🎮 ENTRA IN GIOCO</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    type="text"
                    placeholder="Il tuo nickname da cacciatore"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-black border-green-500 text-green-400"
                    onKeyPress={(e) => e.key === 'Enter' && createUser()}
                  />
                  <Button 
                    onClick={createUser}
                    className="bg-red-600 hover:bg-red-700 text-white pixel-button"
                  >
                    INIZIA LA CACCIA
                  </Button>
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
                  <Button
                    onClick={() => setShowUpload(!showUpload)}
                    className="bg-purple-600 hover:bg-purple-700 text-white pixel-button"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {showUpload ? 'CHIUDI' : 'SCATTA MATTO'}
                  </Button>
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
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Search, 
  FolderPlus, 
  Eye, 
  RefreshCw,
  File,
  Image,
  Video,
  Music,
  Archive,
  AlertCircle,
  LogIn,
  User,
  LogOut
} from 'lucide-react';
import { driveService, DriveFile } from '@/lib/googleDrive';
import useGoogleAuth from '@/hooks/useGoogleAuth';

interface DocumentManagementProps {
  onClose?: () => void;
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({ onClose }) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Hook per autenticazione Google
  const {
    isAuthenticated,
    user,
    isLoading: authLoading,
    error: authError,
    signInWithGoogle,
    signOut,
    getValidAccessToken,
    initializeFromStorage
  } = useGoogleAuth();

  // Inizializza l'autenticazione all'avvio
  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  // Carica i file quando l'utente è autenticato
  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
    }
  }, [isAuthenticated]);

  const loadFiles = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      const accessToken = await getValidAccessToken();
      await driveService.initializeWithUserCredentials(accessToken);
      const result = await driveService.listFiles(50);
      setFiles(result.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei file');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!isAuthenticated) return;
    
    if (!searchQuery.trim()) {
      loadFiles();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const accessToken = await getValidAccessToken();
      await driveService.initializeWithUserCredentials(accessToken);
      const searchResults = await driveService.searchFiles(searchQuery);
      setFiles(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella ricerca');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isAuthenticated) return;

    setUploading(true);
    setError(null);
    try {
      const accessToken = await getValidAccessToken();
      await driveService.initializeWithUserCredentials(accessToken);
      await driveService.uploadFile(file);
      await loadFiles();
      event.target.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento del file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo file?') || !isAuthenticated) return;

    setError(null);
    try {
      const accessToken = await getValidAccessToken();
      await driveService.initializeWithUserCredentials(accessToken);
      await driveService.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione del file');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !isAuthenticated) return;

    setError(null);
    try {
      const accessToken = await getValidAccessToken();
      await driveService.initializeWithUserCredentials(accessToken);
      await driveService.createFolder(newFolderName);
      setNewFolderName('');
      setShowCreateFolder(false);
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione della cartella');
    }
  };

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-red-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5 text-green-500" />;
    if (mimeType === 'application/vnd.google-apps.folder') return <FileText className="w-5 h-5 text-yellow-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-5 h-5 text-purple-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (size?: string) => {
    if (!size) return 'N/A';
    const bytes = parseInt(size);
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Interfaccia per utenti non autenticati
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Gestione Documentale</h1>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 text-xl font-semibold"
                >
                  ×
                </button>
              )}
            </div>

            {authError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{authError}</p>
              </div>
            )}

            <div className="text-center py-12">
              <LogIn className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Accesso Google Drive Richiesto</h3>
              <p className="text-gray-600 mb-6">
                Per gestire i documenti è necessario autenticarsi con Google Drive.
                <br />
                Potrai caricare, organizzare e condividere i tuoi documenti in modo sicuro.
              </p>
              <button
                onClick={signInWithGoogle}
                disabled={authLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {authLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {authLoading ? 'Connessione in corso...' : 'Accedi con Google Drive'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interfaccia principale per utenti autenticati
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Gestione Documentale</h1>
            <div className="flex items-center gap-4">
              {/* Google Auth Status */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-md">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    {user?.name || user?.email}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 border border-gray-300 rounded-md hover:border-red-300 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnetti
                </button>
              </div>
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 text-xl font-semibold"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cerca documenti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Cerca
            </button>

            <label className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {uploading ? 'Caricando...' : 'Carica File'}
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                multiple={false}
              />
            </label>

            <button
              onClick={() => setShowCreateFolder(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Nuova Cartella
            </button>

            <button
              onClick={loadFiles}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Aggiorna
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Create Folder Modal */}
        {showCreateFolder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Crea Nuova Cartella</h3>
              <input
                type="text"
                placeholder="Nome cartella"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mb-4"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Crea
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Files Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading && files.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-600">Caricamento documenti...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessun documento trovato</p>
              <p className="text-sm text-gray-500 mt-2">Carica il tuo primo documento per iniziare</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles(new Set(files.map(f => f.id)));
                          } else {
                            setSelectedFiles(new Set());
                          }
                        }}
                        checked={selectedFiles.size === files.length && files.length > 0}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dimensione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modificato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={() => handleSelectFile(file.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getFileIcon(file.mimeType)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{file.name}</div>
                            <div className="text-xs text-gray-500">{file.mimeType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(file.modifiedTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Visualizza"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          )}
                          {file.webContentLink && (
                            <a
                              href={file.webContentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Scarica"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Files Actions */}
        {selectedFiles.size > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-medium">
                {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selezionat{selectedFiles.size > 1 ? 'i' : 'o'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    selectedFiles.forEach(fileId => handleDeleteFile(fileId));
                  }}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Elimina Selezionati
                </button>
                <button
                  onClick={() => setSelectedFiles(new Set())}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Deseleziona
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManagement;
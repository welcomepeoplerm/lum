export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
}

export class GoogleDriveService {
  private accessToken: string | null = null;
  private folderId: string;

  constructor() {
    this.folderId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || 'root';
  }

  // Inizializza il servizio con le credenziali del client
  async initializeWithUserCredentials(accessToken: string) {
    this.accessToken = accessToken;
  }

  // Lista tutti i file nella cartella specificata
  async listFilesInFolder(folderId: string, pageSize: number = 10, pageToken?: string): Promise<{ files: DriveFile[], nextPageToken?: string }> {
    if (!this.accessToken) {
      throw new Error('Access token non disponibile');
    }

    try {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed=false`,
        pageSize: pageSize.toString(),
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents)',
        orderBy: 'modifiedTime desc'
      });

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        files: data.files || [],
        nextPageToken: data.nextPageToken
      };
    } catch (error) {
      console.error('Errore nel recuperare i file:', error);
      throw new Error('Impossibile recuperare i file da Google Drive');
    }
  }

  // Lista tutti i file nella cartella principale (mantenuto per compatibilità)
  async listFiles(pageSize: number = 10, pageToken?: string): Promise<{ files: DriveFile[], nextPageToken?: string }> {
    return this.listFilesInFolder(this.folderId, pageSize, pageToken);
  }

  // Cerca file per nome in una cartella specifica
  async searchFilesInFolder(query: string, folderId: string): Promise<DriveFile[]> {
    if (!this.accessToken) {
      throw new Error('Access token non disponibile');
    }

    try {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and name contains '${query}' and trashed=false`,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents)',
        orderBy: 'modifiedTime desc'
      });

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Errore nella ricerca:', error);
      throw new Error('Errore durante la ricerca dei file');
    }
  }

  // Cerca file per nome in tutto Google Drive
  async searchFilesGlobal(query: string): Promise<DriveFile[]> {
    if (!this.accessToken) {
      throw new Error('Access token non disponibile');
    }

    try {
      const params = new URLSearchParams({
        q: `name contains '${query}' and trashed=false`,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents)',
        orderBy: 'modifiedTime desc'
      });

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Errore nella ricerca globale:', error);
      throw new Error('Errore durante la ricerca globale dei file');
    }
  }

  // Cerca file per nome (mantenuto per compatibilità)
  async searchFiles(query: string): Promise<DriveFile[]> {
    return this.searchFilesInFolder(query, this.folderId);
  }

  // Carica un nuovo file in una cartella specifica
  async uploadFileToFolder(file: File, parentId: string, fileName?: string): Promise<DriveFile> {
    if (!this.accessToken) {
      throw new Error('Access token non disponibile');
    }

    try {
      const metadata = {
        name: fileName || file.name,
        parents: [parentId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Errore nel caricamento del file:', error);
      throw new Error('Impossibile caricare il file');
    }
  }

  // Carica un nuovo file (mantenuto per compatibilità)
  async uploadFile(file: File, fileName?: string): Promise<DriveFile> {
    return this.uploadFileToFolder(file, this.folderId, fileName);
  }

  // Elimina un file
  async deleteFile(fileId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Access token non disponibile');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione del file:', error);
      throw new Error('Impossibile eliminare il file');
    }
  }

  // Crea una cartella in una cartella specifica
  async createFolderInParent(name: string, parentId: string): Promise<DriveFile> {
    if (!this.accessToken) {
      throw new Error('Access token non disponibile');
    }

    try {
      const metadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      };

      const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,createdTime,modifiedTime', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Errore nella creazione della cartella:', error);
      throw new Error('Impossibile creare la cartella');
    }
  }

  // Crea una cartella (mantenuto per compatibilità)
  async createFolder(name: string, parentId?: string): Promise<DriveFile> {
    return this.createFolderInParent(name, parentId || this.folderId);
  }

  // Ottieni le informazioni di un file
  async getFileInfo(fileId: string): Promise<DriveFile> {
    if (!this.accessToken) {
      throw new Error('Access token non disponibile');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Errore nel recuperare le informazioni del file:', error);
      throw new Error('Impossibile recuperare le informazioni del file');
    }
  }

  // Condividi un file
  async shareFile(fileId: string, email: string, role: 'reader' | 'writer' | 'commenter' = 'reader'): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Access token non disponibile');
    }

    try {
      const permission = {
        role: role,
        type: 'user',
        emailAddress: email
      };

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(permission)
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Errore nella condivisione del file:', error);
      throw new Error('Impossibile condividere il file');
    }
  }

  // Ottieni il link di download diretto
  async getDownloadLink(fileId: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Access token non disponibile');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=webContentLink`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.webContentLink;
    } catch (error) {
      console.error('Errore nel generare il link di download:', error);
      throw new Error('Impossibile generare il link di download');
    }
  }
}

export const driveService = new GoogleDriveService();
export interface Message {
  id: number;
  senderId: string;
  content: string;
  sentAt: Date;
  isRead: boolean;
  updatedAt?: Date;
  showMenu?: boolean;

  // --- NOUVEAUX ATTRIBUTS POUR LES FICHIERS ---
  fileName?: string;   // Nom original du fichier (ex: ordonnance.pdf)
  fileType?: string;   // Type MIME (ex: application/pdf ou image/jpeg)
  fileUrl?: string;    // Chemin d'accès relatif (ex: /uploads/12345_ordonnance.pdf)
}


export interface Conversation {
  id: number;
  user1Id: string;
  user2Id: string;
  createdAt?: Date;
  isActive?: boolean;
  messages: Message[];
  interlocutorName?: string;
  interlocutorAvatar?: string;
}

export enum CallStatus {
  INITIATED = 'INITIATED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  REJECTED = 'REJECTED'
}

export interface Call {
  id: number;
  callerId: string;
  status: CallStatus;
  startTime: string;
  endTime?: string;
  durationInSeconds?: number;
}

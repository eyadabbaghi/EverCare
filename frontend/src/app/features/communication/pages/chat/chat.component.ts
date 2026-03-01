import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../front-office/pages/login/auth.service';
import { ChatService } from '../../services/chat.service';
import { Message, Conversation, Call } from '../../models/messages.model';

interface ChatConversation extends Conversation {
  interlocutorName?: string;
  interlocutorAvatar?: string;
  messages: Message[];
  status?: string;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  currentUser: User | null = null;
  conversations: ChatConversation[] = [];
  selectedConversation: ChatConversation | null = null;
  allPlatformUsers: User[] = [];

  messageText: string = '';
  searchQuery: string = '';
  editingMessageId: number | null = null;
  editContent: string = '';
  activeMenuId: number | null = null;

  selectedFile: File | null = null;
  currentCall: Call | null = null;
  isCallModalOpen: boolean = false;

  showEmojiPicker: boolean = false;
  emojiList: string[] = [
    '😊', '😂', '🥰', '😍', '😒', '😭', '😎', '🙏', '👍', '🔥', '✨', '❤️',
    '🩺', '💊', '🏥', '🚑', '💉', '🩹', '🩸', '🧬', '🔬', '🌡️',
    '👨‍⚕️', '👩‍⚕️', '🧑‍⚕️', '⚕️', '🧠', '🫀', '🫁', '🧘', '💆',
    '🍎', '🥗', '💧', '🏃', '😴', '✔️', '📞', '🆘', '⚠️'
  ];

  badWords: string[] = [];

  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) { }

  ngOnInit(): void {
    this.loadForbiddenWords();
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
      if (user && user.userId) {
        this.conversations = [];
        this.selectedConversation = null;
        this.loadConversations(user.userId);
        this.loadUsersFromPlatform();
      }
    });
  }

  loadForbiddenWords(): void {
    this.chatService.getForbiddenWords().subscribe({
      next: (words) => this.badWords = words,
      error: (err) => console.error("Erreur chargement mots interdits", err)
    });
  }

  public containsBadWords(text: string): boolean {
    if (!text || this.badWords.length === 0) return false;
    const lowerText = text.toLowerCase();
    return this.badWords.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lowerText);
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Le fichier est trop volumineux (max 5Mo)");
        return;
      }
      this.selectedFile = file;
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
  }

  toggleEmojiPicker(event: Event): void {
    event.stopPropagation(); // Empêche la fermeture immédiate
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string, event: Event): void {
    event.stopPropagation(); // Empêche le clic de fermer le picker via d'autres listeners
    this.messageText += emoji;
    // Optionnel: this.showEmojiPicker = false; // Décommentez si vous voulez fermer après un clic
  }

  handleSendMessage(): void {
    const currentId = this.currentUser?.userId;
    if ((!this.messageText.trim() && !this.selectedFile) || !this.selectedConversation || !currentId) return;

    if (this.containsBadWords(this.messageText)) {
      alert("Votre message contient des termes non autorisés.");
      return;
    }

    this.showEmojiPicker = false;

    this.chatService.postMessage(this.selectedConversation.id, currentId, this.messageText, this.selectedFile || undefined)
      .subscribe({
        next: (newMessage: Message) => {
          this.selectedConversation?.messages.push(newMessage);
          this.messageText = '';
          this.selectedFile = null;
          this.scrollToBottom();
        },
        error: (err) => alert("Erreur lors de l'envoi.")
      });
  }

  loadUsersFromPlatform(): void {
    this.chatService.getAllUsers().subscribe({
      next: (users: User[]) => {
        const currentId = this.currentUser?.userId;
        this.allPlatformUsers = users.filter(u => u.userId !== currentId);
      },
      error: (err) => console.error("Erreur utilisateurs", err)
    });
  }

  loadConversations(userId: string): void {
    this.chatService.getConversations(userId).subscribe({
      next: (data: any[]) => {
        this.conversations = (data || []) as ChatConversation[];
        this.conversations.forEach(conv => {
          conv.messages = conv.messages || [];
          this.updateInterlocutorInfo(conv);
        });
      },
      error: (err) => console.error("Erreur conversations", err)
    });
  }

  updateInterlocutorInfo(conv: ChatConversation) {
    const currentId = this.currentUser?.userId;
    if (!currentId) return;
    const otherId: string | undefined = currentId === conv.user1Id ? conv.user2Id : conv.user1Id;

    if (otherId) {
      this.chatService.getUserProfile(otherId).subscribe({
        next: (profile: User) => {
          conv.interlocutorName = profile.name || 'Utilisateur';
          conv.interlocutorAvatar = profile.profilePicture;
        },
        error: () => conv.interlocutorName = "Utilisateur"
      });
    }
  }

  selectConversation(conv: ChatConversation): void {
    this.selectedConversation = conv;
    this.chatService.getMessages(conv.id).subscribe({
      next: (msgs: Message[]) => {
        if (this.selectedConversation) {
          this.selectedConversation.messages = msgs;
          this.scrollToBottom();
        }
      },
      error: (err) => console.error("Erreur messages", err)
    });
  }

  startEdit(msg: Message) {
    this.editingMessageId = msg.id;
    this.editContent = msg.content;
  }

  cancelEdit() {
    this.editingMessageId = null;
  }

  saveEdit(msg: Message) {
    if (!this.editContent.trim()) return;
    if (this.containsBadWords(this.editContent)) {
      alert("La modification contient des termes non autorisés.");
      return;
    }
    this.chatService.updateMessage(msg.id, this.editContent).subscribe({
      next: () => {
        msg.content = this.editContent;
        this.cancelEdit();
      },
      error: (err) => alert("Modification refusée.")
    });
  }

  confirmDeleteMessage(id: number) {
    this.chatService.deleteMessage(id).subscribe({
      next: () => {
        if (this.selectedConversation) {
          this.selectedConversation.messages = this.selectedConversation.messages.filter(m => m.id !== id);
        }
      }
    });
  }

  handleArchiveConversation(conv: ChatConversation, event: Event) {
    event.stopPropagation();
    if (confirm("Archiver ?")) {
      this.chatService.archiveConversation(conv.id).subscribe({
        next: () => {
          conv.status = 'ARCHIVED';
          if (this.selectedConversation?.id === conv.id) this.selectedConversation = null;
        }
      });
    }
  }

  confirmDeleteConversation(id: number, event: Event) {
    event.stopPropagation();
    if (confirm("Supprimer ?")) {
      this.chatService.deleteConversation(id).subscribe({
        next: () => {
          this.conversations = this.conversations.filter(c => c.id !== id);
          if (this.selectedConversation?.id === id) this.selectedConversation = null;
        }
      });
    }
  }

  handleCreateConversation(targetUserId: string) {
    const currentId = this.currentUser?.userId;
    if (!targetUserId || !currentId) return;
    this.chatService.createConversation(currentId, targetUserId).subscribe({
      next: (newConv: any) => {
        const chatConv = newConv as ChatConversation;
        chatConv.messages = [];
        this.updateInterlocutorInfo(chatConv);
        this.conversations.unshift(chatConv);
        this.selectConversation(chatConv);
      }
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.chat-container');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }

  handleStartCall() {
    const userId = this.currentUser?.userId;
    if (!this.selectedConversation || !userId) return;
    this.chatService.startCall(this.selectedConversation.id, userId).subscribe({
      next: (call: Call) => {
        this.currentCall = call;
        this.isCallModalOpen = true;
      }
    });
  }

  handleEndCall() {
    if (!this.currentCall) return;
    this.chatService.endCall(this.currentCall.id).subscribe({
      next: () => {
        this.isCallModalOpen = false;
        this.currentCall = null;
      }
    });
  }
}

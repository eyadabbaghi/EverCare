import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message, Conversation, Call } from '../models/messages.model';
import { User } from '../../front-office/pages/login/auth.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private gatewayUrl = 'http://localhost:9000/communication-service/api';


  private userApiUrl = 'http://localhost:8096/EverCare/users';

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // --- GESTION DES MOTS INTERDITS (Centralisation) ---
  /**
   * Récupère la liste des mots interdits depuis le service Spring Boot
   */
  getForbiddenWords(): Observable<string[]> {
    return this.http.get<string[]>(`${this.gatewayUrl}/messages/forbidden-words`);
  }

  // --- GESTION DES UTILISATEURS ---
  getUserProfile(userId: string): Observable<User> {
    return this.http.get<User>(`${this.userApiUrl}/${userId}`, { headers: this.getHeaders() });
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.userApiUrl}/all`, { headers: this.getHeaders() });
  }

  // --- CONVERSATIONS ---
  getConversations(userId: string): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.gatewayUrl}/conversations/user/${userId}`);
  }

  createConversation(user1Id: string, user2Id: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.gatewayUrl}/conversations`, { user1Id, user2Id });
  }

  archiveConversation(id: number): Observable<Conversation> {
    return this.http.put<Conversation>(`${this.gatewayUrl}/conversations/${id}/status?active=false`, {});
  }

  deleteConversation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.gatewayUrl}/conversations/${id}`);
  }

  // --- MESSAGES ---
  getMessages(conversationId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.gatewayUrl}/messages/conversation/${conversationId}`);
  }

  postMessage(conversationId: number, senderId: string, content: string, file?: File): Observable<Message> {
    const formData = new FormData();
    formData.append('senderId', senderId);
    formData.append('content', content);
    if (file) {
      formData.append('file', file);
    }

    return this.http.post<Message>(`${this.gatewayUrl}/messages/${conversationId}`, formData);
  }

  /**
   * Met à jour le contenu d'un message après validation
   */
  updateMessage(messageId: number, content: string): Observable<Message> {
    // Si ton Controller Spring Boot utilise @RequestBody String newContent :
    return this.http.put<Message>(`${this.gatewayUrl}/messages/${messageId}`, content);
  }

  deleteMessage(messageId: number): Observable<void> {
    return this.http.delete<void>(`${this.gatewayUrl}/messages/${messageId}`);
  }

  // --- CALLS ---
  startCall(conversationId: number, callerId: string): Observable<Call> {
    return this.http.post<Call>(`${this.gatewayUrl}/calls/${conversationId}?callerId=${callerId}`, {});
  }

  endCall(callId: number): Observable<Call> {
    return this.http.patch<Call>(`${this.gatewayUrl}/calls/end/${callId}`, {});
  }
}

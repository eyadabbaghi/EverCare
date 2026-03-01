package com.yourteam.communicationservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.yourteam.communicationservice.entity.Conversation;
import com.yourteam.communicationservice.entity.Message;
import com.yourteam.communicationservice.Repository.ConversationRepository;
import com.yourteam.communicationservice.Repository.MessageRepository;
import com.yourteam.communicationservice.client.UserServiceClient; // Ajouté
import com.yourteam.communicationservice.dto.UserDto; // Ajouté
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ContentFilterService contentFilterService;
    private final UserServiceClient userServiceClient; // Injecté pour Feign

    public Message sendMessage(Long conversationId, Message message) {
        // 1. Sécurité contenu : Bloque les mots interdits
        if (contentFilterService.isContentInvalid(message.getContent())) {
            throw new IllegalArgumentException("Contenu inapproprié détecté.");
        }

        // 2. VERIFICATION FEIGN : On s'assure que l'expéditeur existe dans MySQL
        // Si le User-Service est éteint, Feign lèvera une exception ici.
        try {
            UserDto sender = userServiceClient.getUserById(message.getSenderId());
            if (sender == null) {
                throw new RuntimeException("L'expéditeur n'existe pas dans le système User.");
            }
        } catch (Exception e) {
            // Cette erreur apparaîtra dans vos logs si le service User est HS
            throw new RuntimeException("Validation de l'utilisateur via Feign a échoué : " + e.getMessage());
        }

        // 3. Récupération de la conversation dans H2
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation non trouvée"));

        message.setConversation(conv);
        return messageRepository.save(message);
    }

    public Message updateMessage(Long messageId, String newContent) {
        // Sécurité serveur sur la modification
        if (contentFilterService.isContentInvalid(newContent)) {
            throw new IllegalArgumentException("Modification inappropriée détectée.");
        }

        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message non trouvé"));
        msg.setContent(newContent);
        return messageRepository.save(msg);
    }

    public List<Message> getMessagesByConversation(Long conversationId) {
        return messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
    }

    public void deleteMessage(Long messageId) {
        messageRepository.deleteById(messageId);
    }

    public Message markAsRead(Long messageId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message non trouvé"));
        msg.setRead(true);
        return messageRepository.save(msg);
    }
}
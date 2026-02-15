package com.yourteam.communicationservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.yourteam.communicationservice.entity.Conversation;
import com.yourteam.communicationservice.entity.Message;
import com.yourteam.communicationservice.Repository.ConversationRepository;
import com.yourteam.communicationservice.Repository.MessageRepository;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    public Message sendMessage(Long conversationId, Message message) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation non trouvée avec l'ID: " + conversationId));

        message.setConversation(conv);
        return messageRepository.save(message);
    }

    public List<Message> getMessagesByConversation(Long conversationId) {
        return messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
    }


    // Mettre à jour le contenu d'un message
    public Message updateMessage(Long messageId, String newContent) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message non trouvé"));
        msg.setContent(newContent);
        return messageRepository.save(msg);
    }

    // Supprimer un message
    public void deleteMessage(Long messageId) {
        messageRepository.deleteById(messageId);
    }

    // Marquer un message comme lu
    public Message markAsRead(Long messageId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message non trouvé"));
        msg.setRead(true);
        return messageRepository.save(msg);
    }
}
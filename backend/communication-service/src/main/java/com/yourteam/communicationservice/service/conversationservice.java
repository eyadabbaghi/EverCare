package com.yourteam.communicationservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.yourteam.communicationservice.entity.Conversation;
import com.yourteam.communicationservice.Repository.ConversationRepository;
import com.yourteam.communicationservice.client.UserServiceClient; // Ajout
import com.yourteam.communicationservice.dto.UserDto; // Ajout
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class conversationservice {

    private final ConversationRepository conversationRepository;
    private final UserServiceClient userServiceClient; // Injection de Feign

    public Conversation createConversation(Conversation conversation) {
        // Validation via Feign avant enregistrement dans H2
        try {
            UserDto user1 = userServiceClient.getUserById(conversation.getUser1Id());
            UserDto user2 = userServiceClient.getUserById(conversation.getUser2Id());

            if (user1 == null || user2 == null) {
                throw new RuntimeException("Un des utilisateurs est introuvable");
            }
        } catch (Exception e) {
            throw new RuntimeException("Erreur de communication avec le service User : " + e.getMessage());
        }

        return conversationRepository.save(conversation);
    }

    public List<Conversation> getConversationsByUserId(String userId) {
        return conversationRepository.findByUser1IdOrUser2Id(userId, userId);
    }

    public Optional<Conversation> getConversationById(Long id) {
        return conversationRepository.findById(id);
    }

    public Conversation toggleConversationStatus(Long id, boolean status) {
        return conversationRepository.findById(id).map(conv -> {
            conv.setActive(status);
            return conversationRepository.save(conv);
        }).orElseThrow(() -> new RuntimeException("Conversation non trouvée"));
    }

    public void deleteConversation(Long id) {
        conversationRepository.deleteById(id);
    }
}
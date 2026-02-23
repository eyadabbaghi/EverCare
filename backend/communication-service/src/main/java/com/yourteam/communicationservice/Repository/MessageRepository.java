package com.yourteam.communicationservice.Repository; // Vérifie bien la majuscule sur Repository selon ton dossier

import org.springframework.data.jpa.repository.JpaRepository;
import com.yourteam.communicationservice.entity.Message; // Import corrigé ici
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderBySentAtAsc(Long conversationId);
}
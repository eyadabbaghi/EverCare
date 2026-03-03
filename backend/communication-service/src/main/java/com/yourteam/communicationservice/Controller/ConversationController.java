package com.yourteam.communicationservice.Controller;



import com.yourteam.communicationservice.entity.Conversation;
import com.yourteam.communicationservice.service.conversationservice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor

public class ConversationController {

    private final conversationservice conversationService;

    // 1. Créer une conversation privée [cite: 4]
    @PostMapping
    public ResponseEntity<Conversation> createConversation(@RequestBody Conversation conversation) {
        return ResponseEntity.ok(conversationService.createConversation(conversation));
    }

    // 2. Récupérer la liste des conversations pour un utilisateur spécifique
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Conversation>> getConversationsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(conversationService.getConversationsByUserId(userId));
    }

    // 3. Voir les détails d'une conversation spécifique
    @GetMapping("/{id}")
    public ResponseEntity<Conversation> getConversationById(@PathVariable Long id) {
        return conversationService.getConversationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. Activer / désactiver (archiver) une conversation [cite: 6]
    @PutMapping("/{id}/status")
    public ResponseEntity<Conversation> toggleStatus(@PathVariable Long id, @RequestParam boolean active) {
        return ResponseEntity.ok(conversationService.toggleConversationStatus(id, active));
    }

    // 5. Supprimer une conversation
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable Long id) {
        conversationService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }
}
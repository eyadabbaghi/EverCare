package com.yourteam.communicationservice.Controller;



import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.yourteam.communicationservice.entity.Message;
import com.yourteam.communicationservice.service.MessageService;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    // URL: POST http://localhost:9000/communication-service/api/messages/1
    @PostMapping("/{conversationId}")
    public ResponseEntity<Message> sendMessage(
            @PathVariable Long conversationId,
            @RequestBody Message message) {
        return ResponseEntity.ok(messageService.sendMessage(conversationId, message));
    }

    // URL: GET http://localhost:9000/communication-service/api/messages/conversation/1
    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<List<Message>> getMessages(@PathVariable Long conversationId) {
        return ResponseEntity.ok(messageService.getMessagesByConversation(conversationId));
    }


    // Modifier un message : PUT http://localhost:9000/communication-service/api/messages/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Message> updateMessage(@PathVariable Long id, @RequestBody String newContent) {
        return ResponseEntity.ok(messageService.updateMessage(id, newContent));
    }

    // Supprimer un message : DELETE http://localhost:9000/communication-service/api/messages/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        messageService.deleteMessage(id);
        return ResponseEntity.noContent().build();
    }

    // Marquer comme lu : PATCH http://localhost:9000/communication-service/api/messages/{id}/read
    @PatchMapping("/{id}/read")
    public ResponseEntity<Message> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(messageService.markAsRead(id));
    }
}
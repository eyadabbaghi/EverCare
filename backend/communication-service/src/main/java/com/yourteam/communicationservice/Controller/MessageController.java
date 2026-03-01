package com.yourteam.communicationservice.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; // Manquant
import com.yourteam.communicationservice.entity.Message;
import com.yourteam.communicationservice.service.MessageService;
import com.yourteam.communicationservice.service.ContentFilterService;

import java.io.IOException;
import java.nio.file.Files; // Manquant
import java.nio.file.Path;  // Manquant
import java.nio.file.Paths; // Manquant
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final ContentFilterService contentFilterService;

    @GetMapping("/forbidden-words")
    public ResponseEntity<List<String>> getForbiddenWords() {
        return ResponseEntity.ok(contentFilterService.getForbiddenWords());
    }

    @PostMapping("/{conversationId}")
    public ResponseEntity<Message> sendMessage(
            @PathVariable Long conversationId,
            @RequestParam(value = "senderId") String senderId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {

        // Note: Assure-toi que ton entité Message possède bien l'annotation @Builder ou remplace par un "new Message()"
        Message message = new Message();
        message.setSenderId(senderId);
        message.setContent(content != null ? content : "");

        if (file != null && !file.isEmpty()) {
            // Création du nom de fichier unique
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            // Chemin de stockage (crée un dossier 'uploads' à la racine de ton projet)
            Path path = Paths.get("uploads/" + fileName);
            Files.createDirectories(path.getParent());
            Files.write(path, file.getBytes());

            // Mise à jour des infos du message avec les détails du fichier
            message.setFileName(file.getOriginalFilename());
            message.setFileType(file.getContentType());
            message.setFileUrl("/uploads/" + fileName);
        }

        return ResponseEntity.ok(messageService.sendMessage(conversationId, message));
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<List<Message>> getMessages(@PathVariable Long conversationId) {
        return ResponseEntity.ok(messageService.getMessagesByConversation(conversationId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Message> updateMessage(@PathVariable Long id, @RequestBody String newContent) {
        return ResponseEntity.ok(messageService.updateMessage(id, newContent));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        messageService.deleteMessage(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Message> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(messageService.markAsRead(id));
    }
}
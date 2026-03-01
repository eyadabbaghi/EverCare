package com.yourteam.communicationservice.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    @JsonIgnore // Empêche les boucles infinies lors de la conversion en JSON
    private Conversation conversation;

    @Column(nullable = false)
    private String senderId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private LocalDateTime sentAt;

    private boolean isRead;

    @Column(nullable = true)
    private String fileName;

    @Column(nullable = true)
    private String fileType; // image/png, application/pdf, etc.

    @Column(nullable = true)
    private String fileUrl;

    @PrePersist
    protected void onSend() {
        this.sentAt = LocalDateTime.now();
        this.isRead = false;
    }
}
package com.yourteam.communicationservice.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.yourteam.communicationservice.entity.Call;
import com.yourteam.communicationservice.service.CallService;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
public class CallController {

    private final CallService callService;

    // Lancer un appel : POST http://localhost:9000/communication-service/api/calls/1?callerId=user-patient-001
    @PostMapping("/{conversationId}")
    public ResponseEntity<Call> startCall(@PathVariable Long conversationId, @RequestParam String callerId) {
        return ResponseEntity.ok(callService.startCall(conversationId, callerId));
    }

    // Terminer un appel : PATCH http://localhost:9000/communication-service/api/calls/end/1
    @PatchMapping("/end/{callId}")
    public ResponseEntity<Call> endCall(@PathVariable Long callId) {
        return ResponseEntity.ok(callService.endCall(callId));
    }
}
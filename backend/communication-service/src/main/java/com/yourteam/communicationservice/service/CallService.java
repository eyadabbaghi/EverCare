package com.yourteam.communicationservice.service;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.yourteam.communicationservice.entity.*;
import com.yourteam.communicationservice.Repository.*;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CallService {

    private final CallRepository callRepository;
    private final ConversationRepository conversationRepository;

    public Call startCall(Long conversationId, String callerId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation non trouvée"));

        Call call = Call.builder()
                .conversation(conv)
                .callerId(callerId)
                .status(CallStatus.INITIATED)
                .build();
        return callRepository.save(call);
    }

    public Call endCall(Long callId) {
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Appel non trouvé"));

        call.setEndTime(LocalDateTime.now());
        call.setStatus(CallStatus.COMPLETED);

        long seconds = Duration.between(call.getStartTime(), call.getEndTime()).getSeconds();
        call.setDurationInSeconds(seconds);

        return callRepository.save(call);
    }
}
package com.yourteam.communicationservice.Repository;



import org.springframework.data.jpa.repository.JpaRepository;
import com.yourteam.communicationservice.entity.Call;
import java.util.List;

public interface CallRepository extends JpaRepository<Call, Long> {
    List<Call> findByConversationId(Long conversationId);
}
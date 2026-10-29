package com.resolveai.backend.repository;

import com.resolveai.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Integer> {
    List<Message> findByTicket_TicketIdOrderByCreatedAtAsc(Integer ticketId);

    void deleteByTicket_TicketId(Integer ticketId);
}
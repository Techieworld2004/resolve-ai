package com.resolveai.backend.repository;

import com.resolveai.backend.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Integer> {
    List<Ticket> findByUser_UserId(Integer userId);

    List<Ticket> findByUser_UserIdOrderByCreatedAtDesc(Integer userId);

    List<Ticket> findByStatus(Ticket.Status status);

    List<Ticket> findByAssignedTo_UserId(Integer agentId);

    List<Ticket> findAllByOrderByCreatedAtDesc();
}
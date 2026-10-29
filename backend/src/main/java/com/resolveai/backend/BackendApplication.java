package com.resolveai.backend;

import com.resolveai.backend.entity.Message;
import com.resolveai.backend.entity.Ticket;
import com.resolveai.backend.entity.User;
import com.resolveai.backend.repository.MessageRepository;
import com.resolveai.backend.repository.TicketRepository;
import com.resolveai.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    CommandLineRunner seedDemoData(UserRepository userRepository,
                                   TicketRepository ticketRepository,
                                   MessageRepository messageRepository,
                                   PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                // Seed Admin
                User admin = new User();
                admin.setFullName("Admin System");
                admin.setEmail("admin@resolveai.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(User.Role.ADMIN);
                userRepository.save(admin);

                // Seed Support Agent
                User agent = new User();
                agent.setFullName("Sarah Connor");
                agent.setEmail("agent@resolveai.com");
                agent.setPassword(passwordEncoder.encode("agent123"));
                agent.setRole(User.Role.AGENT);
                userRepository.save(agent);

                // Seed ResolveAI Bot Assistant
                User bot = new User();
                bot.setFullName("ResolveAI Assistant");
                bot.setEmail("bot@resolveai.com");
                bot.setPassword(passwordEncoder.encode("bot12345"));
                bot.setRole(User.Role.AGENT);
                userRepository.save(bot);

                // Seed Customer
                User customer = new User();
                customer.setFullName("Alex Johnson");
                customer.setEmail("customer@resolveai.com");
                customer.setPassword(passwordEncoder.encode("customer123"));
                customer.setRole(User.Role.CUSTOMER);
                customer = userRepository.save(customer);

                // Sample Ticket 1
                Ticket t1 = new Ticket();
                t1.setUser(customer);
                t1.setSubject("Payment gateway timeout during checkout");
                t1.setDescription("I was attempting to renew our team subscription via credit card and received a 504 Gateway Timeout error. Please verify whether the transaction went through.");
                t1.setStatus(Ticket.Status.OPEN);
                t1.setPriority(Ticket.Priority.HIGH);
                t1.setCategory("Billing");
                ticketRepository.save(t1);

                // Sample Ticket 2
                Ticket t2 = new Ticket();
                t2.setUser(customer);
                t2.setAssignedTo(agent);
                t2.setSubject("Need assistance enabling 2FA on team account");
                t2.setDescription("Could you please provide documentation or guide on how to enforce 2-Factor Authentication for all members in our organization?");
                t2.setStatus(Ticket.Status.IN_PROGRESS);
                t2.setPriority(Ticket.Priority.MEDIUM);
                t2.setCategory("Account Issues");
                t2 = ticketRepository.save(t2);

                // Sample Message on Ticket 2
                Message m1 = new Message();
                m1.setTicket(t2);
                m1.setSender(customer);
                m1.setMessageText("Hi Support team, we recently had new joiners and want to mandate authenticator apps.");
                messageRepository.save(m1);

                Message m2 = new Message();
                m2.setTicket(t2);
                m2.setSender(agent);
                m2.setMessageText("Hello Alex! I am looking into your organization's security policy settings right now. You can toggle Enforce 2FA under Settings > Security.");
                messageRepository.save(m2);

                System.out.println(">>> Demo data successfully seeded! <<<");
            }
        };
    }
}

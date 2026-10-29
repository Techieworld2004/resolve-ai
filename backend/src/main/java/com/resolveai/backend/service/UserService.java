package com.resolveai.backend.service;

import com.resolveai.backend.entity.User;
import com.resolveai.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Business logic for user registration, authentication, and retrieval.
 */
@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Register a new user after verifying email uniqueness.
     * The plain-text password is hashed with BCrypt before storage.
     *
     * @param user user data from the registration request
     * @return the persisted {@link User} with a generated ID
     * @throws RuntimeException if the email is already registered
     */
    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already registered: " + user.getEmail());
        }
        // Hash the password before persisting
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    /**
     * Authenticate a user by email and plain-text password.
     *
     * @param email    the user's email address
     * @param password the raw (un-hashed) password provided by the client
     * @return an {@link Optional} containing the user if credentials are valid, or empty otherwise
     */
    @Transactional(readOnly = true)
    public Optional<User> login(String email, String password) {
        return userRepository.findByEmail(email)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()));
    }

    /**
     * Find a user by their numeric ID.
     *
     * @param id the user's primary key
     * @return an {@link Optional} containing the user, or empty if not found
     */
    @Transactional(readOnly = true)
    public Optional<User> getUserById(Integer id) {
        if (id == null || id <= 0) {
            return Optional.empty();
        }
        return userRepository.findById(id);
    }

    /**
     * Find a user by their email address.
     *
     * @param email the email to look up
     * @return an {@link Optional} containing the user, or empty if not found
     */
    @Transactional(readOnly = true)
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Return all registered users. Use with care – prefer paginated queries
     * in production when the user base is large.
     */
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Update mutable profile fields (fullName, role) for an existing user.
     *
     * @param id      the ID of the user to update
     * @param updated the new field values
     * @return the updated {@link User}
     * @throws RuntimeException if no user exists with the given ID
     */
    public User updateUser(Integer id, User updated) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        existing.setFullName(updated.getFullName());
        if (updated.getRole() != null) {
            existing.setRole(updated.getRole());
        }
        return userRepository.save(existing);
    }

    public void deleteUser(Integer id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }
}

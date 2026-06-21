package com.smartassembly.backend.security;

import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        log.debug("[JWT] URI: {}", request.getRequestURI());

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            boolean valid = jwtUtil.validateToken(token);
            log.debug("[JWT] Token valid: {}", valid);

            if (valid) {
                String phone = jwtUtil.extractPhone(token);

                User user = userRepository.findByPhone(phone).orElse(null);
                log.debug("[JWT] User found: {}", user != null ? "role=" + user.getRole() + " active=" + user.getIsActive() : "NULL");

                if (user != null && user.getIsActive()) {
                    var authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
                    var auth = new UsernamePasswordAuthenticationToken(
                            user, null, List.of(authority)
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    log.debug("[JWT] Auth set: ROLE_{}", user.getRole().name());
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
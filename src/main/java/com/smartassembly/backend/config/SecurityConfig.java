package com.smartassembly.backend.config;

import com.smartassembly.backend.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    /**
     * ✅ AuthenticationProvider, который отключает встроенную аутентификацию.
     * Это предотвращает генерацию автоматического пароля Spring Security.
     */
    @Bean
    public AuthenticationProvider disabledAuthenticationProvider() {
        return new AuthenticationProvider() {
            @Override
            public Authentication authenticate(Authentication authentication) throws AuthenticationException {
                throw new BadCredentialsException("Built-in authentication is disabled. Use JWT with /api/auth/send-code");
            }

            @Override
            public boolean supports(Class<?> authentication) {
                return true;
            }
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // ✅ Добавить provider, который отключает встроенную аутентификацию
                .authenticationProvider(disabledAuthenticationProvider())
                .authorizeHttpRequests(auth -> auth
                        // 1. Публичные эндпоинты — без токена
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/registration/submit",
                                "/api/webhook/**",
                                "/",
                                "/*.html",
                                "/static/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/webjars/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // 2. Миграция из Google Sheets — HR и SUPER_ADMIN
                        .requestMatchers("/api/admin/sheets/**").hasAnyRole("SUPER_ADMIN", "HR")

                        // 3. Остальные admin эндпоинты — только SUPER_ADMIN
                        .requestMatchers("/api/admin/**").hasRole("SUPER_ADMIN")

                        // 4. Требовать аутентификацию для всех остальных
                        .anyRequest().authenticated()
                )
                // ✅ JWT фильтр должен быть ПЕРЕД UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://localhost:5173",
                "https://smart-assembly.kz"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
package tn.esprit.user.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import tn.esprit.user.security.LocalUserJwtAuthenticationConverter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final LocalUserJwtAuthenticationConverter jwtAuthenticationConverter;

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        // IMPORTANT : On dit à Spring d'ignorer TOTALEMENT ces routes.
        // Le JwtAuthenticationFilter ne sera même pas déclenché pour elles.
        return (web) -> web.ignoring()
                .requestMatchers("/auth/**")
                .requestMatchers("/uploads/**")
                .requestMatchers(HttpMethod.GET, "/users/**");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // On réitère ici par sécurité
                        .requestMatchers("/auth/**", "/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/users/**").permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .jwtAuthenticationConverter(jwtAuthenticationConverter)
                        )
                );

        return http.build();
    }
}
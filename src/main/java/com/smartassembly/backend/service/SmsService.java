package com.smartassembly.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@Slf4j
public class SmsService {

    @Value("${mobizon.api-key:}")
    private String apiKey;

    @Value("${mobizon.enabled:false}")
    private boolean enabled;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void send(String phone, String message) {
        if (!enabled || apiKey.isBlank()) {
            log.info("📱 [DEV SMS] Телефон: {} | Сообщение: {}", phone, message);
            return;
        }

        try {
            // Нормализуем номер: удаляем всё кроме цифр
            String digits = phone.replaceAll("[^0-9]", "");

            // Добавляем + если его нет
            String normalizedPhone = digits.startsWith("+") ? digits : "+" + digits;

            String url = UriComponentsBuilder
                    .fromHttpUrl("https://api.mobizon.kz/service/message/sendsmsmessage")
                    .queryParam("output", "json")
                    .queryParam("api", "v1")
                    .queryParam("apiKey", apiKey)
                    .queryParam("recipient", normalizedPhone)
                    .queryParam("text", message)
                    .toUriString();

            log.debug("📤 Отправляем SMS на {} (нормализованный: {})", phone, normalizedPhone);

            String response = restTemplate.getForObject(url, String.class);

            // Проверяем код ответа
            JsonNode json = objectMapper.readTree(response);
            int code = json.path("code").asInt(-1);
            if (code == 0) {
                log.info("✅ SMS отправлено на {}", phone);
            } else {
                log.error("❌ Mobizon ошибка {}: {} | Номер: {} | Текст: {}",
                        code, json.path("message").asText(), normalizedPhone, message);
            }

        } catch (Exception e) {
            log.error("Ошибка отправки SMS на {}: {}", phone, e.getMessage(), e);
        }
    }

}
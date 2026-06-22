package com.smartassembly.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    @Value("${mobizon.api-key:}")
    private String apiKey;

    @Value("${mobizon.enabled:false}")
    private boolean enabled;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void send(String phone, String message) {
        if (!enabled || apiKey.isBlank()) {
            log.info("📱 [DEV SMS] Телефон: {} | Сообщение: {}", phone, message);
            return;
        }

        try {
            // Нормализуем номер: удаляем всё кроме цифр (Mobizon требует формат без +)
            String normalizedPhone = phone.replaceAll("[^0-9]", "");

            // output=json / api=v1 — роутинговые URL-параметры Mobizon, должны
            // идти в query string. apiKey/recipient/text — в form body POST,
            // Spring сам корректно их URL-кодирует.
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("apiKey", apiKey);
            form.add("recipient", normalizedPhone);
            form.add("text", message);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);

            log.debug("📤 Отправляем SMS на {} (нормализованный: {})", phone, normalizedPhone);

            String response = restTemplate.postForObject(
                    "https://api.mobizon.kz/service/message/sendsmsmessage?output=json&api=v1",
                    request,
                    String.class);

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
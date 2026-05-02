package com.smartassembly.backend.config;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.context.annotation.Lazy;


import java.io.InputStream;
import java.util.List;

@Configuration
@Lazy
public class GoogleSheetsConfig {

    @Value("${google.sheets.credentials-path}")
    private String credentialsPath;

    @Bean
    public Sheets sheetsService() throws Exception {
        GoogleCredentials credentials;

        try (InputStream in = new ClassPathResource(
                credentialsPath.replace("classpath:", "")).getInputStream()) {
            credentials = GoogleCredentials
                    .fromStream(in)
                    .createScoped(List.of(SheetsScopes.SPREADSHEETS));
        }

        HttpRequestInitializer requestInitializer =
                new HttpCredentialsAdapter(credentials);

        return new Sheets.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                requestInitializer)
                .setApplicationName("Smart Assembly")
                .build();
    }
}
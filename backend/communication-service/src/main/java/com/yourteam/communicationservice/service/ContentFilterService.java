package com.yourteam.communicationservice.service;

import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class ContentFilterService {

    // Liste centralisée
    private final List<String> badWords = Arrays.asList(
            "merde", "con", "connard", "salope", "encule", "batard", "pute", "bordel",
            "abruti", "debile", "nègre", "bougnoule", "pd", "pede", "raciste", "nazi",
            "vends", "achat", "argent", "gratuit", "hack", "casino", "poker", "crypto"
    );

    public List<String> getForbiddenWords() {
        return badWords;
    }

    public boolean isContentInvalid(String content) {
        if (content == null || content.isBlank()) return false;
        String lowerContent = content.toLowerCase();

        return badWords.stream().anyMatch(word -> {
            // Regex \b pour détecter le mot exact (évite de bloquer "content" pour "con")
            String regex = "\\b" + Pattern.quote(word.toLowerCase()) + "\\b";
            return Pattern.compile(regex).matcher(lowerContent).find();
        });
    }
}
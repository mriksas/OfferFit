package com.offerfit.ats.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "ai.config")
@Getter
@Setter
public class AiConfigProperties {
    
    private String provider;
    private String apiKey;
    private String apiUrl;
    private String model;
    private Integer maxTokens;
    private Double temperature;
    private Integer requestTimeoutSeconds;
    
    public AiConfigProperties() {
        this.apiUrl = "https://openrouter.ai/api/v1/chat/completions";
        this.model = "deepseek/deepseek-v4-flash:free";

    }
}

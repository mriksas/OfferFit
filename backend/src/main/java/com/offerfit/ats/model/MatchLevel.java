package com.offerfit.ats.model;

public enum MatchLevel {
    HIGH(1.0, "Full match - requirement directly matched"),
    MEDIUM(0.7, "Partial match - related skill/experience"),
    LOW(0.4, "Weak match - tangentially related"),
    NONE(0.0, "No match - requirement not met");
    
    private final Double score;
    private final String description;
    
    MatchLevel(Double score, String description) {
        this.score = score;
        this.description = description;
    }
    
    public Double getScore() {
        return score;
    }
    
    public String getDescription() {
        return description;
    }
}

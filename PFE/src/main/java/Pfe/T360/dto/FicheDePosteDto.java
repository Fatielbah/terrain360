package Pfe.T360.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class FicheDePosteDto {
	private Long id;
    private String titre;
    private String service;
    private String typeContrat;
    private String localisation;
    private LocalDateTime datePublication;
    private String typeEmploi;
    private String description;
    private boolean status;
    private double salaireMin;
    private double salaireMax;
    private String evolutionProfessionnelle;
    private String avantages;
    private List<MissionDto> missions;
    private List<CompetenceDto> competencesRequises;
}

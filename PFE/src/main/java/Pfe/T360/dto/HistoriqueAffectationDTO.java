package Pfe.T360.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class HistoriqueAffectationDTO {
    private Long id;
    private Long materielId;
    private Long utilisateurId;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String statut;
    private String commentaire;
    private LocalDateTime createdAt;
}

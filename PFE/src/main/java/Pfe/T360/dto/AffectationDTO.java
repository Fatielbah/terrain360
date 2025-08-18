package Pfe.T360.dto;

import java.time.LocalDate;

import Pfe.T360.entity.Affectation.StatutAffectation;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AffectationDTO {
    private Long id;
    private Long materielId;
    private Long utilisateurId;
    private Long technicienId;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String motif;
    
    private StatutAffectation statut;
}

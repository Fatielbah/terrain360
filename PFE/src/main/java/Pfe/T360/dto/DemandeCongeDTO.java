package Pfe.T360.dto;

import java.time.LocalDate;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DemandeCongeDTO {
    private String type;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String commentaire;
}

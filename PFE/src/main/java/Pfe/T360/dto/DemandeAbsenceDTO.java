package Pfe.T360.dto;

import java.time.LocalDate;
import java.time.LocalTime;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DemandeAbsenceDTO {
    private String type;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String heureDebut;
    private String heureFin;
    private String commentaire;
    private boolean estUrgente;
}
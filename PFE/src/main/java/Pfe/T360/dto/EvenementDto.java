package Pfe.T360.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import lombok.Data;

@Data
public class EvenementDto {
    private Long id;
    private String titre;
    private String description;
    private LocalDate date;
    private LocalTime heureDebut;
    private LocalTime heureFin;
    private Long createurId;
    private Long rappelId; // si tu veux l'inclure
    private List<Long> invitationsIds; // si tu veux inclure aussi
}

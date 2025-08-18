package Pfe.T360.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Getter;
import lombok.Setter;
import Pfe.T360.entity.Rappel;

@Getter
@Setter
public class TacheRequest {
    private String titre;
    private String description;
    private LocalDate date;
    private CustomTimeDto heureDebut;
    private CustomTimeDto heureFin;
    private String visibilite;
    private String priorite;
    private String statut;
    private Long utilisateurId;
    private Rappel rappel;
    private List<Long> servicesIds;
}

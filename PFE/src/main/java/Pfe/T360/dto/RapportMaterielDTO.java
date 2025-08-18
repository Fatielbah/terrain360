package Pfe.T360.dto;

import java.util.List;

import Pfe.T360.entity.HistoriqueAffectation;
import Pfe.T360.entity.Materiel;
import Pfe.T360.entity.Ticket;
import lombok.Data;

@Data
public class RapportMaterielDTO {
    private Materiel materiel;
    private List<HistoriqueAffectation> affectations;
    private List<Ticket> tickets;
}

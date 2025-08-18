package Pfe.T360.dto;

import java.time.LocalDate;

import Pfe.T360.entity.Materiel.EtatMateriel;
import Pfe.T360.entity.Materiel.TypeMateriel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MaterielDTO {
	private Long id;
    private String numeroSerie;
    private String marque;
    
    private String modele;
    private TypeMateriel type;
    private LocalDate dateAchat;
    private Integer dureeGarantie;
    private EtatMateriel etat;
}

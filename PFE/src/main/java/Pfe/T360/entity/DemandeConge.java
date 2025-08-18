package Pfe.T360.entity;
import java.time.temporal.ChronoUnit;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "demandes_conge")
public class DemandeConge extends Demande {
    @Enumerated(EnumType.STRING)
    private TypeConge type;
    
    public long calculerDuree() {
        return ChronoUnit.DAYS.between(getDateDebut(), getDateFin()) + 1;
    }
    
    public enum TypeConge {
        CONGE_ANNUEL,
        CONGE_EXCEPTIONNEL,
        CONGE_MALADIE,
        CONGE_MATERNITE_PATERNITE,
        CONGE_SANS_SOLDE
    }
}




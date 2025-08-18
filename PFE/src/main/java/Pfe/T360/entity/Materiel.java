package Pfe.T360.entity;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import Pfe.T360.entity.Affectation.StatutAffectation;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "materiel")
public class Materiel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String numeroSerie;
    
    @Column(nullable = false)
    private String marque;
    
    private String modele;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeMateriel type;
    
    @Column(nullable = false)
    private LocalDate dateAchat;
    
    private Integer dureeGarantie;
    private boolean notificationGarantieEnvoyee = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EtatMateriel etat;
    
    @JsonIgnore
    @OneToMany(mappedBy = "materiel", cascade = CascadeType.ALL)
    private List<Affectation> affectations;
    
    @JsonIgnore
    @OneToMany(mappedBy = "materiel")
    private List<Ticket> tickets;
    
    @JsonIgnore
    @OneToMany(mappedBy = "materiel")
    private List<HistoriqueAffectation> historiqueAffectations;
    @JsonIgnore
    public Affectation getAffectationActive() {
        return this.affectations.stream()
                .filter(a -> a.getStatut() == StatutAffectation.ACTIVE)
                .findFirst()
                .orElse(null); // ou lancez une exception si nécessaire
    }
    public boolean isGarantieExpiree() {
        if (dateAchat == null || dureeGarantie == null) return false;
        LocalDate dateFinGarantie = dateAchat.plusMonths(dureeGarantie);
        return LocalDate.now().isAfter(dateFinGarantie);
    }


    public enum EtatMateriel {
        FONCTIONNEL, 
        EN_PANNE, 
        EN_REPARATION,
        HORS_SERVICE
    }
    
    public enum TypeMateriel {
        ORDINATEUR,
        CASQUE,
        LOGICIEL,
        PERIPHERIQUE,
        SERVEUR,
        RESEAU
    }
}
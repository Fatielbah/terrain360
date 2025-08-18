package Pfe.T360.entity;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String description;
    private StatutTicket statut;         // Ouvert, En cours, Résolu
    private LocalDateTime dateCreation;
    private LocalDateTime dateResolution;
    private Priorite priorite;        // Haute, Moyenne, Basse
    public enum StatutTicket {
        OUVERT, EN_COURS, RESOLU
    }

    public enum Priorite {
        BASSE, MOYENNE, HAUTE
    }
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "materiel_id")
    private Materiel materiel;
    
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "declarant_id")
    private Utilisateur declarant;
    
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "technicien_id")
    private Utilisateur technicien;
}

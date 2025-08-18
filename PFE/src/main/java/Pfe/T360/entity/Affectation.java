package Pfe.T360.entity;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "affectation")
@NoArgsConstructor
@AllArgsConstructor
public class Affectation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "materiel_id", nullable = false)
    private Materiel materiel;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;
    
    @Column(nullable = false)
    private LocalDate dateDebut;
    
    private LocalDate dateFin;
    
    @Column(length = 500)
    private String motif;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technicien_id")
    private Utilisateur technicien;
    
    // Relation avec l'historique
    @JsonIgnore
    @OneToOne(mappedBy = "affectation", cascade = CascadeType.ALL)
    private HistoriqueAffectation historique;
    
    public enum StatutAffectation {
        ACTIVE,
        TERMINATED
    }

    @Enumerated(EnumType.STRING)
    private StatutAffectation statut = StatutAffectation.ACTIVE; // Default: ACTIVE
    
    
}
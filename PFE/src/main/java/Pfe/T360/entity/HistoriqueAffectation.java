package Pfe.T360.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "historique_affectation")
public class HistoriqueAffectation {

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

    @Enumerated(EnumType.STRING)
    private StatutAffectation statut;

    @Column(length = 500)
    private String commentaire;

    // Audit
    private LocalDateTime createdAt;
    private String createdBy;

    // Relation avec l'affectation d'origine
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "affectation_id")
    private Affectation affectation;

    public enum StatutAffectation {
        ACTIVE,
        TERMINEE,
        ANNULEE
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
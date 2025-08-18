package Pfe.T360.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Entity
public class Candidature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String civilite; // "Homme" / "Femme"
    private String nomComplet;
    private String email;
    private String telephone;
    private String adresse;
    private String codePostal;
    private String ville;
    private String message;
    private Integer scoreIA;
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "cv_id")
    private File cv;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "lettre_motivation_id")
    private File lettreMotivation;
    
    @Enumerated(EnumType.STRING)
    private StatutCandidature statut = StatutCandidature.EN_ATTENTE;
    
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fiche_id")
    private FicheDePoste ficheDePoste;
    private String statutAnalyseIA;
    private LocalDateTime dateSoumission;

    public enum StatutCandidature {
        EN_ATTENTE,
        ENTRETIEN,
        REJETE,
        ACCEPTE
    }
}

package Pfe.T360.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

import Pfe.T360.entity.DemandeConge.TypeConge;

@Entity
@Data
public class Conge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
    
    @Enumerated(EnumType.STRING)
    private TypeConge type;
    
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private LocalDate dateValidation;
    private float joursConsommes;
    
    @ManyToOne
    @JoinColumn(name = "demande_id")
    private DemandeConge demandeOrigine;
    
    
}
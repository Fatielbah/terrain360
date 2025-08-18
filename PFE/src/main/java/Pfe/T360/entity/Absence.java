package Pfe.T360.entity;

import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

import Pfe.T360.entity.DemandeAbsence.TypeAbsence;

@Getter
@Setter
@Entity
@Table(name = "absences")
public class Absence {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @Enumerated(EnumType.STRING)
    private TypeAbsence type;

    private LocalDate dateDebut;
    private LocalDate dateFin;

    @Column(name = "date_validation")
    private LocalDate dateValidation;

    @ManyToOne
    @JoinColumn(name = "demande_origine_id")
    private DemandeAbsence demandeOrigine;

    private boolean estUrgente;
    private String commentaire;
}
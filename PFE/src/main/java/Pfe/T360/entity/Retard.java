package Pfe.T360.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Entity
public class Retard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;
    private LocalTime heureArrivee;
    private boolean justifie;
    private String remarque;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id") // L'employé en retard
    private Utilisateur utilisateur;

    @ManyToOne
    @JoinColumn(name = "superviseur_id") // Celui qui saisit le retard
    private Utilisateur superviseur;

    // Getters et setters générés ou via Lombok
}

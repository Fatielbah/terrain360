package Pfe.T360.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
@Data
@Entity
public class AlerteRetard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate dateGeneration;
    private int nbRetards;
    private boolean seuilDepasse;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id") // L'utilisateur concerné par l'alerte
    private Utilisateur utilisateur;

    // Getters / Setters générés ou Lombok
}

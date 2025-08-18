package Pfe.T360.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.Data;

@Data
@Entity
public class FicheDePoste {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String titre;
    private String service;
    private String typeContrat;
    private String localisation;
    private LocalDateTime datePublication;
    private String typeEmploi;
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private boolean status;// ouvert ou feremer
    private double salaireMin;
    private double salaireMax;
    @JsonIgnore
    @OneToMany(mappedBy = "ficheDePoste", cascade = CascadeType.ALL)
    private List<Candidature> candidatures;
    @Column(columnDefinition = "TEXT")
    private String evolutionProfessionnelle;

    @Column(columnDefinition = "TEXT")
    private String avantages;
   
    @JsonIgnore
    @OneToMany(mappedBy = "fiche", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Mission> missions = new ArrayList<>();
    @JsonIgnore
    @OneToMany(mappedBy = "fiche", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Competence> competencesRequises = new ArrayList<>();

} 
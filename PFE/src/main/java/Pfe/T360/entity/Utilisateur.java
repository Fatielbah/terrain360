package Pfe.T360.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Utilisateur {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
    private String prenom;
    private LocalDate dateNaissance;
    private String adresse;
    private String nomDeUtilisateur;
    private String motDePasse;
    private String telephone;
    private String genre;
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "image_id")
    private File image;
    private String nationalite;
    private String email;
    private LocalDate dateEmbauche;
    private String cin ;
    private String situationFamiliale;
    
    @Enumerated(EnumType.STRING)
    private Role role;
    @ManyToOne
    @JoinColumn(name = "service_id")
    @JsonIgnore
    private Services service;

    @JsonIgnore
    @OneToMany(mappedBy = "utilisateur")
    private List<Affectation> affectations;
    @JsonIgnore
    @OneToMany(mappedBy = "utilisateur", cascade = CascadeType.ALL)
    private List<Demande> demandes = new ArrayList<>();
    @JsonIgnore
    @OneToMany(mappedBy = "utilisateur")
    private List<Conge> conges;
    
    private float joursCongesConsommes;
    
    @JsonIgnore
    @OneToMany(mappedBy = "createur")
    private List<Evenement> evenementsCrees;
    @JsonIgnore
    @OneToMany(mappedBy = "utilisateur")
    private List<Invitation> invitations;
    
    @JsonIgnore
    @OneToMany(mappedBy = "utilisateur", cascade = CascadeType.ALL)
    private List<Retard> retards = new ArrayList<>();
    
    @JsonIgnore
    @OneToMany(mappedBy = "utilisateur", cascade = CascadeType.ALL)
    private List<AlerteRetard> alertesRetards = new ArrayList<>();
    
    @JsonIgnore
    @OneToMany(mappedBy = "destinataire")
    private List<Notification> notificationsRecues = new ArrayList<>();
    
    @OneToMany(mappedBy = "utilisateur", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<FichePaie> fichesPaie = new ArrayList<>();

    @OneToMany(mappedBy = "utilisateur", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<FichePrime> fichesPrime = new ArrayList<>();

    public Utilisateur(String username, String password) {
        super();
        this.nomDeUtilisateur = username;
        this.motDePasse = password;

    }
    public Utilisateur() {
        super();
    }




}


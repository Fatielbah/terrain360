package Pfe.T360.entity;



import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDate;
import java.time.LocalTime;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.JoinColumn;


@Getter
@Setter
@Entity
public class Evenement {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String description;
    private LocalDate date;
    private LocalTime heureDebut;
    private LocalTime heureFin;

    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "createur_id")
    private Utilisateur createur;

    @JsonIgnore
    @OneToOne(mappedBy = "evenement", cascade = CascadeType.ALL)
    private Rappel rappel;

    @JsonIgnore
    @OneToMany(mappedBy = "evenement", cascade = CascadeType.ALL)
    private List<Invitation> invitations;
}

package Pfe.T360.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.EnumType;
import jakarta.persistence.ManyToMany;
import java.util.List;
@Setter
@Getter
@Entity
public class Invitation {

	@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dateEnvoi;

    @Enumerated(EnumType.STRING)
    private StatutInvitation statut;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "evenement_id")
    private Evenement evenement;
    
    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
    @JsonIgnore
    @ManyToMany
    @JoinTable(
        name = "invitation_service",
        joinColumns = @JoinColumn(name = "invitation_id"),
        inverseJoinColumns = @JoinColumn(name = "service_id")
    )
    private List<Services> services;


    
    
    public enum StatutInvitation {
        EN_ATTENTE,
        ACCEPTEE,
        REFUSEE
    }

}


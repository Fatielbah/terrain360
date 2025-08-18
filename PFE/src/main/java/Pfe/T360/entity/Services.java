package Pfe.T360.entity;


import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.Setter;


@Setter
@Getter
@Entity
public class Services {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;

    @OneToMany(mappedBy = "service")
    private List<Utilisateur> utilisateurs;
    
    @ManyToMany(mappedBy = "services")
    private List<Invitation> invitations;
}

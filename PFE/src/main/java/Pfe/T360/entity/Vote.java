package Pfe.T360.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "vote", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"utilisateur_id", "sondage_id"})
})
@Data
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    
    @ManyToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    
    @ManyToOne
    @JoinColumn(name = "sondage_id", nullable = false)
    private Sondage sondage;

    
    @ManyToOne
    @JoinColumn(name = "option_id", nullable = false)
    private Option option;

    
}

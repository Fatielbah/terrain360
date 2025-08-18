package Pfe.T360.entity;


import java.time.Duration;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
@Entity
@Getter
@Setter
public class Rappel {

	@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Duration delaiAvant;
    private boolean envoye;

    @OneToOne
    @JoinColumn(name = "evenement_id")
    private Evenement evenement;
    
   
}

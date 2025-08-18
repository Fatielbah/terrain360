package Pfe.T360.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Data
@Entity
public class Competence {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom; // Ex: "Maîtrise de Excel"

    @ManyToOne
    @JoinColumn(name = "fiche_id")
    private FicheDePoste fiche;

	public Competence(String nom, FicheDePoste fiche) {
		super();
		this.nom = nom;
		this.fiche = fiche;
	}

	public Competence() {
	}
    
    
}
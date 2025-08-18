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
public class Mission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String description;

    @ManyToOne
    @JoinColumn(name = "fiche_id")
    private FicheDePoste fiche;

	public Mission(Long id, String description, FicheDePoste fiche) {
		super();
		this.id = id;
		this.description = description;
		this.fiche = fiche;
	}

	public Mission() {
	}
    
}
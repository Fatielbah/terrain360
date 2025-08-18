package Pfe.T360.entity;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "demandes")
public abstract class Demande {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "date_demande")
	private LocalDate dateDemande;

	@Enumerated(EnumType.STRING)
	private StatutDemande statut;

	private String commentaire;
	
	@OneToOne(cascade = CascadeType.ALL)
	@JoinColumn(name = "file_id", referencedColumnName = "id")
	private File justification;

	@Column(name = "date_debut")
	private LocalDate dateDebut;

	@Column(name = "date_fin")
	private LocalDate dateFin;

	@Column(name = "commentaire_validation")
	private String commentaireValidation;
	
	
	@ManyToOne
	@JoinColumn(name = "utilisateur_id")
	private Utilisateur utilisateur;



	public enum StatutDemande {
		EN_ATTENTE,       // Demande créée, en attente de traitement RH
	    VALIDEE_RH,       // Validée par le RH (pour les congés courts)
	    TRANSMISE_DIRECTION, // Transmise à la direction pour validation finale
	    VALIDEE_DIRECTION, // Validée par la direction
	    REFUSEE_RH,       // Refusée par le RH
	    REFUSEE_DIRECTION, // Refusée par la direction
	    ANNULEE           // Annulée par l'employé
	}
}
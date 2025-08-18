package Pfe.T360.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrimaryKeyJoinColumn;

import java.util.Date;

import jakarta.persistence.Column;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "demandes_absence")
@PrimaryKeyJoinColumn(name = "id")
public class DemandeAbsence extends Demande {
	@Column(name = "type", length = 10)
	@Enumerated(EnumType.STRING)
	private TypeAbsence type;

	@Column(name = "est_urgente")
	private boolean estUrgente;
	
    @Column(name = "heure_debut")
    @Temporal(TemporalType.TIME)  // Pour stocker uniquement l'heure
    private Date heureDebut;
    
    @Column(name = "heure_fin")
    @Temporal(TemporalType.TIME)
    private Date heureFin;

	public enum TypeAbsence {
		HEURE,
		DEMI_JOURNEE,
		JOURNEE
	}
	public enum Priorite {
		NORMALE,
		HAUTE
	}
}
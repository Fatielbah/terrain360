package Pfe.T360.entity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "demandes_document")
public class DemandeDocument extends Demande {
 @Enumerated(EnumType.STRING)
 private TypeDocument type;
 private String autretype;
 
 public enum TypeDocument {
	    ATTESTATION_TRAVAIL,
	    ATTESTATION_SALAIRE,
	    AUTRE
	}
}
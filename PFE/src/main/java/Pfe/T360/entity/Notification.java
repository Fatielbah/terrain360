package Pfe.T360.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // L'utilisateur qui a généré la notification (ex : organisateur)
    @ManyToOne
    @JoinColumn(name = "expediteur_id", nullable = true)
    private Utilisateur expediteur;

    // Le destinataire de la notification
    @ManyToOne
    @JoinColumn(name = "destinataire_id", nullable = false)
    private Utilisateur destinataire;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    private TypeNotification type;

    private Long evenementId;

    private Long ticketId;
    private Long invitationId;
    private Long candidatureId;
    private Long alertId;
    private Long materiel;
    private Long postId;
    private Long demandeId;
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;
    

    @Column(name = "lue", nullable = false)
    private boolean lue = false;
    
    

    // Enumération des types de notification
    public enum TypeNotification {
        RAPPEL,
        INVITATION_EVENEMENT,
        DECLARER_EN_PANNE,
        RESOUDRE_TICKET,
        MODIFICATION_EVENEMENT,    
        SUPPRESSION_EVENEMENT,     
        DEPLACEMENT_EVENEMENT,
        NOUVELLE_CANDIDATURE,
        ALERTE_RETARD,
        AFFECTATION,
        AFFECTATION_TERMINEE,
        NOUVEAU_POST,
        NOUVEAU_SONDAGE, 
        NOUVEAU_LIKE,              
        NOUVEAU_COMMENTAIRE,       
        NOUVELLE_VUE,
        NOUVELLE_DEMANDE,
        STATUT_DEMANDE,
        NOUVELLE_COMPTE,
        ALERT_FIN_GARANTIE
    }

    public Notification() {}
}

package Pfe.T360.service;

import java.util.List;

import Pfe.T360.entity.Notification;
import Pfe.T360.entity.Ticket;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.dto.NotificationDTO;
import Pfe.T360.entity.AlerteRetard;
import Pfe.T360.entity.Candidature;
import Pfe.T360.entity.Evenement;



public interface NotificationService {
	public void creerNotificationEvenement(Evenement evenement, List<Utilisateur> invites,Utilisateur auteur);
    
    void envoyerNotificationWebSocket(Long utilisateurId, Notification notification);
   
   public List<Notification> getNotificationsUtilisateur(Long utilisateurId);
   public void marquerCommeLue(Long notificationId);
   public void supprimerNotification(Long notificationId);
   public void supprimerToutesNotificationsUtilisateur(Long utilisateurId);
   public void envoyerNotificationTousTechniciens(
	        String titre,
	        String message,
	        Notification.TypeNotification type,
	        Long ticketId,
	        Long expediteurId
	    );
   public void envoyerNotificationTousTechniciensSaufDeclarant(
	        String titre,
	        String message,
	        Notification.TypeNotification type,
	        Long ticketId,
	        Long declarantId
	);
   public Notification envoyerNotification(
		    String titre,
		    String message,
		    Notification.TypeNotification type,
		    Long entityId,           // peut être événementId, ticketId, ou null selon contexte
		    Utilisateur destinataire,
		    Utilisateur expediteur
		);
   public Notification saveNotification(Notification notification);
   Notification createNotification(NotificationDTO dto);
   void creerNotificationCandidature(Candidature candidature) ;
   
}

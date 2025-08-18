package Pfe.T360.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import Pfe.T360.dto.NotificationDTO;
import Pfe.T360.entity.AlerteRetard;
import Pfe.T360.entity.Candidature;
import Pfe.T360.entity.Evenement;
import Pfe.T360.entity.Materiel;
import Pfe.T360.entity.Notification;
import Pfe.T360.entity.Role;
import Pfe.T360.entity.Ticket;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.exception.ResourceNotFoundException;
import Pfe.T360.repository.FicheDePosteRepository;
import Pfe.T360.repository.MaterielRepository;
import Pfe.T360.repository.NotificationRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.MaterielService;
import Pfe.T360.service.NotificationService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl  implements NotificationService{

	@Autowired
	private NotificationRepository notificationRepository;
	@Autowired
	private UtilisateurRepository utilisateurRepository;
	@Autowired
	private FicheDePosteRepository ficheDePosteRepository;
	

	@Autowired
	private SimpMessagingTemplate messagingTemplate;
	@Override
	public Notification saveNotification(Notification notification) {
        return notificationRepository.save(notification);
    }
	@Override
	public Notification createNotification(NotificationDTO dto) {
	    // Vérifier destinataireId (doit exister)
	    if (dto.getDestinataireId() == null) {
	        throw new IllegalArgumentException("Le destinataireId ne peut pas être null");
	    }

	    Utilisateur destinataire = utilisateurRepository.findById(dto.getDestinataireId())
	            .orElseThrow(() -> new ResourceNotFoundException("Destinataire non trouvé"));

	    // Expéditeur optionnel
	    Utilisateur expediteur = null;
	    if (dto.getExpediteurId() != null) {
	        expediteur = utilisateurRepository.findById(dto.getExpediteurId())
	                .orElseThrow(() -> new ResourceNotFoundException("Expéditeur non trouvé"));
	    }

	    Notification notification = new Notification();
	    notification.setTitre(dto.getTitre());
	    notification.setMessage(dto.getMessage());
	    notification.setType(Notification.TypeNotification.valueOf(dto.getType()));
	    notification.setLue(dto.isLue());
	    notification.setInvitationId(dto.getInvitationId());
	    notification.setEvenementId(dto.getEvenementId());
	    notification.setTicketId(dto.getTicketId());
	    notification.setDateCreation(dto.getDateCreation());
	    notification.setDestinataire(destinataire);
	    notification.setExpediteur(expediteur); // peut rester null

	    Notification savedNotification = notificationRepository.save(notification);
	    sendWebSocketNotification(savedNotification);

	    return savedNotification;
	}


    private void sendWebSocketNotification(Notification notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                notification.getDestinataire().getNomDeUtilisateur(),
                "/queue/notifications",
                NotificationDTO.fromEntity(notification)
            );
        } catch (Exception e) {
        	e.printStackTrace();
        }
    }
	@Override
	public Notification envoyerNotification(
		    String titre,
		    String message,
		    Notification.TypeNotification type,
		    Long entityId,
		    Utilisateur destinataire,
		    Utilisateur expediteur
		) {
		    
		    Notification notification = new Notification();
		    notification.setDestinataire(destinataire);
		    notification.setExpediteur(expediteur);
		    notification.setTitre(titre);
		    notification.setMessage(message);
		    notification.setType(type);

		    if (type == Notification.TypeNotification.INVITATION_EVENEMENT || type == Notification.TypeNotification.RAPPEL) {
		        notification.setEvenementId(entityId);
		    } else if (type == Notification.TypeNotification.DECLARER_EN_PANNE || type == Notification.TypeNotification.RESOUDRE_TICKET) {
		        notification.setTicketId(entityId);
		    }else if (type == Notification.TypeNotification.NOUVELLE_CANDIDATURE ) {
		        notification.setCandidatureId(entityId);
		    }else if (type == Notification.TypeNotification.ALERTE_RETARD ) {
		    	notification.setAlertId(entityId);;
		    }else if (type == Notification.TypeNotification.NOUVEAU_POST) {
		        notification.setPostId(entityId);
		    }
		    else if (type == Notification.TypeNotification.NOUVELLE_DEMANDE) {
		        notification.setDemandeId(entityId);
		    }
		    else if (type == Notification.TypeNotification.ALERT_FIN_GARANTIE) {
		        notification.setMateriel(entityId);
		    }


		    
		    notification.setDateCreation(LocalDateTime.now());
		    notification.setLue(false);

		    Notification savedNotification = notificationRepository.save(notification);

		    // Envoi WebSocket avec logs détaillés
		    try {
		        String username = destinataire.getNomDeUtilisateur();
		        
		        messagingTemplate.convertAndSendToUser(
		            username,
		            "/queue/notifications",
		            savedNotification
		        );
		        
		    } catch (Exception e) {
		        System.err.println("❌ Erreur envoi notification WebSocket à " + destinataire.getNomDeUtilisateur());
		        e.printStackTrace();
		    }

		    return savedNotification;
		}

	
	public void creerNotificationEvenement(Evenement evenement, List<Utilisateur> invites, Utilisateur auteur) {
	    String titre = "Nouvelle invitation à un événement";
	    String messageTemplate = "Vous êtes invité(e) à l'événement '%s' prévu le %s";

	    for (Utilisateur invite : invites) {
	        try {
	            String message = String.format(messageTemplate, evenement.getTitre(), evenement.getDate());
	            
	            // Appel à la fonction générique
	            envoyerNotification(
	                titre,
	                message,
	                Notification.TypeNotification.INVITATION_EVENEMENT,
	                evenement.getId(),  // entityId = id de l'événement
	                invite,            // destinataire
	                auteur             // expéditeur (organisateur)
	            );
	        } catch (Exception e) {
	            System.err.println("Erreur notification pour utilisateur " + invite.getId());
	            e.printStackTrace();
	        }
	    }
	}
	@Override
	public void creerNotificationCandidature(Candidature candidature) {
		if (candidature.getFicheDePoste() == null) {
            throw new IllegalStateException("Impossible de notifier: la candidature n'a pas de fiche de poste associée");
        }

	    String titre = "Nouvelle Candidature";
	    String messageTemplate = "Une nouvelle candidature a été soumise par %s pour le poste '%s' le %s";
	    
	    try {
	    	String titreFiche = ficheDePosteRepository.findTitreById(candidature.getFicheDePoste().getId());
	        LocalDateTime date = candidature.getDateSoumission();
	        String nomCandidat = candidature.getNomComplet(); // Supposons que Candidat a une méthode getNomComplet()
	        String message = String.format(messageTemplate, nomCandidat, titreFiche, date);
	        List<Utilisateur> rhList= utilisateurRepository.findByRole(Role.RH);
	        System.out.println(titreFiche);
	        // Notifier chaque RH
	        for (Utilisateur rh : rhList) {
	            envoyerNotification(
	                titre,
	                message,
	                Notification.TypeNotification.NOUVELLE_CANDIDATURE,
	                candidature.getId(),
	                rh,
	                null // Pas d'expéditeur utilisateur, ou vous pourriez créer un utilisateur système
	            );
	        }
	    } catch (Exception e) {
	        System.err.println("Erreur lors de la création des notifications");
	        e.printStackTrace();
	    }
	}

	@Override
	public void envoyerNotificationTousTechniciens(
	        String titre,
	        String message,
	        Notification.TypeNotification type,
	        Long ticketId,
	        Long expediteurId
	) {
	    Utilisateur expediteur = utilisateurRepository.findById(expediteurId)
	            .orElseThrow(() -> new RuntimeException("Expéditeur non trouvé"));

	    List<Utilisateur> techniciens = utilisateurRepository.findByRole(Role.INFORMATICIEN);

	    for (Utilisateur technicien : techniciens) {
	        try {
	            envoyerNotification(
	                titre,
	                message,
	                type,
	                ticketId,
	                technicien,
	                expediteur
	            );
	        } catch (Exception e) {
	            System.err.println("Erreur lors de la notification du technicien ID " + technicien.getId());
	            e.printStackTrace();
	        }
	    }
	}
	@Override
	public void envoyerNotificationTousTechniciensSaufDeclarant(
	        String titre,
	        String message,
	        Notification.TypeNotification type,
	        Long ticketId,
	        Long declarantId
	) {
	    Utilisateur declarant = utilisateurRepository.findById(declarantId)
	            .orElseThrow(() -> new RuntimeException("Déclarant non trouvé"));

	    List<Utilisateur> techniciens = utilisateurRepository.findByRole(Role.INFORMATICIEN)
	            .stream()
	            .filter(tech -> !tech.getId().equals(declarantId))
	            .collect(Collectors.toList());

	    for (Utilisateur technicien : techniciens) {
	        envoyerNotification(
	            titre,
	            message,
	            type,
	            ticketId,
	            technicien,
	            declarant
	        );
	    }
	}


	

	@Override
	public void supprimerNotification(Long notificationId) {
		System.out.println("Suppression de la notification ID: " + notificationId);
		notificationRepository.deleteById(notificationId);
	}

	@Override
	public void supprimerToutesNotificationsUtilisateur(Long utilisateurId) {
		System.out.println("Suppression de toutes les notifications pour l'utilisateur ID: " + utilisateurId);
		List<Notification> notifications = notificationRepository.findByDestinataireIdAndLueFalseOrderByDateCreationDesc(utilisateurId);
		notificationRepository.deleteAll(notifications);
	}

	public List<Notification> getNotificationsUtilisateur(Long utilisateurId) {
		return notificationRepository.findByDestinataireIdAndLueFalseOrderByDateCreationDesc(utilisateurId);
	}

	public void marquerCommeLue(Long notificationId) {
		Notification notification = notificationRepository.findById(notificationId)
				.orElseThrow(() -> new RuntimeException("Notification non trouvée"));
		notification.setLue(true);
		notificationRepository.save(notification);
	}

	@Override
	public void envoyerNotificationWebSocket(Long utilisateurId, Notification notification) {
		// TODO Auto-generated method stub

	}
	
}

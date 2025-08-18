package Pfe.T360.service.impl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

import Pfe.T360.repository.DemandeRepository;
import Pfe.T360.repository.FileRepository;
import Pfe.T360.repository.DemandeCongeRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.repository.AbsenceRepository;
import Pfe.T360.repository.CongeRepository;
import Pfe.T360.repository.DemandeAbsenceRepository;
import Pfe.T360.repository.DemandeDocumentRepository;

import Pfe.T360.service.DemandeService;
import Pfe.T360.service.NotificationService;
import Pfe.T360.util.FileUtils;
import Pfe.T360.entity.Absence;
import Pfe.T360.entity.Candidature;
import Pfe.T360.entity.Conge;
import Pfe.T360.entity.Demande;
import Pfe.T360.entity.DemandeConge;
import Pfe.T360.entity.DemandeAbsence;
import Pfe.T360.entity.DemandeAbsence.TypeAbsence;
import Pfe.T360.entity.DemandeDocument;
import Pfe.T360.entity.File;
import Pfe.T360.entity.Notification;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.exception.GestionCongeException;
import Pfe.T360.entity.Role;
import Pfe.T360.entity.Demande.StatutDemande;

import java.io.IOException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
@Service
@Transactional
@RequiredArgsConstructor
public class DemandeServiceImpl implements DemandeService {

	private final DemandeRepository demandeRepository;
	private final DemandeCongeRepository demandeCongeRepository;
	private final DemandeAbsenceRepository demandeAbsenceRepository;
	private final DemandeDocumentRepository demandeDocumentRepository;
	private final UtilisateurRepository utilisateurRepository;
	private final NotificationService notificationService;
	private final CongeRepository congeRepository;
	private final AbsenceRepository absenceRepository;

	private final FileRepository fileRepository;


	private float calculerSoldeCongeAnnuel(Utilisateur user) {
		long moisComplets = ChronoUnit.MONTHS.between(
				user.getDateEmbauche().withDayOfMonth(1), 
				LocalDate.now().withDayOfMonth(1)
				);
		return (moisComplets * 1.5f) - user.getJoursCongesConsommes();
	}

	@Override
	public DemandeConge createDemandeConge(DemandeConge demande, Long userId,MultipartFile justificationFile) {
		Utilisateur user = utilisateurRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("User not found"));
		demande.setUtilisateur(user);
		demande.setDateDemande(LocalDate.now());
		demande.setStatut(StatutDemande.EN_ATTENTE);

		long joursDemandes = ChronoUnit.DAYS.between(demande.getDateDebut(), demande.getDateFin()) + 1;



		switch (demande.getType()) {
		case CONGE_ANNUEL:
			float soldeRestant = calculerSoldeCongeAnnuel(user);
			if (joursDemandes > soldeRestant) {
				throw new GestionCongeException(
						"SOLDE_INSUFFISANT",
						String.format("Solde insuffisant. Vous avez %.1f jours restants mais avez demandé %d jours.", soldeRestant, joursDemandes)
						);
			}
			break;

		case CONGE_EXCEPTIONNEL:
			if (joursDemandes > 4) {
				throw new GestionCongeException(
						"DUREE_EXCEEDED",
						"Le congé exceptionnel est limité à 4 jours maximum."
						);
			}
			break;

		case CONGE_MALADIE:
			if (justificationFile == null || justificationFile.isEmpty()) {
				throw new GestionCongeException(
						"JUSTIFICATIF_MANQUANT",
						"Un certificat médical est requis pour un congé maladie."
						);
			}
			break;

		case CONGE_MATERNITE_PATERNITE:
			if ("FEMME".equalsIgnoreCase(user.getGenre()) && joursDemandes != 98) {
				throw new GestionCongeException(
						"DUREE_INCORRECTE",
						"Le congé maternité doit obligatoirement durer 98 jours."
						);
			}
			if ("HOMME".equalsIgnoreCase(user.getGenre()) && joursDemandes != 3) {
				throw new GestionCongeException(
						"DUREE_INCORRECTE",
						"Le congé paternité doit obligatoirement durer 3 jours."
						);
			}
			break;
		}


		DemandeConge saved = demandeCongeRepository.save(demande);
		// notificationService.notifyRHNewDemande(saved)
		   try {
		        if (notificationService != null) {
		            List<Utilisateur> rhs = utilisateurRepository.findByRole(Role.RH)
		                    .stream()
		                    .filter(rh -> !rh.getId().equals(userId))
		                    .collect(Collectors.toList());
		            
		            for (Utilisateur rh : rhs) {
		                notificationService.envoyerNotification(
		                        "Nouvelle demande de congé",
		                        String.format("L'utilisateur %s %s a soumis une nouvelle demande de congé (type: %s)", 
		                                user.getNom(), user.getPrenom(), demande.getType()),
		                        Notification.TypeNotification.NOUVELLE_DEMANDE,
		                        saved.getId(),
		                        rh,
		                        user);
		            }
		        }
		    } catch (Exception e) {
		        e.getMessage();
		    }
		if(justificationFile != null && !justificationFile.isEmpty()) {
	        uploadFile(saved.getId(), justificationFile);
	    }
		return saved;
	}

	
	@Override
	public DemandeAbsence createDemandeAbsence(DemandeAbsence demande, Long userId, MultipartFile justificationFile) {
	    Utilisateur user = utilisateurRepository.findById(userId)
	            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
	    
	    // Validation des heures si type=HEURE
	    if(demande.getType() == TypeAbsence.HEURE) {
	        if(demande.getHeureDebut() == null || demande.getHeureFin() == null) {
	            throw new IllegalArgumentException("Les heures sont obligatoires pour ce type d'absence");
	        }
	        
	        if(demande.getHeureDebut().after(demande.getHeureFin())) {
	            throw new IllegalArgumentException("L'heure de fin doit être après l'heure de début");
	        }
	    }
	    
	    demande.setUtilisateur(user);
	    demande.setDateDemande(LocalDate.now());
	    demande.setStatut(StatutDemande.EN_ATTENTE);
	    
	    // Sauvegardez d'abord la demande sans le fichier
	    DemandeAbsence savedDemande = demandeAbsenceRepository.save(demande);
	    try {
	        if (notificationService != null) {
	            List<Utilisateur> rhs = utilisateurRepository.findByRole(Role.RH)
	                    .stream()
	                    .filter(rh -> !rh.getId().equals(userId))
	                    .collect(Collectors.toList());
	            
	            for (Utilisateur rh : rhs) {
	                notificationService.envoyerNotification(
	                        "Nouvelle demande d'absence",
	                        String.format("L'utilisateur %s %s a soumis une nouvelle demande d'absence", 
	                                user.getNom(), user.getPrenom()),
	                        Notification.TypeNotification.NOUVELLE_DEMANDE,
	                        savedDemande.getId(),
	                        rh,
	                        user);
	            }
	        }
	    } catch (Exception e) {
	        e.getMessage();
	    }
	    // Ensuite uploader le fichier si présent
	    if(justificationFile != null && !justificationFile.isEmpty()) {
	        uploadFile(savedDemande.getId(), justificationFile);
	    }
	    
	    return savedDemande;
	}

	@Override
	public DemandeDocument createDemandeDocument(DemandeDocument demande, Long userId) {
		Utilisateur user = utilisateurRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("User not found"));

		demande.setUtilisateur(user);
		demande.setDateDemande(LocalDate.now());
		demande.setStatut(StatutDemande.EN_ATTENTE);
		DemandeDocument savedDemande=demandeDocumentRepository.save(demande);
		try {
	        if (notificationService != null) {
	            List<Utilisateur> rhs = utilisateurRepository.findByRole(Role.RH)
	                    .stream()
	                    .filter(rh -> !rh.getId().equals(userId))
	                    .collect(Collectors.toList());
	            
	            for (Utilisateur rh : rhs) {
	                notificationService.envoyerNotification(
	                        "Nouvelle demande de document",
	                        String.format("L'utilisateur %s %s a soumis une nouvelle demande de documente", 
	                                user.getNom(), user.getPrenom()),
	                        Notification.TypeNotification.NOUVELLE_DEMANDE,
	                        savedDemande.getId(),
	                        rh,
	                        user);
	            }
	        }
	    } catch (Exception e) {
	        e.getMessage();
	    }
		return savedDemande;
	}


	@Override
	public void traiterDemandeRH(Long demandeId, Long validateurId, String commentaire, ActionRH action) {
	    Demande demande = demandeRepository.findById(demandeId)
	            .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

	    Utilisateur validateur = utilisateurRepository.findById(validateurId)
	            .orElseThrow(() -> new RuntimeException("Validateur non trouvé"));
	    Utilisateur demandeur = demande.getUtilisateur();

	    // Vérification que le validateur est bien RH
	    if (validateur.getRole() != Role.RH) {
	        throw new RuntimeException("Seul le RH peut effectuer cette action");
	    }

	    // Vérification que la demande est en attente
	    if (demande.getStatut() != StatutDemande.EN_ATTENTE) {
	        throw new RuntimeException("La demande n'est pas en attente de traitement RH");
	    }

	    String message = "";
	    StatutDemande nouveauStatut = null;

	    switch (action) {
	        case VALIDER:
	            nouveauStatut = StatutDemande.VALIDEE_RH;
	            message = "Votre demande a été validée par les RH";
	            if (demande instanceof DemandeConge) {
	                enregistrerConge((DemandeConge) demande);
	            }
	            break;
	            
	        case TRANSMETTRE:
	            nouveauStatut = StatutDemande.TRANSMISE_DIRECTION;
	            message = "Votre demande a été transmise à la direction";
	            break;
	            
	        case REFUSER:
	            nouveauStatut = StatutDemande.REFUSEE_RH;
	            message = "Votre demande a été refusée par les RH";
	            break;
	            
	        default:
	            throw new RuntimeException("Action non reconnue");
	    }

	    demande.setStatut(nouveauStatut);
	    demande.setCommentaireValidation(commentaire);
	    demandeRepository.save(demande);

	    // Envoi de notification
	    try {
	        if (notificationService != null) {
	            notificationService.envoyerNotification(
	                    "Mise à jour de votre demande",
	                    message + (commentaire != null ? "\nCommentaire: " + commentaire : ""),
	                    Notification.TypeNotification.STATUT_DEMANDE,
	                    demande.getId(),
	                    demandeur,
	                    validateur);
	            
	            // Si transmise à la direction, notifier les administrateurs
	            if (action == ActionRH.TRANSMETTRE || action == ActionRH.VALIDER ) {
	                List<Utilisateur> admins = utilisateurRepository.findByRole(Role.ADMIN);
	                for (Utilisateur admin : admins) {
	                    notificationService.envoyerNotification(
	                            "Nouvelle demande à valider",
	                            "Une nouvelle demande nécessite votre validation",
	                            Notification.TypeNotification.NOUVELLE_DEMANDE,
	                            demande.getId(),
	                            admin,
	                            validateur);
	                }
	            }
	        }
	    } catch (Exception e) {
	        e.getMessage();
	    }
	}

	@Override
	public void traiterDemandeDirection(Long demandeId, Long validateurId, String commentaire, boolean estValidee) {
	    Demande demande = demandeRepository.findById(demandeId)
	            .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

	    Utilisateur validateur = utilisateurRepository.findById(validateurId)
	            .orElseThrow(() -> new RuntimeException("Validateur non trouvé"));
	    Utilisateur demandeur = demande.getUtilisateur();

	    // Vérification que le validateur est bien ADMIN/DIRECTION
	    if (validateur.getRole() != Role.ADMIN) {
	        throw new RuntimeException("Seul la direction peut effectuer cette action");
	    }

	    // Vérification que la demande est transmise
	    if (demande.getStatut() != StatutDemande.TRANSMISE_DIRECTION && demande.getStatut() != StatutDemande.VALIDEE_RH) {
	        throw new RuntimeException("La demande n'est pas en attente de traitement par la direction");
	    }

	    String message = "";
	    StatutDemande nouveauStatut = null;

	    if (estValidee) {
	        nouveauStatut = StatutDemande.VALIDEE_DIRECTION;
	        message = "Votre demande a été validée par la direction";
	        if (demande instanceof DemandeConge) {
	            enregistrerConge((DemandeConge) demande);
	        } else if (demande instanceof DemandeAbsence) {
	            enregistrerAbsence((DemandeAbsence) demande);
	        }
	    } else {
	        nouveauStatut = StatutDemande.REFUSEE_DIRECTION;
	        message = "Votre demande a été refusée par la direction";
	    }

	    demande.setStatut(nouveauStatut);
	    demande.setCommentaireValidation(commentaire);
	    demandeRepository.save(demande);

	    // Envoi de notification
	    try {
	        if (notificationService != null) {
	            notificationService.envoyerNotification(
	                    "Mise à jour de votre demande",
	                    message + (commentaire != null ? "\nCommentaire: " + commentaire : ""),
	                    Notification.TypeNotification.STATUT_DEMANDE,
	                    demande.getId(),
	                    demandeur,
	                    validateur);
	        }
	    } catch (Exception e) {
	        e.getMessage();
	    }
	}


	public enum ActionRH {
	    VALIDER,       // Valider directement (pour les petits congés)
	    TRANSMETTRE,   // Transmettre à la direction
	    REFUSER        // Refuser la demande
	}
	
	
	
	private void enregistrerAbsence(DemandeAbsence demandeAbsence) {
	    Absence absence = new Absence();
	    absence.setUtilisateur(demandeAbsence.getUtilisateur());
	    absence.setType(demandeAbsence.getType());
	    absence.setDateDebut(demandeAbsence.getDateDebut());
	    absence.setDateFin(demandeAbsence.getDateFin());
	    absence.setDateValidation(LocalDate.now());
	    absence.setDemandeOrigine(demandeAbsence);
	    absence.setEstUrgente(demandeAbsence.isEstUrgente());
	    absence.setCommentaire(demandeAbsence.getCommentaire());

	    absenceRepository.save(absence);
	}

	private void enregistrerConge(DemandeConge demandeConge) {
		float jours = ChronoUnit.DAYS.between(
				demandeConge.getDateDebut(), 
				demandeConge.getDateFin()
				) + 1;

		Conge conge = new Conge();
		conge.setUtilisateur(demandeConge.getUtilisateur());
		conge.setType(demandeConge.getType());
		conge.setDateDebut(demandeConge.getDateDebut());
		conge.setDateFin(demandeConge.getDateFin());
		conge.setDateValidation(LocalDate.now());
		conge.setJoursConsommes(jours);
		conge.setDemandeOrigine(demandeConge);

		congeRepository.save(conge);

		// Mise à jour du solde de congés
		Utilisateur user = demandeConge.getUtilisateur();
		user.setJoursCongesConsommes(user.getJoursCongesConsommes() + jours);
		utilisateurRepository.save(user);
	}
	

	@Override
	public List<Demande> getDemandesByUser(Long userId) {
		return demandeRepository.findByUtilisateurId(userId);
	}

	@Override
	public List<Demande> getDemandesByStatus(StatutDemande statut) {
		return demandeRepository.findByStatut(statut);
	}

	@Override
	public Demande getDemandeDetails(Long demandeId) {
		return demandeRepository.findById(demandeId)
				.orElseThrow(() -> new RuntimeException("Demand not found"));
	}
	
	@Override
	public void cancelDemande(Long demandeId, Long userId) {
	    Demande demande = demandeRepository.findById(demandeId)
	            .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
	    
	    // Vérifier que l'utilisateur est bien le propriétaire de la demande
	    if (!demande.getUtilisateur().getId().equals(userId)) {
	        throw new RuntimeException("Seul le créateur de la demande peut l'annuler");
	    }
	    
	    // Vérifier que la demande est encore en attente
	    if (demande.getStatut() != StatutDemande.EN_ATTENTE) {
	        throw new RuntimeException("Seules les demandes en attente peuvent être annulées");
	    }
	    
	    demande.setStatut(StatutDemande.ANNULEE);
	    demandeRepository.save(demande);
	    
	    // notificationService.notifyDemandeStatusChange(demande, demande.getUtilisateur(), "Demande annulée par l'utilisateur");
	}

	@Override
	public void deleteDemande(Long demandeId, Long userId) {
	    Demande demande = demandeRepository.findById(demandeId)
	            .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
	    
	    // Vérifier que l'utilisateur est bien le propriétaire de la demande
	    if (!demande.getUtilisateur().getId().equals(userId)) {
	        throw new RuntimeException("Seul le créateur de la demande peut la supprimer");
	    }
	    
	    // Vérifier que la demande est annulée ou refusée
	    if (demande.getStatut() != StatutDemande.ANNULEE && demande.getStatut() != StatutDemande.REFUSEE_DIRECTION && demande.getStatut() != StatutDemande.REFUSEE_RH) {
	        throw new RuntimeException("Seules les demandes annulées ou refusées peuvent être supprimées");
	    }
	    
	    // Si c'est une demande de congé et qu'elle a été validée, il faut aussi gérer le solde
	    if (demande instanceof DemandeConge && (demande.getStatut() == StatutDemande.VALIDEE_RH || 
	                                           demande.getStatut() == StatutDemande.VALIDEE_DIRECTION)) {
	        throw new RuntimeException("Impossible de supprimer une demande de congé déjà validée");
	    }
	    
	    demandeRepository.delete(demande);
	}
	
	
	
	public void uploadFile(Long demandeId, MultipartFile file) {
	    if (file == null || file.isEmpty()) {
	        return;
	    }

	    Demande demande = demandeRepository.findById(demandeId)
	            .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
	    
	    try {
	        File fileJustif = File.builder()
	                .name(file.getOriginalFilename())
	                .type(file.getContentType())
	                .fileData(FileUtils.compressFile(file.getBytes()))
	                .build();
	        
	        fileJustif = fileRepository.save(fileJustif);
	        demande.setJustification(fileJustif);
	        demandeRepository.save(demande);
	        
	    } catch (IOException e) {
	        throw new RuntimeException("Erreur lors du traitement du fichier", e);
	    }
	}
	 @Override
	    public byte[] downloadJustification(Long demandeId) {
		 Demande demande = demandeRepository.findById(demandeId).orElseThrow(() -> new RuntimeException("Demande non trouvée"));
	        if (demande.getJustification() == null) {
	            throw new RuntimeException("Aucun Justification trouvé pour cette demande");
	        }
	        return FileUtils.decompressFile(demande.getJustification().getFileData());
	    }
}
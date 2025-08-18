package Pfe.T360.service.impl;

import Pfe.T360.dto.NotificationDTO;
import Pfe.T360.entity.AlerteRetard;
import Pfe.T360.entity.Notification;
import Pfe.T360.entity.Retard;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.repository.AlerteRetardRepository;
import Pfe.T360.repository.RetardRepository;
import Pfe.T360.service.NotificationService;
import Pfe.T360.service.RetardService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RetardServiceImpl  implements RetardService{

    private final RetardRepository retardRepository;
    private final AlerteRetardRepository alerteRetardRepository;
    private final NotificationService notificationService;
    @Autowired
    public RetardServiceImpl(RetardRepository retardRepository, AlerteRetardRepository alerteRetardRepository,
    		NotificationService notificationService) {
        this.retardRepository = retardRepository;
        this.alerteRetardRepository = alerteRetardRepository;
        this.notificationService =notificationService;
    }

    @Transactional
    @Override
    public Retard createRetard(Retard retard) {
        retard.setJustifie(false); // Par défaut non justifié
        Retard savedRetard = retardRepository.save(retard);
        
        checkAndCreateAlerte(retard.getUtilisateur(),retard.getSuperviseur());
        
        return savedRetard;
    }

    private void checkAndCreateAlerte(Utilisateur utilisateur,Utilisateur superviseur) {
        LocalDate dateLimite = LocalDate.now().minusDays(7);
        List<Retard> retardsRecents = retardRepository.findByUtilisateurAndDateAfterAndJustifieFalse(
            utilisateur, dateLimite);
        
        if (retardsRecents.size() >= 3) {
            // Vérifier si une alerte existe déjà pour cette période
            boolean alerteExistante = alerteRetardRepository.existsByUtilisateurAndDateGenerationAfter(
                utilisateur, dateLimite);
            
            if (!alerteExistante) {
                AlerteRetard alerte = new AlerteRetard();
                alerte.setUtilisateur(utilisateur);
                alerte.setDateGeneration(LocalDate.now());
                alerte.setNbRetards(retardsRecents.size());
                alerte.setSeuilDepasse(true);
                
                AlerteRetard savedAlerte = alerteRetardRepository.save(alerte);

                // Création et envoi de la notification
                
        	    NotificationDTO dto = NotificationDTO.builder()
        	            .titre("Alerte retard")
        	            .message(String.format("Vous avez %d retards non justifiés dans les 7 derniers jours.", alerte.getNbRetards()))
        	            .type(Notification.TypeNotification.ALERTE_RETARD.name())
        	            .alertId(alerte.getId())
        	            .dateCreation(LocalDateTime.now())
        	            .lue(false)
        	            .destinataireId(utilisateur.getId())
        	            .expediteurId(superviseur.getId())
        	            .build();

        	    notificationService.createNotification(dto);

            }
        }
    }
    
	
    @Transactional
    @Override
    public Retard updateRetardJustification(Long id, boolean justifie, String remarque) {
        Retard retard = retardRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Retard non trouvé"));
        
        retard.setJustifie(justifie);
        retard.setRemarque(remarque);
        
        return retardRepository.save(retard);
    }
    @Override
    public List<Retard> getRetardsByUtilisateur(Utilisateur utilisateur) {
        return retardRepository.findByUtilisateur(utilisateur);
    }
    @Override
    public List<AlerteRetard> getAlertesByUtilisateur(Utilisateur utilisateur) {
        return alerteRetardRepository.findByUtilisateur(utilisateur);
    }
    @Override
    public List<Retard> getAllRetards() {
        return retardRepository.findAll();
    }

    @Override
    public List<AlerteRetard> getAllAlertes() {
        return alerteRetardRepository.findAll();
    }
    @Override
    @Transactional
    public void deleteRetard(Long id) {
        Retard retard = retardRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Retard non trouvé avec l'ID: " + id));
        
        retardRepository.delete(retard);
        
        // Vérifier si une alerte doit être mise à jour après suppression
        checkAndUpdateAlertes(retard.getUtilisateur(),retard.getSuperviseur());
    }

    @Override
    @Transactional
    public Retard updateRetard(Long id, Retard retardDetails) {
        Retard retard = retardRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Retard non trouvé avec l'ID: " + id));

        // Mise à jour des champs modifiables
        retard.setDate(retardDetails.getDate());
        retard.setHeureArrivee(retardDetails.getHeureArrivee());
        retard.setJustifie(retardDetails.isJustifie());
        retard.setRemarque(retardDetails.getRemarque());
        
        // Si le superviseur change
        if(retardDetails.getSuperviseur() != null) {
            retard.setSuperviseur(retardDetails.getSuperviseur());
        }

        Retard updatedRetard = retardRepository.save(retard);
        
        // Vérifier les alertes après modification
        checkAndUpdateAlertes(retard.getUtilisateur(),retard.getSuperviseur());
        
        return updatedRetard;
    }

    private void checkAndUpdateAlertes(Utilisateur utilisateur,Utilisateur superviseur) {
        LocalDate dateLimite = LocalDate.now().minusDays(7);
        List<Retard> retardsRecents = retardRepository.findByUtilisateurAndDateAfterAndJustifieFalse(
            utilisateur, dateLimite);
        
        // Trouver l'alerte existante
        List<AlerteRetard> alertes = alerteRetardRepository.findByUtilisateurAndDateGenerationAfter(
            utilisateur, dateLimite);
        
        if(retardsRecents.size() >= 3) {
            if(alertes.isEmpty()) {
                // Créer une nouvelle alerte
                AlerteRetard alerte = new AlerteRetard();
                alerte.setUtilisateur(utilisateur);
                alerte.setDateGeneration(LocalDate.now());
                alerte.setNbRetards(retardsRecents.size());
                alerte.setSeuilDepasse(true);
                alerteRetardRepository.save(alerte);
                //notificationService.createNotificationForAlerte(utilisateur, alerte,superviseur);
            } else {
                // Mettre à jour l'alerte existante
                AlerteRetard alerte = alertes.get(0);
                alerte.setNbRetards(retardsRecents.size());
                alerteRetardRepository.save(alerte);
            }
        } else if(!alertes.isEmpty()) {
            // Supprimer l'alerte si le nombre de retards est inférieur à 3
            alerteRetardRepository.deleteAll(alertes);
        }
    }
}
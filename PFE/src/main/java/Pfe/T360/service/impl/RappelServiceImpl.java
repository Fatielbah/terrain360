package Pfe.T360.service.impl;

import Pfe.T360.dto.NotificationDTO;
import Pfe.T360.entity.Evenement;
import Pfe.T360.entity.Notification.TypeNotification;
import Pfe.T360.entity.Invitation;
import Pfe.T360.entity.Rappel;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.repository.EvenementRepository;
import Pfe.T360.repository.RappelRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.RappelService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RappelServiceImpl implements RappelService {

    private final RappelRepository rappelRepository;
    private final EvenementRepository evenementRepository;
    private final UtilisateurRepository utilisateurRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private NotificationServiceImpl notificationService;

    public RappelServiceImpl(RappelRepository rappelRepository, EvenementRepository evenementRepository,UtilisateurRepository utilisateurRepository) {
        this.rappelRepository = rappelRepository;
        this.evenementRepository = evenementRepository;
        this.utilisateurRepository =utilisateurRepository;
    }

    @Override
    public Rappel createRappel(Long evenementId, Rappel rappel) {
        Evenement evenement = evenementRepository.findById(evenementId)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé"));

        rappel.setEvenement(evenement);
        rappel.setEnvoye(false);
        return rappelRepository.save(rappel);
    }

    @Override
    public Optional<Rappel> getRappelByEvenementId(Long evenementId) {
        return rappelRepository.findByEvenementId(evenementId);
    }
    

    @Scheduled(fixedRate = 60000)
    public void verifierRappels() {
        List<Evenement> evenements = evenementRepository.findAllWithRappelNonEnvoye();
        
        for (Evenement evenement : evenements) {
            Rappel rappel = evenement.getRappel();
            if (rappel != null && !rappel.isEnvoye()) {
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime dateEvenement = LocalDateTime.of(evenement.getDate(), evenement.getHeureDebut());
                Duration delaiRestant = Duration.between(now, dateEvenement);
                
                if (delaiRestant.minus(rappel.getDelaiAvant()).toMinutes() <= 0) {
                    envoyerRappel(evenement);
                    rappel.setEnvoye(true);
                    evenementRepository.save(evenement);
                }
            }
        }
    }
    
    private void envoyerRappel(Evenement evenement) {
        String titre = "Rappel: " + evenement.getTitre();
        String message = "L'événement '" + evenement.getTitre() + "' commence bientôt (" + 
                         evenement.getDate() + " à " + evenement.getHeureDebut() + ")";
        
        // Envoyer à l'organisateur
        notificationService.envoyerNotification(
            titre,
            message,
            TypeNotification.RAPPEL,
            evenement.getId(),
            evenement.getCreateur(),
            evenement.getCreateur()
        );
        
        // Envoyer aux participants
        for (Invitation invitation : evenement.getInvitations()) {
                notificationService.envoyerNotification(
                    titre,
                    message,
                    TypeNotification.RAPPEL,
                    evenement.getId(),
                    invitation.getUtilisateur(),
                    evenement.getCreateur()
                );
            
        }
    }


    @Override
    @Transactional
    public boolean envoyerRappel(Long evenementId) {
        Optional<Rappel> rappelOpt = rappelRepository.findByEvenementId(evenementId);

        if (rappelOpt.isEmpty()) return false;

        Rappel rappel = rappelOpt.get();
        Evenement evenement = rappel.getEvenement();

        LocalDateTime dateHeureEvenement = evenement.getDate().atTime(evenement.getHeureDebut());
        LocalDateTime dateHeureRappel = dateHeureEvenement.minus(rappel.getDelaiAvant());

        if (!rappel.isEnvoye() && LocalDateTime.now().isAfter(dateHeureRappel)) {
            // Ici on simule l’envoi de rappel (email, notification, etc.)
            System.out.println("📧 Rappel envoyé pour l'événement : " + evenement.getTitre());

            rappel.setEnvoye(true);
            rappelRepository.save(rappel);
            return true;
        }

        return false;
    }
    @Override
    public Rappel updateRappel(Long rappelId, Rappel updatedRappel) {
        Rappel existing = rappelRepository.findById(rappelId)
                .orElseThrow(() -> new RuntimeException("Rappel non trouvé"));

        existing.setDelaiAvant(updatedRappel.getDelaiAvant());
        existing.setEnvoye(updatedRappel.isEnvoye());

        return rappelRepository.save(existing);
    }

}

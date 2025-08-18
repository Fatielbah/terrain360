package Pfe.T360.service.impl;

import Pfe.T360.entity.Evenement;
import Pfe.T360.entity.Invitation;
import Pfe.T360.entity.Services;
import Pfe.T360.entity.Invitation.StatutInvitation;
import Pfe.T360.entity.Notification;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.repository.EvenementRepository;
import Pfe.T360.repository.InvitationRepository;
import Pfe.T360.repository.ServiceRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.InvitationService;
import Pfe.T360.service.NotificationService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class InvitationServiceImpl implements InvitationService {

    private final InvitationRepository invitationRepository;
    private final EvenementRepository evenementRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ServiceRepository serviceRepository;
    private final NotificationService notificationService;

    public InvitationServiceImpl(
        InvitationRepository invitationRepository,
        EvenementRepository evenementRepository,
        UtilisateurRepository utilisateurRepository,
        ServiceRepository serviceRepository,
        NotificationService notificationService
    ) {
        this.invitationRepository = invitationRepository;
        this.evenementRepository = evenementRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.serviceRepository = serviceRepository;
        this.notificationService =notificationService;
    }

    @Override
    public Invitation envoyerInvitationAUtilisateur(Long evenementId, Long utilisateurId) {
        Evenement evenement = evenementRepository.findById(evenementId)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé"));

        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Invitation invitation = new Invitation();
        invitation.setEvenement(evenement);
        invitation.setUtilisateur(utilisateur);
        invitation.setDateEnvoi(LocalDateTime.now());
        invitation.setStatut(StatutInvitation.EN_ATTENTE);

        invitation = invitationRepository.save(invitation);

        // Création et envoi de la notification
        String titre = "Invitation à un événement";
        String message = String.format("Vous êtes invité(e) à l'événement '%s' prévu le %s", 
                                       evenement.getTitre(), evenement.getDate());

        // Utilisateur organisateur (par exemple auteur de l’événement)
        Utilisateur expediteur = evenement.getCreateur(); // ou une autre méthode pour récupérer l'organisateur

        notificationService.envoyerNotification(
            titre,
            message,
            Notification.TypeNotification.INVITATION_EVENEMENT,
            evenement.getId(),
            utilisateur,
            expediteur
        );

        return invitation;
    }


    @Override
    @Transactional
    public Invitation envoyerInvitationAService(Long evenementId, List<Long> serviceIds) {
        Evenement evenement = evenementRepository.findById(evenementId)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé"));

        Invitation invitation = new Invitation();
        invitation.setEvenement(evenement);
        invitation.setDateEnvoi(LocalDateTime.now());
        invitation.setStatut(StatutInvitation.EN_ATTENTE);

        List<Services> services = serviceRepository.findAllById(serviceIds);
        invitation.setServices(services);

        return invitationRepository.save(invitation);
    }

    @Override
    public List<Invitation> getInvitationsByEvenement(Long evenementId) {
        return invitationRepository.findByEvenementId(evenementId);
    }

    @Override
    public List<Invitation> getInvitationsByUtilisateur(Long utilisateurId) {
        return invitationRepository.findByUtilisateurId(utilisateurId);
    }

    @Override
    public Invitation repondreInvitation(Long invitationId, boolean accepte) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation non trouvée"));

        invitation.setStatut(accepte ? StatutInvitation.ACCEPTEE : StatutInvitation.REFUSEE);
        return invitationRepository.save(invitation);
    }
    @Override
    public void updateUtilisateursInvites(Long evenementId, List<Long> nouveauxUtilisateursIds) {
        // 1. Charger l'événement
        Evenement evenement = evenementRepository.findById(evenementId)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé"));

        // 2. Récupérer les invitations actuelles pour cet événement et utilisateur ≠ null
        List<Invitation> anciennesInvitations = invitationRepository.findByEvenementIdAndUtilisateurIsNotNull(evenementId);

        // 3. Extraire les IDs actuels
        Set<Long> anciensIds = anciennesInvitations.stream()
                .map(inv -> inv.getUtilisateur().getId())
                .collect(Collectors.toSet());

        Set<Long> nouveauxIds = new HashSet<>(nouveauxUtilisateursIds);

        // 4. Trouver les ID à supprimer
        Set<Long> idsASupprimer = new HashSet<>(anciensIds);
        idsASupprimer.removeAll(nouveauxIds);

        // 5. Trouver les ID à ajouter
        Set<Long> idsAAjouter = new HashSet<>(nouveauxIds);
        idsAAjouter.removeAll(anciensIds);

        // 6. Supprimer les invitations obsolètes
        anciennesInvitations.stream()
            .filter(inv -> idsASupprimer.contains(inv.getUtilisateur().getId()))
            .forEach(invitationRepository::delete);

        // 7. Ajouter les nouvelles invitations
        for (Long userId : idsAAjouter) {
            Utilisateur utilisateur = utilisateurRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur " + userId + " non trouvé"));

            Invitation nouvelle = new Invitation();
            nouvelle.setEvenement(evenement);
            nouvelle.setUtilisateur(utilisateur);
            nouvelle.setStatut(StatutInvitation.EN_ATTENTE);
            nouvelle.setDateEnvoi(LocalDateTime.now());

            invitationRepository.save(nouvelle);
        }
    }
    @Transactional
    public void ajouterInvites(Long evenementId, List<Long> nouveauxUtilisateursIds) {
        Evenement evenement = evenementRepository.findById(evenementId)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé"));

        for (Long userId : nouveauxUtilisateursIds) {
            // Vérifier si l'invitation existe déjà pour éviter doublons
            boolean existe = invitationRepository.existsByEvenementIdAndUtilisateurId(evenementId, userId);
            if (!existe) {
                Utilisateur utilisateur = utilisateurRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("Utilisateur " + userId + " non trouvé"));

                Invitation invitation = new Invitation();
                invitation.setEvenement(evenement);
                invitation.setUtilisateur(utilisateur);
                invitation.setStatut(StatutInvitation.EN_ATTENTE);
                invitation.setDateEnvoi(LocalDateTime.now());

                invitationRepository.save(invitation);
            }
        }
    }

    @Transactional
    public void supprimerInvites(Long evenementId, List<Long> anciensUtilisateursIds) {
        List<Invitation> anciennesInvitations = invitationRepository.findByEvenementIdAndUtilisateurIdIn(evenementId, anciensUtilisateursIds);
        invitationRepository.deleteAll(anciennesInvitations);
    }

}

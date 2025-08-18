package Pfe.T360.service;

import java.util.List;

import Pfe.T360.dto.InvitationDto;
import Pfe.T360.entity.Invitation;

public interface InvitationService {
	Invitation envoyerInvitationAUtilisateur(Long evenementId, Long utilisateurId);

    Invitation envoyerInvitationAService(Long evenementId, List<Long> serviceIds);

    List<Invitation> getInvitationsByEvenement(Long evenementId);

    List<Invitation> getInvitationsByUtilisateur(Long utilisateurId);

    Invitation repondreInvitation(Long invitationId, boolean acceptée);
    void updateUtilisateursInvites(Long evenementId, List<Long> nouveauxUtilisateursIds) ;
    void ajouterInvites(Long evenementId, List<Long> nouveauxUtilisateursIds);
    void supprimerInvites(Long evenementId, List<Long> anciensUtilisateursIds);
}


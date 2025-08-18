package Pfe.T360.controller;

import Pfe.T360.dto.InvitationReques;
import Pfe.T360.entity.Invitation;
import Pfe.T360.service.InvitationService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final InvitationService invitationService;

    public InvitationController(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    @PostMapping("/utilisateur/{evenementId}/{utilisateurId}")
    public ResponseEntity<Invitation> envoyerInvitationUtilisateur(
            @PathVariable Long evenementId, 
            @PathVariable Long utilisateurId) {
        Invitation invitation = invitationService.envoyerInvitationAUtilisateur(evenementId, utilisateurId);
        return ResponseEntity.ok(invitation);
    }

   
    @PostMapping("/service/{evenementId}")
    public ResponseEntity<Invitation> envoyerInvitationService(
            @PathVariable Long evenementId, 
            @RequestBody InvitationReques request) {
        Invitation invitation = invitationService.envoyerInvitationAService(evenementId, request.getServiceIds());
        return ResponseEntity.ok(invitation);
    }
    @GetMapping("/evenement/{evenementId}")
    public ResponseEntity<List<Invitation>> getInvitationsByEvenement(@PathVariable Long evenementId) {
        List<Invitation> invitations = invitationService.getInvitationsByEvenement(evenementId);
        return ResponseEntity.ok(invitations);
    }

    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<List<Invitation>> getInvitationsByUtilisateur(@PathVariable Long utilisateurId) {
        List<Invitation> invitations = invitationService.getInvitationsByUtilisateur(utilisateurId);
        return ResponseEntity.ok(invitations);
    }

    @PutMapping("/reponse/{invitationId}")
    public ResponseEntity<Invitation> repondreInvitation(
            @PathVariable Long invitationId, 
            @RequestParam boolean accepte) {
        Invitation invitation = invitationService.repondreInvitation(invitationId, accepte);
        return ResponseEntity.ok(invitation);
    }
    
    @PutMapping("/utilisateurs/{evenementId}")
    public ResponseEntity<?> updateUtilisateursInvites(
            @PathVariable Long evenementId,
            @RequestBody List<Long> nouveauxUtilisateursIds
    ) {
        invitationService.updateUtilisateursInvites(evenementId, nouveauxUtilisateursIds);
        return ResponseEntity.ok("Invitations utilisateurs mises à jour avec succès");
    }
    @PostMapping("/{evenementId}/invites/ajouter")
    public ResponseEntity<?> ajouterInvites(
            @PathVariable Long evenementId,
            @RequestBody List<Long> utilisateursIds) {
        try {
        	invitationService.ajouterInvites(evenementId, utilisateursIds);
            return ResponseEntity.ok("Invités ajoutés avec succès");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    @DeleteMapping("/{evenementId}/invites/supprimer")
    public ResponseEntity<?> supprimerInvites(
            @PathVariable Long evenementId,
            @RequestBody List<Long> utilisateursIds) {
        try {
        	invitationService.supprimerInvites(evenementId, utilisateursIds);
            return ResponseEntity.ok("Invités supprimés avec succès");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}
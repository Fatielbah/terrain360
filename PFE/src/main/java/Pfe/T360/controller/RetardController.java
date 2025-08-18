package Pfe.T360.controller;

import Pfe.T360.entity.AlerteRetard;
import Pfe.T360.entity.Retard;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.exception.ResourceNotFoundException;
import Pfe.T360.repository.RetardRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.RetardService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/retards")
public class RetardController {

    private final RetardService retardService;
    @Autowired
    UtilisateurRepository userRepository;
    @Autowired
    RetardRepository retardRepository;
    public RetardController(RetardService retardService) {
        this.retardService = retardService;
    }

    @PostMapping
    public ResponseEntity<Retard> createRetard(
            @RequestBody Retard retard) {
        Retard createdRetard = retardService.createRetard(retard );
        return ResponseEntity.ok(createdRetard);
    }

    @PutMapping("/{id}/justification")
    public ResponseEntity<Retard> updateJustification(
            @PathVariable Long id,
            @RequestParam boolean justifie,
            @RequestParam(required = false) String remarque) {
        Retard updatedRetard = retardService.updateRetardJustification(id, justifie, remarque);
        return ResponseEntity.ok(updatedRetard);
    }
    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<?> getRetardsByUtilisateur(@PathVariable Long utilisateurId) {
        Optional<Utilisateur> utilisateur = userRepository.findById(utilisateurId);
        if (utilisateur.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Utilisateur non trouvé avec l'ID: " + utilisateurId));
        }
        
        List<Retard> retards = retardService.getRetardsByUtilisateur(utilisateur.get());
        return ResponseEntity.ok(retards);
    }

    @GetMapping("/alertes/utilisateur/{utilisateurId}")
    public ResponseEntity<?> getAlertesByUtilisateur(@PathVariable Long utilisateurId) {
        Optional<Utilisateur> utilisateur = userRepository.findById(utilisateurId);
        if (utilisateur.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Utilisateur non trouvé avec l'ID: " + utilisateurId));
        }
        
        List<AlerteRetard> alertes = retardService.getAlertesByUtilisateur(utilisateur.get());
        return ResponseEntity.ok(alertes);
    }
    @GetMapping
    public ResponseEntity<List<Retard>> getAllRetards() {
        return ResponseEntity.ok(retardService.getAllRetards());
    }

    @GetMapping("/alertes")
    public ResponseEntity<List<AlerteRetard>> getAllAlertes() {
        return ResponseEntity.ok(retardService.getAllAlertes());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRetard(@PathVariable Long id) {
        retardService.deleteRetard(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Retard> updateRetard(
            @PathVariable Long id,
            @RequestBody Retard retardDetails,
            @AuthenticationPrincipal Utilisateur currentUser) {
        
        // Vérification des autorisations si nécessaire
        Retard existingRetard = retardRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Retard non trouvé"));
        
        if(!currentUser.getId().equals(existingRetard.getSuperviseur().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Retard updatedRetard = retardService.updateRetard(id, retardDetails);
        return ResponseEntity.ok(updatedRetard);
    }
}
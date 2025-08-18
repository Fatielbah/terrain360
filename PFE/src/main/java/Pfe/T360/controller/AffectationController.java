package Pfe.T360.controller;

import Pfe.T360.dto.AffectationDTO;
import Pfe.T360.entity.Affectation;
import Pfe.T360.entity.Materiel;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.service.AffectationService;
import Pfe.T360.service.MaterielService;
import Pfe.T360.service.UtilisateurService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/affectations")
public class AffectationController {

    private final AffectationService affectationService;
    private final MaterielService materielService;
    private final UtilisateurService utilisateurService;

    public AffectationController(AffectationService affectationService,MaterielService materielService
    		,UtilisateurService utilisateurService) {
        this.affectationService = affectationService;
        this.materielService =materielService;
        this.utilisateurService =utilisateurService;
    }
    

    @PostMapping
    public ResponseEntity<Affectation> createAffectation(
            @RequestParam Long materielId,
            @RequestParam Long utilisateurId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam String motif,
            @RequestParam Long technicienId) {

        Materiel materiel = materielService.getMaterielById(materielId);
        Utilisateur utilisateur = utilisateurService.getUtilisateurById(utilisateurId);
        Utilisateur technicien = utilisateurService.getUtilisateurById(technicienId); // récupérer le technicien

        Affectation affectation = affectationService.createAffectation(materiel, utilisateur, dateDebut, motif,technicien);
        return ResponseEntity.ok(affectation);
    }


    @PutMapping("/{id}/terminer")
    public ResponseEntity<Void> terminateAffectation(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin,
            @RequestParam String commentaire,
            @RequestParam Long technicienId) {
    	Utilisateur technicien = utilisateurService.getUtilisateurById(technicienId); // récupérer le technicien

        
        affectationService.terminateAffectation(id, dateFin, commentaire,technicien);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/actives")
    public List<AffectationDTO> getActiveAffectations() {
        return affectationService.getAffectationsActives();
    }

    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<List<AffectationDTO>> getAffectationsByUtilisateur(@PathVariable Long utilisateurId) {
        return ResponseEntity.ok(affectationService.getAffectationsByUtilisateur(utilisateurId));
    }


    @GetMapping("/materiel/{materielId}")
    public ResponseEntity<List<Affectation>> getAffectationsByMateriel(@PathVariable Long materielId) {
        return ResponseEntity.ok(affectationService.getAffectationsByMateriel(materielId));
    }

    @GetMapping("/materiel/{materielId}/current")
    public ResponseEntity<Affectation> getCurrentAffectationForMateriel(@PathVariable Long materielId) {
        Affectation affectation = affectationService.getCurrentAffectationForMateriel(materielId);
        return affectation != null ? ResponseEntity.ok(affectation) : ResponseEntity.notFound().build();
    }

    @GetMapping
    public ResponseEntity<List<Affectation>> getAffectationsBetweenDates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        return ResponseEntity.ok(affectationService.getAffectationsBetweenDates(startDate, endDate));
    }
    
    @GetMapping("/user/{idUser}/etat-summary")
    public ResponseEntity<Map<String, Long>> getMaterielEtatSummary(@PathVariable Long idUser) {
        return ResponseEntity.ok(affectationService.getMaterielCountByEtatForUser(idUser));
    }
    @GetMapping("/user/{idUser}")
    public ResponseEntity<List<Materiel>> getMaterielsByUtilisateur(@PathVariable Long idUser) {
        return ResponseEntity.ok(affectationService.getMaterielsByUser(idUser));
    }

}
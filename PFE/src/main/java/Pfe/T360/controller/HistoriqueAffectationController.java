package Pfe.T360.controller;

import Pfe.T360.dto.HistoriqueAffectationDTO;
import Pfe.T360.entity.HistoriqueAffectation;
import Pfe.T360.service.HistoriqueAffectationService;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/historique-affectations")
public class HistoriqueAffectationController {

    private final HistoriqueAffectationService historiqueService;

    public HistoriqueAffectationController(HistoriqueAffectationService historiqueService) {
        this.historiqueService = historiqueService;
    }

    @GetMapping
    public ResponseEntity<List<HistoriqueAffectation>> getHistoriqueComplet() {
        return ResponseEntity.ok(historiqueService.getHistoriqueComplet());
    }

    @GetMapping("/materiel/{materielId}")
    public ResponseEntity<List<HistoriqueAffectationDTO>> getHistoriqueByMateriel(@PathVariable Long materielId) {
        try {
            List<HistoriqueAffectationDTO> historique = historiqueService.getHistoriqueByMateriel(materielId);
            return ResponseEntity.ok(historique);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<List<HistoriqueAffectation>> getHistoriqueByUtilisateur(@PathVariable Long utilisateurId) {
        return ResponseEntity.ok(historiqueService.getHistoriqueByUtilisateur(utilisateurId));
    }

   
    @GetMapping("/actives")
    public ResponseEntity<List<HistoriqueAffectation>> getAffectationsActives() {
        return ResponseEntity.ok(historiqueService.getAffectationsActives());
    }

    
}
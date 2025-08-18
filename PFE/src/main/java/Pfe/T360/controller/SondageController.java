package Pfe.T360.controller;

import Pfe.T360.entity.Sondage;
import Pfe.T360.entity.Vote;
import Pfe.T360.dto.SondageDTO;
import Pfe.T360.dto.SondageUpdateDTO;
import Pfe.T360.entity.Option;
import Pfe.T360.service.SondageService;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sondages")
public class SondageController {

    private final SondageService sondageService;

    public SondageController(SondageService sondageService) {
        this.sondageService = sondageService;
    }

    @PostMapping
    public Sondage create(@RequestBody Sondage sondage) {
        return sondageService.createSondage(sondage);
    }

    @GetMapping
    public List<SondageDTO> getAll() {
        return sondageService.getAllSondages();
    }

    @GetMapping("/{id}")
    public Sondage getById(@PathVariable Long id) {
        return sondageService.getSondageById(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SondageDTO> updateSondage(
            @PathVariable Long id,
            @Valid @RequestBody SondageUpdateDTO sondageUpdateDTO) {
        
        SondageDTO updatedSondage = sondageService.updateSondage(id, sondageUpdateDTO);
        return ResponseEntity.ok(updatedSondage);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        sondageService.deleteSondage(id);
    }
    @PostMapping("/options/{optionId}/vote")
    public ResponseEntity<?> voter(
        @PathVariable Long optionId,
        @RequestParam Long utilisateurId
    ) {
        try {
            Vote vote = sondageService.voterOption(optionId, utilisateurId);
            
            if (vote == null) {
                // Cas d'annulation de vote
                return ResponseEntity.noContent().build();
            }
            
            return ResponseEntity.ok(vote);
            
        } catch (RuntimeException e) {
            // Gestion des erreurs spécifiques
            if (e.getMessage().contains("non trouvé")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

package Pfe.T360.controller;

import Pfe.T360.dto.EvenementDto;
import Pfe.T360.entity.Evenement;
import Pfe.T360.service.EvenementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evenements")
public class EvenementController {

    private final EvenementService evenementService;

    public EvenementController(EvenementService evenementService) {
        this.evenementService = evenementService;
    }

    @PostMapping("/{createurId}")
    public ResponseEntity<Evenement> createEvenement(@RequestBody Evenement evenement, @PathVariable Long createurId) {
        Evenement createdEvenement = evenementService.createEvenement(evenement, createurId);
        return ResponseEntity.ok(createdEvenement);
    }

    @GetMapping
    public ResponseEntity<List<EvenementDto>> getAllEvenements() {
        List<EvenementDto> evenements = evenementService.getAllEvenements();
        return ResponseEntity.ok(evenements);
    }


    @GetMapping("/{id}")
    public ResponseEntity<Evenement> getEvenementById(@PathVariable Long id) {
        return evenementService.getEvenementById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/createur/{createurId}")
    public ResponseEntity<List<Evenement>> getEvenementsByCreateur(@PathVariable Long createurId) {
        List<Evenement> evenements = evenementService.getEvenementsByCreateurId(createurId);
        return ResponseEntity.ok(evenements);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Evenement> updateEvenement(@PathVariable Long id, @RequestBody Evenement evenement) {
        Evenement updatedEvenement = evenementService.updateEvenement(id, evenement);
        return ResponseEntity.ok(updatedEvenement);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvenement(@PathVariable Long id) {
        evenementService.deleteEvenement(id);
        return ResponseEntity.noContent().build();
    }
}
package Pfe.T360.controller;

import Pfe.T360.entity.Rappel;
import Pfe.T360.service.RappelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/rappels")
public class RappelController {

    private final RappelService rappelService;

    public RappelController(RappelService rappelService) {
        this.rappelService = rappelService;
    }

    @PostMapping("/evenement/{evenementId}")
    public ResponseEntity<Rappel> createRappel(@PathVariable Long evenementId, @RequestBody Rappel rappel) {
        Rappel createdRappel = rappelService.createRappel(evenementId, rappel);
        return ResponseEntity.ok(createdRappel);
    }

    @GetMapping("/evenement/{evenementId}")
    public ResponseEntity<Rappel> getRappelByEvenement(@PathVariable Long evenementId) {
        Optional<Rappel> rappel = rappelService.getRappelByEvenementId(evenementId);
        return rappel.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/envoyer/{evenementId}")
    public ResponseEntity<Boolean> envoyerRappel(@PathVariable Long evenementId) {
        boolean rappelEnvoye = rappelService.envoyerRappel(evenementId);
        return ResponseEntity.ok(rappelEnvoye);
    }
    @PutMapping("/{id}")
    public ResponseEntity<Rappel> updateRappel(@PathVariable Long id, @RequestBody Rappel rappel) {
        Rappel updated = rappelService.updateRappel(id, rappel);
        return ResponseEntity.ok(updated);
    }
}
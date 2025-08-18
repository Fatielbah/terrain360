package Pfe.T360.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Pfe.T360.dto.FicheDePosteDto;
import Pfe.T360.entity.FicheDePoste;
import Pfe.T360.service.FicheDePosteService;
import lombok.RequiredArgsConstructor;


@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/fiches")
@RequiredArgsConstructor
public class FicheDePosteController {
    private final FicheDePosteService ficheService;

    @PostMapping
    public ResponseEntity<FicheDePoste> creerFiche(@RequestBody FicheDePosteDto fiche) {
        return ResponseEntity.ok(ficheService.creerFiche(fiche));
    }

    @GetMapping
    public ResponseEntity<List<FicheDePosteDto>> listerFiches() {
        return ResponseEntity.ok(ficheService.listerFiches());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<FicheDePosteDto> getFicheById(@PathVariable Long id) {
        return ResponseEntity.ok(ficheService.getFicheById(id));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<FicheDePoste> updateFiche(@PathVariable Long id, @RequestBody FicheDePosteDto ficheDto) {
        return ResponseEntity.ok(ficheService.updateFiche(id, ficheDto));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFiche(@PathVariable Long id) {
        ficheService.deleteFiche(id);
        return ResponseEntity.ok("Fiche de poste supprimée avec succès");
    }
}

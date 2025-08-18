package Pfe.T360.controller;

import Pfe.T360.dto.MaterielDTO;
import Pfe.T360.entity.Materiel;
import Pfe.T360.entity.Materiel.EtatMateriel;
import Pfe.T360.entity.Materiel.TypeMateriel;
import Pfe.T360.service.MaterielService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/materiels")
public class MaterielController {

    private final MaterielService materielService;

    public MaterielController(MaterielService materielService) {
        this.materielService = materielService;
    }

    @PostMapping
    public ResponseEntity<Materiel> createMateriel(@RequestBody MaterielDTO materiel) {
        return ResponseEntity.ok(materielService.createMateriel(materiel));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Materiel> updateMateriel(@PathVariable Long id, @RequestBody MaterielDTO materiel) {
        return ResponseEntity.ok(materielService.updateMateriel(id, materiel));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMateriel(@PathVariable Long id) {
        materielService.deleteMateriel(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Materiel> getMaterielById(@PathVariable Long id) {
        return ResponseEntity.ok(materielService.getMaterielById(id));
    }

    @GetMapping("/numero-serie/{numeroSerie}")
    public ResponseEntity<Materiel> getMaterielByNumeroSerie(@PathVariable String numeroSerie) {
        return ResponseEntity.ok(materielService.getMaterielByNumeroSerie(numeroSerie));
    }

    @GetMapping
    public ResponseEntity<List<Materiel>> getAllMateriels() {
        return ResponseEntity.ok(materielService.getAllMateriels());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Materiel>> getMaterielsByType(@PathVariable TypeMateriel type) {
        return ResponseEntity.ok(materielService.getMaterielsByType(type));
    }

    @GetMapping("/etat/{etat}")
    public ResponseEntity<List<Materiel>> getMaterielsByEtat(@PathVariable EtatMateriel etat) {
        return ResponseEntity.ok(materielService.getMaterielsByEtat(etat));
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<Materiel>> getMaterielsDisponibles() {
        return ResponseEntity.ok(materielService.getMaterielsDisponibles());
    }
   
     
    @GetMapping("/affectes")
    public ResponseEntity<List<Materiel>> getMaterielsAffectes() {
        return ResponseEntity.ok(materielService.getMaterielsAffectes());
    }

    @GetMapping("/garantie")
    public ResponseEntity<List<Materiel>> getMaterielsSousGarantie(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        return ResponseEntity.ok(materielService.getMaterielsSousGarantie(date));
    }

    @PatchMapping("/{id}/etat")
    public ResponseEntity<Materiel> updateEtatMateriel(
            @PathVariable Long id,
            @RequestParam("nouvelEtat") EtatMateriel nouvelEtat) {
        
        Materiel updatedMateriel = materielService.updateEtatMateriel(id, nouvelEtat);
        return ResponseEntity.ok(updatedMateriel);
    }
    
    @GetMapping("/stat")
    public Map<String, Long> getMaterielStatistics() {
        return materielService.getMaterielStatistics();
    }
    @GetMapping("/affectes/{userId}")
    public ResponseEntity<Long> getNombreMaterielsAffectesAUser(@PathVariable Long userId) {
        long count = materielService.countMaterielsAffectesAUser(userId);
        return ResponseEntity.ok(count);
    }
}
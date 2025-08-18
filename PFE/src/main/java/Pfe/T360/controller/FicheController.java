package Pfe.T360.controller;


import Pfe.T360.service.impl.FichePrimeServiceImpl;
import Pfe.T360.util.FileUtils;
import Pfe.T360.service.impl.FichePaieServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import Pfe.T360.entity.FichePaie;
import java.util.List;
import Pfe.T360.entity.FichePrime;


@RestController
@RequestMapping("/api/fiches")
public class FicheController {

    @Autowired
    private FichePrimeServiceImpl fichePrimeService;
    @Autowired
    private FichePaieServiceImpl fichePaieService;

    @PostMapping("prime/upload/{idUtilisateur}")
    public ResponseEntity<String> uploadFichePrime(@PathVariable Long idUtilisateur,
                                              @RequestParam("fichier") MultipartFile fichier) {
        fichePrimeService.uploadFichePrime(idUtilisateur, fichier);
        return ResponseEntity.ok("Fiche de prime enregistrée avec succès !");
        
    }
    @PostMapping("paie/upload/{idUtilisateur}")
    public ResponseEntity<String> uploadFichePaie(@PathVariable Long idUtilisateur,
                                              @RequestParam("fichier") MultipartFile fichier) {
    	fichePaieService.uploadFichePaie(idUtilisateur, fichier);
        return ResponseEntity.ok("Fiche de prime enregistrée avec succès !");
    }
    @GetMapping("prime/{idUtilisateur}")
    public ResponseEntity<List<FichePrime>> getFichesPrime(@PathVariable Long idUtilisateur) {
        List<FichePrime> fiches = fichePrimeService.getFichesPrimeByUtilisateur(idUtilisateur);
        return ResponseEntity.ok(fiches);
    }
    @GetMapping("prime/download/{ficheId}")
    public ResponseEntity<byte[]> downloadFichePrime(@PathVariable Long ficheId) {
        FichePrime fiche = fichePrimeService.getFichePrimeById(ficheId); // méthode à ajouter
        byte[] data = FileUtils.decompressFile(fiche.getFichier());

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=" + fiche.getNomFichier())
                .header("Content-Type", fiche.getTypeFiche())
                .body(data);
    }
    @GetMapping("paie/download/{ficheId}")
    public ResponseEntity<byte[]> downloadFichePaie(@PathVariable Long ficheId) {
        FichePaie fiche = fichePaieService.getFichePaieById(ficheId); // méthode à ajouter si pas encore faite
        byte[] data = FileUtils.decompressFile(fiche.getFichier());

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=" + fiche.getNomFichier())
                .header("Content-Type", fiche.getTypeFiche())
                .body(data);
    }



    @GetMapping("prime")
    public ResponseEntity<List<FichePrime>> getAllFichesPrime() {
        List<FichePrime> fiches = fichePrimeService.getAllFichesPrime();
        return ResponseEntity.ok(fiches);
    }

    @GetMapping("paie/{idUtilisateur}")
    public ResponseEntity<List<FichePaie>> getFichesPaie(@PathVariable Long idUtilisateur) {
        List<FichePaie> fiches = fichePaieService.getFichesPaieByUtilisateur(idUtilisateur);
        return ResponseEntity.ok(fiches);
    }

    @GetMapping("paie")
    public ResponseEntity<List<FichePaie>> getAllFichesPaie() {
        List<FichePaie> fiches = fichePaieService.getAllFichesPaie();
        return ResponseEntity.ok(fiches);
    }

}

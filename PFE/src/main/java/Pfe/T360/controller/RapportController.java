package Pfe.T360.controller;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Pfe.T360.entity.Materiel;
import Pfe.T360.repository.MaterielRepository;
import Pfe.T360.service.impl.RapportServiceImpl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;


@RestController
@RequestMapping("/api/rapport")
public class RapportController {

    @Autowired
    private MaterielRepository materielRepository;

    @Autowired
    private RapportServiceImpl rapportMaterielService;

    @GetMapping("/materiel/{id}")
    public ResponseEntity<byte[]> genererRapportMateriel(@PathVariable Long id) throws IOException {
        Materiel materiel = materielRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matériel non trouvé"));

        byte[] pdf = rapportMaterielService.genererRapport(materiel);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "rapport_materiel_" + id + ".pdf");

        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}

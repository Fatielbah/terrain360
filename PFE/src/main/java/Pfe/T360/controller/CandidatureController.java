

package Pfe.T360.controller;

import Pfe.T360.dto.IAResponse;
import Pfe.T360.entity.Candidature;
import Pfe.T360.entity.Competence;
import Pfe.T360.entity.File;
import Pfe.T360.repository.CandidatureRepository;
import Pfe.T360.repository.FileRepository;
import Pfe.T360.service.CandidatureService;
import Pfe.T360.service.FileService;
import Pfe.T360.service.IAService;
import Pfe.T360.util.FileUtils;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;

@RestController
@RequestMapping("/api/candidatures")
@CrossOrigin(origins = "http://localhost:3000")
public class CandidatureController {

    @Autowired
    private CandidatureService candidatureService;
    @Autowired
    private CandidatureRepository candidatureRepo;

    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private FileService textExtractorService;
    @Autowired
    private IAService iaService;
    @Autowired
    private FileRepository fileRepository;
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createCandidature(
            @RequestPart("candidature") String candidatureJson,
            @RequestPart("cv") MultipartFile cv,
            @RequestPart(value = "lettreMotivation", required = false) MultipartFile lettreMotivation) {
        
        try {
            // Désérialiser les données JSON de candidature
            Candidature candidature = objectMapper.readValue(candidatureJson, Candidature.class);
            
            // Validation des champs obligatoires
            Map<String, String> validationErrors = validateCandidature(candidature);
            if (!validationErrors.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Données de candidature invalides");
                response.put("errors", validationErrors);
                return ResponseEntity.badRequest().body(response);
            }
            
            // Validation des fichiers
            if (cv == null || cv.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Le CV est obligatoire");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Validation des types de fichiers
            if (!isValidFileType(cv)) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Le CV doit être un fichier PDF, DOC ou DOCX");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (lettreMotivation != null && !lettreMotivation.isEmpty() && !isValidFileType(lettreMotivation)) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "La lettre de motivation doit être un fichier PDF, DOC ou DOCX");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Validation de la taille des fichiers (10MB max)
            if (cv.getSize() > 10 * 1024 * 1024) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Le CV ne doit pas dépasser 10MB");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (lettreMotivation != null && lettreMotivation.getSize() > 10 * 1024 * 1024) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "La lettre de motivation ne doit pas dépasser 10MB");
                return ResponseEntity.badRequest().body(response);
            }
            
            Candidature savedCandidature = candidatureService.createCandidature(candidature, cv, lettreMotivation);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Candidature enregistrée avec succès");
            response.put("candidature", savedCandidature);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (IOException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Erreur lors du traitement des fichiers: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Erreur lors de la création de la candidature: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Valide les champs obligatoires de la candidature
     */
    private Map<String, String> validateCandidature(Candidature candidature) {
        Map<String, String> errors = new HashMap<>();
        
        if (candidature.getCivilite() == null || candidature.getCivilite().trim().isEmpty()) {
            errors.put("civilite", "La civilité est obligatoire");
        }
        
        if (candidature.getNomComplet() == null || candidature.getNomComplet().trim().isEmpty()) {
            errors.put("nomComplet", "Le nom complet est obligatoire");
        }
        
        if (candidature.getEmail() == null || candidature.getEmail().trim().isEmpty()) {
            errors.put("email", "L'email est obligatoire");
        } else if (!candidature.getEmail().matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
            errors.put("email", "Format d'email invalide");
        }
        
        if (candidature.getTelephone() == null || candidature.getTelephone().trim().isEmpty()) {
            errors.put("telephone", "Le téléphone est obligatoire");
        }
        
        if (candidature.getAdresse() == null || candidature.getAdresse().trim().isEmpty()) {
            errors.put("adresse", "L'adresse est obligatoire");
        }
        
        if (candidature.getCodePostal() == null || candidature.getCodePostal().trim().isEmpty()) {
            errors.put("codePostal", "Le code postal est obligatoire");
        }
        
        if (candidature.getVille() == null || candidature.getVille().trim().isEmpty()) {
            errors.put("ville", "La ville est obligatoire");
        }
        
        if (candidature.getFicheDePoste() == null || candidature.getFicheDePoste().getId() == null) {
            errors.put("ficheDePoste", "La fiche de poste est obligatoire");
        }
        
        return errors;
    }

    /**
     * Valide le type de fichier (PDF, DOC, DOCX uniquement)
     */
    private boolean isValidFileType(MultipartFile file) {
        if (file == null || file.getContentType() == null) {
            return false;
        }
        
        String contentType = file.getContentType();
        return contentType.equals("application/pdf") ||
               contentType.equals("application/msword") ||
               contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCandidature(
            @PathVariable Long id, 
            @RequestBody Candidature candidature) {
        
        try {
            Candidature updatedCandidature = candidatureService.updateCandidature(id, candidature);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Candidature mise à jour avec succès");
            response.put("candidature", updatedCandidature);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCandidature(@PathVariable Long id) {
        try {
            candidatureService.deleteCandidature(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Candidature supprimée avec succès");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCandidatureById(@PathVariable Long id) {
        try {
            Candidature candidature = candidatureService.getCandidatureById(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("candidature", candidature);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllCandidatures() {
        try {
            List<Candidature> candidatures = candidatureService.getAllCandidatures();
        
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", candidatures.size());
            response.put("candidatures", candidatures);
            response.put("message", "Candidatures récupérées avec succès");
            System.out.println("Candidatures size: " + candidatures.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Erreur lors de la récupération des candidatures: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<?> updateStatut(
            @PathVariable Long id, 
            @RequestParam Candidature.StatutCandidature statut) {
        
        try {
            Candidature updatedCandidature = candidatureService.updateStatut(id, statut);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Statut de candidature mis à jour avec succès");
            response.put("candidature", updatedCandidature);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/cv")
    public ResponseEntity<?> downloadCV(@PathVariable Long id) {
        try {
            byte[] fileContent = candidatureService.downloadCV(id);
            Candidature candidature = candidatureService.getCandidatureById(id);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                           "attachment; filename=\"" + candidature.getCv().getName() + "\"")
                    .body(fileContent);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/lettre-motivation")
    public ResponseEntity<?> downloadLettreMotivation(@PathVariable Long id) {
        try {
            byte[] fileContent = candidatureService.downloadLettreMotivation(id);
            Candidature candidature = candidatureService.getCandidatureById(id);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                           "attachment; filename=\"" + candidature.getLettreMotivation().getName() + "\"")
                    .body(fileContent);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    

    @GetMapping("/score/{candidatureId}")
    public ResponseEntity<?> analyserCV(@PathVariable Long candidatureId) {
        Candidature c = candidatureRepo.findById(candidatureId).orElseThrow();

        File fichier = c.getCv();
        byte[] data = FileUtils.decompressFile(fichier.getFileData());
        String texteCV = textExtractorService.extractText(data, fichier.getName());

        String description = c.getFicheDePoste().getDescription();
        String competences = c.getFicheDePoste().getCompetencesRequises().stream()
            .map(Competence::getNom)
            .collect(Collectors.joining(", "));

        String prompt = """
            Compare le CV suivant :
            %s

            Avec cette fiche de poste :
            Description : %s
            Compétences : %s

            Donne un score d'adéquation (0 à 100) suivi d'une brève explication.
            """.formatted(texteCV, description, competences);

        IAResponse result = iaService.callAI(prompt);

        c.setScoreIA(result.getScore());
        candidatureRepo.save(c);
        return ResponseEntity.ok(result);
    }

}

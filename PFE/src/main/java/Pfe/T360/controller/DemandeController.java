package Pfe.T360.controller;

import Pfe.T360.dto.DemandeAbsenceDTO;
import Pfe.T360.dto.DemandeCongeDTO;
import Pfe.T360.entity.Candidature;
import Pfe.T360.entity.Demande;
import Pfe.T360.entity.DemandeConge;
import Pfe.T360.entity.DemandeConge.TypeConge;
import Pfe.T360.entity.DemandeAbsence;
import Pfe.T360.entity.DemandeAbsence.TypeAbsence;
import Pfe.T360.entity.DemandeDocument;
import Pfe.T360.exception.GestionCongeException;
import Pfe.T360.repository.DemandeAbsenceRepository;
import Pfe.T360.repository.DemandeCongeRepository;
import Pfe.T360.repository.DemandeDocumentRepository;
import Pfe.T360.repository.DemandeRepository;
import Pfe.T360.entity.Demande.StatutDemande;
import Pfe.T360.service.DemandeService;
import Pfe.T360.service.impl.DemandeServiceImpl.ActionRH;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestMapping;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demandes")
@RequiredArgsConstructor
public class DemandeController {

    private final DemandeService demandeService;
    private final DemandeRepository demandeRepository;
    private final DemandeDocumentRepository demandeDocumentRepository;
    private final DemandeCongeRepository demandeCongeRepository;
    private final DemandeAbsenceRepository demandeAbsenceRepository;
    
    @PostMapping(value = "/conge", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDemandeConge(
    		@RequestPart("demande") DemandeCongeDTO demandeDto,
    		 @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestHeader("X-User-Id") Long userId) {
    	
    	DemandeConge demande = new DemandeConge();
    	
    	demande.setType(TypeConge.valueOf(demandeDto.getType()));
        demande.setDateDebut(demandeDto.getDateDebut());
        demande.setDateFin(demandeDto.getDateFin());
        demande.setCommentaire(demandeDto.getCommentaire());
            return ResponseEntity.ok(demandeService.createDemandeConge(demande, userId,file));
    }
    
   
    @PostMapping(value = "/absence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DemandeAbsence> createDemandeAbsence(
            @RequestPart("demande") DemandeAbsenceDTO demandeDto,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestHeader("X-User-Id") Long userId) {
        
        DemandeAbsence demande = new DemandeAbsence();
        
        // Conversion des types
        demande.setType(TypeAbsence.valueOf(demandeDto.getType()));
        demande.setDateDebut(demandeDto.getDateDebut());
        demande.setDateFin(demandeDto.getDateFin());
        demande.setCommentaire(demandeDto.getCommentaire());
        demande.setEstUrgente(demandeDto.isEstUrgente());
        
        // Conversion des heures String -> Date
        if(demandeDto.getHeureDebut() != null) {
            demande.setHeureDebut(convertToDate(demandeDto.getHeureDebut()));
        }
        if(demandeDto.getHeureFin() != null) {
            demande.setHeureFin(convertToDate(demandeDto.getHeureFin()));
        }
        
        return ResponseEntity.ok(demandeService.createDemandeAbsence(demande, userId, file));
    }

    private Date convertToDate(String timeString) {
        try {
            LocalTime localTime = LocalTime.parse(timeString);
            return Date.from(localTime.atDate(LocalDate.now())
                                    .atZone(ZoneId.systemDefault())
                                    .toInstant());
        } catch (Exception e) {
            throw new IllegalArgumentException("Format d'heure invalide: " + timeString);
        }
    }

    @PostMapping("/document")
    public ResponseEntity<DemandeDocument> createDemandeDocument(
            @RequestBody DemandeDocument demande,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(demandeService.createDemandeDocument(demande, userId));
    }

    
    @PostMapping("/rh")
    public void traiterDemandeRH(
            @RequestParam Long demandeId,
            @RequestParam Long validateurId,
            @RequestParam String commentaire,
            @RequestParam ActionRH action) {
        demandeService.traiterDemandeRH(demandeId, validateurId, commentaire, action);
    }

    // ✅ Traiter la demande par la direction
    @PostMapping("/direction")
    public void traiterDemandeDirection(
            @RequestParam Long demandeId,
            @RequestParam Long validateurId,
            @RequestParam String commentaire,
            @RequestParam boolean estValidee) {
        demandeService.traiterDemandeDirection(demandeId, validateurId, commentaire, estValidee);
    }

   

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Demande>> getDemandesByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(demandeService.getDemandesByUser(userId));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Demande>> getDemandesByStatus(@PathVariable StatutDemande statut) {
        return ResponseEntity.ok(demandeService.getDemandesByStatus(statut));
    }
    @GetMapping("/demandeConge")
    public ResponseEntity<List<DemandeConge>> getAllDemandeConges() {
        List<DemandeConge> demandeConge = demandeCongeRepository.findAll();
        return ResponseEntity.ok(demandeConge);
    }
    @GetMapping("/demandeabsence")
    public ResponseEntity<List<DemandeAbsence>> getAllDemandeAbsence() {
        List<DemandeAbsence> demandeAbsence = demandeAbsenceRepository.findAll();
        return ResponseEntity.ok(demandeAbsence);
    }
    @GetMapping("/demandeDocument")
    public ResponseEntity<List< DemandeDocument>> getAllDemandeDocument() {
        List<DemandeDocument> demandeDocument = demandeDocumentRepository.findAll();
        return ResponseEntity.ok(demandeDocument);
    }
    @GetMapping("/{id}")
    public ResponseEntity<Demande> getDemandeDetails(@PathVariable Long id) {
        return ResponseEntity.ok(demandeService.getDemandeDetails(id));
    }
    @PutMapping("/{demandeId}/cancel")
    public ResponseEntity<Void> cancelDemande(@PathVariable Long demandeId,
                                            @RequestParam Long userId) {
        demandeService.cancelDemande(demandeId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{demandeId}")
    public ResponseEntity<Void> deleteDemande(@PathVariable Long demandeId,
                                             @RequestParam Long userId) {
        demandeService.deleteDemande(demandeId, userId);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/{id}/justification")
    public ResponseEntity<?> downloadjustification(@PathVariable Long id) {
        try {
            byte[] fileContent = demandeService.downloadJustification(id);
            Demande demande = demandeRepository.getById(id);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                           "attachment; filename=\"" + demande.getJustification().getName() + "\"")
                    .body(fileContent);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    @GetMapping("/DemandeDocument/{userId}")
    public List<DemandeDocument> getDemandeDocumentByUser(@PathVariable Long userId) {
        return demandeDocumentRepository.findByUtilisateurId(userId);
    }
   

    @GetMapping("/DemandeConge/{userId}")
    public List<DemandeConge> getDemandeCongeByUser(@PathVariable Long userId) {
        return demandeCongeRepository.findByUtilisateurId(userId);
    } 
    @GetMapping("/DemandeAbsence/{userId}")
    public List<DemandeAbsence> getDemandeAbsenceByUser(@PathVariable Long userId) {
        return demandeAbsenceRepository.findByUtilisateurId(userId);
    }
}
package Pfe.T360.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import Pfe.T360.dto.NotificationDTO;
import Pfe.T360.entity.Evenement;
import Pfe.T360.entity.Notification;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.exception.ResourceNotFoundException;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.NotificationService;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000")
public class NotificationController {
	
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<List<Notification>> getNotificationsUtilisateur(@PathVariable Long utilisateurId) {
        List<Notification> notifications = notificationService.getNotificationsUtilisateur(utilisateurId);
        return ResponseEntity.ok(notifications);
    }
    
    @PutMapping("/{notificationId}/lue")
    public ResponseEntity<Void> marquerCommeLue(@PathVariable Long notificationId) {
        notificationService.marquerCommeLue(notificationId);
        return ResponseEntity.ok().build();
    }
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> supprimerNotification(@PathVariable Long notificationId) {
        notificationService.supprimerNotification(notificationId);
        return ResponseEntity.ok().build();
    }
    @DeleteMapping("/utilisateur/{utilisateurId}/toutes")
    public ResponseEntity<Void> supprimerToutesNotifications(@PathVariable Long utilisateurId) {
        notificationService.supprimerToutesNotificationsUtilisateur(utilisateurId);
        return ResponseEntity.ok().build();
    }
    
    
    @PostMapping("/notification/{userId}")
    public ResponseEntity<String> envoyerNotificationTest(@PathVariable Long userId) {
        System.out.println("=== TEST NOTIFICATION POUR UTILISATEUR " + userId + " ===");
        
        try {
            Utilisateur utilisateur = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            // Auteur fictif (ex: le même utilisateur, ou un admin hardcodé)
            Utilisateur auteur = utilisateur; // ou récupère un admin
            
            Evenement evenementTest = new Evenement();
            evenementTest.setId(999L);
            evenementTest.setTitre("Événement de Test");
            evenementTest.setDate(LocalDate.now());
            
            notificationService.creerNotificationEvenement(evenementTest, Arrays.asList(utilisateur), auteur);
            
            System.out.println("✅ Notification de test envoyée avec succès");
            return ResponseEntity.ok("Notification de test envoyée avec succès");
            
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'envoi de la notification de test: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<NotificationDTO> createNotification(
            @Valid @RequestBody NotificationDTO notificationDTO) {
        
        Notification notification = notificationService.createNotification(notificationDTO);
        return ResponseEntity.ok(NotificationDTO.fromEntity(notification));
    }

}

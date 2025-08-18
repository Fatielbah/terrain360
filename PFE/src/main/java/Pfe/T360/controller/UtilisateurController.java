package Pfe.T360.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import Pfe.T360.dto.ChangePasswordRequest;
import Pfe.T360.dto.LoginRequest;
import Pfe.T360.dto.LoginResponseDTO;
import Pfe.T360.dto.SignUpRequest;
import Pfe.T360.dto.UtilisateurDTO;
import Pfe.T360.entity.CustomUtilisateurDetails;
import Pfe.T360.entity.File;
import Pfe.T360.entity.Notification;
import Pfe.T360.entity.Role;
import Pfe.T360.entity.Utilisateur;
//import Pfe.T360.entity.Services;
import Pfe.T360.repository.UtilisateurRepository;
//import Pfe.T360.repository.ServiceRepository;
import Pfe.T360.security.JwtUtils;
import Pfe.T360.service.NotificationService;
import Pfe.T360.service.UtilisateurAbsenceCongeService;
//import Pfe.T360.service.ServiceService;
import Pfe.T360.service.UtilisateurService;

import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import Pfe.T360.repository.FileRepository;
import Pfe.T360.util.FileUtils;
import java.io.IOException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;


@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/utilisateurs")
public class UtilisateurController {

	@Autowired
    UtilisateurRepository userRepository;

    @Autowired
    private AuthenticationManager authenticationManager;

    //private ServiceRepository serviceRepository;
    @Autowired
    private FileRepository fileRepository;
    @Autowired
    private JwtUtils jwtUtil;
    @Autowired
    PasswordEncoder encoder;
    @Autowired
    UtilisateurService utilisateurService;
    @Autowired
    private  NotificationService notificationService;
    @Autowired
    private  UtilisateurAbsenceCongeService utilisateurServiceAbCon;

    public UtilisateurController(UtilisateurRepository userRepository) {
        this.userRepository = userRepository;
    }
   


    @PostMapping("/signIn")
    public ResponseEntity<?> authenticate(@Valid @RequestBody LoginRequest loginRequest) {
        Optional<Utilisateur> user = userRepository.findByNomDeUtilisateur(loginRequest.getUsername());
        if (user.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "Nom d'utilisateur ou mot de passe invalide"));
        }
        Utilisateur utilisateur = user.get();
        if (utilisateur.getRole() == Role.DEFAULT) {
            return ResponseEntity
                .badRequest()
                .body(Map.of("error", "Le compte n'est pas encore activé. Veuillez contacter un administrateur."));
        }


        
        if (!encoder.matches(loginRequest.getPassword(), utilisateur.getMotDePasse())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Les mots de passe ne correspondent pas !"));
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtil.generateJwtToken(authentication);

        CustomUtilisateurDetails userDetails = (CustomUtilisateurDetails) authentication.getPrincipal();

        LoginResponseDTO response = new LoginResponseDTO(
                utilisateur.getId(),
                jwt,
                utilisateur.getNom(),
                utilisateur.getPrenom(),
                utilisateur.getDateNaissance(),
                utilisateur.getNomDeUtilisateur(),
                utilisateur.getTelephone(),
                utilisateur.getAdresse(),
                utilisateur.getGenre(),
                utilisateur.getRole(),
                utilisateur.getEmail(),
                utilisateur.getNationalite(),
                utilisateur.getCin(),
                utilisateur.getSituationFamiliale()
        );



        return ResponseEntity.ok(response);
    }





    @PostMapping("/signup")
    public ResponseEntity<?> register(@Valid @RequestBody SignUpRequest signUpRequest) {
        if (userRepository.existsByNomDeUtilisateur(signUpRequest.getNomDeUtilisateur())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Ce nom d'utilisateur est déjà utilisé !"));
        }

        try {
            Utilisateur utilisateur = new Utilisateur();
            utilisateur.setNomDeUtilisateur(signUpRequest.getNomDeUtilisateur());
            utilisateur.setMotDePasse(encoder.encode(signUpRequest.getMotDePasse()));
            utilisateur.setNom(signUpRequest.getNom());
            utilisateur.setPrenom(signUpRequest.getPrenom());
            utilisateur.setAdresse(signUpRequest.getAdresse());
            utilisateur.setDateNaissance(signUpRequest.getDateNaissance());
            utilisateur.setTelephone(signUpRequest.getTelephone());
            utilisateur.setGenre(signUpRequest.getGenre());
            utilisateur.setRole(Role.DEFAULT); // assignation du rôle par défaut
            utilisateur.setEmail(signUpRequest.getEmail());
            utilisateur.setNationalite(signUpRequest.getNationalite());
            utilisateur.setDateEmbauche(LocalDate.now());
            utilisateur.setCin(signUpRequest.getCin());
            utilisateur.setSituationFamiliale(signUpRequest.getSituationFamiliale());

            Utilisateur utilisateurSave = userRepository.save(utilisateur);

            // 🔔 Envoi de notification à tous les admins
            try {
                if (notificationService != null) {
                    List<Utilisateur> admins = userRepository.findByRole(Role.ADMIN);
                    for (Utilisateur admin : admins) {
                        notificationService.envoyerNotification(
                                "Nouveau compte créé",
                                String.format("L'utilisateur %s %s vient de s'enregistrer. Veuillez lui assigner un rôle.", 
                                        utilisateurSave.getNom(), utilisateurSave.getPrenom()),
                                Notification.TypeNotification.NOUVELLE_COMPTE, // ou un type plus adapté
                                utilisateurSave.getId(), // cible de la notification
                                admin,                   // destinataire
                                utilisateurSave          // initiateur
                        );
                    }
                }
            } catch (Exception e) {
                System.err.println("Erreur lors de l'envoi de notification : " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of("succes", "Compte créé avec succès !"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Erreur lors de l'enregistrement de l'utilisateur"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<Utilisateur> utilisateur = userRepository.findById(id);
        if (utilisateur.isPresent()) {
            return ResponseEntity.ok(utilisateur.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found with ID: " + id));
        }
    }
    /*@GetMapping("service/{id}")
    public ResponseEntity<?> getUserByService(@PathVariable Long id) {
        Optional<Services> services =serviceRepository.findById(id) ;
        if (services.isPresent()) {
            return ResponseEntity.ok(services.get().getUtilisateurs());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "service not found with ID: " + id));
        }
    }*/
    @GetMapping("enqueteur")
    public ResponseEntity<?> getAllEnqueteur() {
            return ResponseEntity.ok(utilisateurService.getAllEnqueteurs());
        
    }
    @GetMapping("/exclude/{id}")
    public ResponseEntity<?> getAllUsersExceptOne(@PathVariable Long id) {
        Optional<Utilisateur> utilisateur = userRepository.findById(id);
        if (utilisateur.isPresent()) {
            List<Utilisateur> utilisateurs = userRepository.findAll()
                    .stream()
                    .filter(user -> !user.getId().equals(id))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(utilisateurs);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found with ID: " + id));
        }

    }


    // Update User
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Utilisateur updatedUser) {
        Optional<Utilisateur> existingUser = userRepository.findById(id);

        if (existingUser.isPresent()) {
            Utilisateur utilisateur = existingUser.get();

            // Ne PAS modifier mot de passe et image de profil
            utilisateur.setNom(updatedUser.getNom());
            utilisateur.setPrenom(updatedUser.getPrenom());
            utilisateur.setDateNaissance(updatedUser.getDateNaissance());
            utilisateur.setAdresse(updatedUser.getAdresse());
            utilisateur.setTelephone(updatedUser.getTelephone());
            utilisateur.setGenre(updatedUser.getGenre());
            utilisateur.setEmail(updatedUser.getEmail());
            utilisateur.setNationalite(updatedUser.getNationalite());
            utilisateur.setCin(updatedUser.getCin());
            utilisateur.setSituationFamiliale(updatedUser.getSituationFamiliale());
            userRepository.save(utilisateur);
            return ResponseEntity.ok(Map.of("success", "Utilisateur mis à jour avec succès !"));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Utilisateur introuvable avec l'ID : " + id));
        }
    }

    // Delete User
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", "User deleted successfully!"));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found with ID: " + id));
        }
    }

    @PostMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody ChangePasswordRequest request) {
        Optional<Utilisateur> optionalUser = userRepository.findById(id);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Utilisateur introuvable avec l'ID : " + id));
        }

        Utilisateur utilisateur = optionalUser.get();

        // Vérification de l'ancien mot de passe
        if (!encoder.matches(request.getCurrentPassword(), utilisateur.getMotDePasse())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Mot de passe actuel incorrect"));
        }

        // Mise à jour du nouveau mot de passe encodé
        utilisateur.setMotDePasse(encoder.encode(request.getNewPassword()));
        userRepository.save(utilisateur);

        return ResponseEntity.ok(Map.of("success", "Mot de passe modifié avec succès"));
    }

    @GetMapping
    public ResponseEntity<List<Utilisateur>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
    @GetMapping("/total")
    public ResponseEntity<Long> getTotalUsers() {
        long totalUsers = userRepository.count();
        return ResponseEntity.ok(totalUsers);
    }


    @PostMapping("/{id}/upload-image")
    public ResponseEntity<?> uploadImage(@PathVariable Long id, 
                                       @RequestParam("image") MultipartFile image) {
        try {
            Optional<Utilisateur> optionalUtilisateur = userRepository.findById(id);
            if (optionalUtilisateur.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Utilisateur introuvable !"));
            }
            
            Utilisateur utilisateur = optionalUtilisateur.get();
            
            if (image != null && !image.isEmpty()) {
                // Vérification du type de fichier
                if (!image.getContentType().startsWith("image/")) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Le fichier doit être une image"));
                }
                
                // Taille maximale de l'image (5MB)
                if (image.getSize() > 5 * 1024 * 1024) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "La taille de l'image ne doit pas dépasser 5MB"));
                }
                
                // Delete previous image if exists
                if (utilisateur.getImage() != null) {
                    fileRepository.delete(utilisateur.getImage());
                }
                
                File imageFile = File.builder()
                        .name(image.getOriginalFilename())
                        .type(image.getContentType())
                        .fileData(FileUtils.compressFile(image.getBytes()))
                        .build();
                
                // Save the image file first
                imageFile = fileRepository.save(imageFile);
                utilisateur.setImage(imageFile);
                userRepository.save(utilisateur);
                
                return ResponseEntity.ok(Map.of("success", "Image de profil mise à jour avec succès"));
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Aucune image fournie"));
            }
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors du traitement de l'image"));
        }
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<?> getImage(@PathVariable Long id) {
        Optional<Utilisateur> optionalUtilisateur = userRepository.findById(id);
        if (optionalUtilisateur.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Utilisateur introuvable !"));
        }
        
        Utilisateur utilisateur = optionalUtilisateur.get();
        if (utilisateur.getImage() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Aucune image de profil trouvée"));
        }
        
        File imageFile = utilisateur.getImage();
        byte[] imageData = FileUtils.decompressFile(imageFile.getFileData());
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(imageFile.getType()))
                .body(imageData);
    }

    @DeleteMapping("/{id}/image")
    public ResponseEntity<?> deleteImage(@PathVariable Long id) {
        Optional<Utilisateur> optionalUtilisateur = userRepository.findById(id);
        if (optionalUtilisateur.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Utilisateur introuvable !"));
        }
        
        Utilisateur utilisateur = optionalUtilisateur.get();
        if (utilisateur.getImage() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "L'utilisateur n'a pas d'image de profil"));
        }
        
        fileRepository.delete(utilisateur.getImage());
        utilisateur.setImage(null);
        userRepository.save(utilisateur);
        
        return ResponseEntity.ok(Map.of("success", "Image de profil supprimée avec succès"));
    }
    
    @GetMapping("/conge/solde")
    public ResponseEntity<Float> getSoldeConge(@RequestHeader("X-User-Id") Long userId) {
        Utilisateur user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        long moisComplets = ChronoUnit.MONTHS.between(
            user.getDateEmbauche().withDayOfMonth(1),
            LocalDate.now().withDayOfMonth(1)
        );

        float solde = (moisComplets * 1.5f) - user.getJoursCongesConsommes();
        return ResponseEntity.ok(solde);
    }

    @GetMapping("/by-service/{serviceId}")
    public ResponseEntity<List<Utilisateur>> getUsersByService(@PathVariable Long serviceId) {
        List<Utilisateur> utilisateurs =  userRepository.findByServiceId(serviceId);
        return ResponseEntity.ok(utilisateurs);
    }
 
       

        @GetMapping("/{utilisateurId}/absences-conges")
        public ResponseEntity<Map<String, Object>> getAbsencesEtConges(@PathVariable Long utilisateurId) {
            Map<String, Object> result = utilisateurServiceAbCon.getAbsencesEtCongesParUtilisateur(utilisateurId);
            return ResponseEntity.ok(result);
        }
    
}


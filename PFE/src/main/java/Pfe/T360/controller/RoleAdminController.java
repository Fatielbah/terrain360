package Pfe.T360.controller;

import Pfe.T360.dto.RoleUpdateRequest;
import Pfe.T360.entity.Role;
import Pfe.T360.entity.Services;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.repository.ServiceRepository;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/roles")

public class RoleAdminController {

    @Autowired
    private UtilisateurRepository userRepository;
    @Autowired
    private ServiceRepository servicesRepository;
    
    @PostMapping("/assign")
    public ResponseEntity<?> assignRole(@RequestBody RoleUpdateRequest request) {
        return updateUserRole(request.getUserId(), request.getNewRole(), "Rôle assigné avec succès");
    }

    
    @PostMapping("/remove")
    public ResponseEntity<?> removeRole(@RequestBody RoleUpdateRequest request) {
    	
        return updateUserRole(request.getUserId(), Role.DEFAULT, "Rôle retiré avec succès");
    }

    
    @PutMapping
    public ResponseEntity<?> updateRole(@RequestBody RoleUpdateRequest request) {
        return updateUserRole(request.getUserId(), request.getNewRole(), "Rôle mis à jour avec succès");
    }

    private ResponseEntity<?> updateUserRole(Long userId, Role newRole, String successMessage) {
        try {
            Utilisateur user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // Mise à jour du rôle
            user.setRole(newRole);

            // Si le rôle est DEFAULT, on enlève le service
            if (newRole == Role.DEFAULT) {
                user.setService(null);
            } else {
                Services service = getServiceByRole(newRole);
                user.setService(service);
            }

            userRepository.save(user);

            return ResponseEntity.ok(Map.of("success", successMessage));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Erreur lors de la modification du rôle/service : " + e.getMessage()));
        }
    }


    @GetMapping
    public ResponseEntity<List<Utilisateur>> getAllUsersWithRoles() {
        return ResponseEntity.ok(userRepository.findAll());
    }
    private Services getServiceByRole(Role role) {
        String serviceName;

        switch (role) {
            case ADMIN -> serviceName = "Direction Générale";
            case RH -> serviceName = "RH";
            case INFORMATICIEN -> serviceName = "Informatique";
            case SUPERVISEUR -> serviceName = "Opérations";
            case ENQUETEUR -> serviceName = "Études";
            default -> throw new IllegalArgumentException("Aucun service défini pour le rôle : " + role);
        }

        return servicesRepository.findByNom(serviceName)
                .orElseThrow(() -> new RuntimeException("Service introuvable : " + serviceName));
    }

   

}
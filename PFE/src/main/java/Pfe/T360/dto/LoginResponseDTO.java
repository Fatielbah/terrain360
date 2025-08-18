package Pfe.T360.dto;


import java.time.LocalDate;

import Pfe.T360.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponseDTO {
    private Long id;
    private String jwt;
    private String nom;
    private String prenom;
    private LocalDate dateNaissance;
    private String nomDeUtilisateur;
    private String telephone;
    private String adresse;
    private String genre;
    private Role role;
    private String nationalite;
    private String email;
    private String cin ;
    private String situationFamiliale;

}

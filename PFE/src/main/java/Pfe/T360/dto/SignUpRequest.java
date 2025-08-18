package Pfe.T360.dto;

import java.time.LocalDate;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class SignUpRequest {
    private String nom;
    private String prenom;
    private LocalDate dateNaissance;
    private String adresse;
    private String nomDeUtilisateur;
    private String motDePasse;
    private String telephone;
    private String genre;
    private String nationalite;
    private String email;
    private LocalDate dateEmbauche;
    private String cin ;
    private String situationFamiliale;
}

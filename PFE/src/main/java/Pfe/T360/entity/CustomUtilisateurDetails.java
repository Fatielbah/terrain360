package Pfe.T360.entity;


import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;



import lombok.Getter;
import lombok.Setter;


@Setter
@Getter
public class CustomUtilisateurDetails implements UserDetails {
    private Collection<? extends GrantedAuthority> authorities;
    private Long id;
    private String nom;
    private String prenom;
    private LocalDate dateNaissance;
    private String adresse;
    private String nomDeUtilisateur;
    private String motDePasse;
    private String telephone;
    private String imageProfil;
    private String poste;
    private String service;
    private Role role;
    private String cin ;
    private String situationFamiliale;



    @Override
    public Collection<? extends GrantedAuthority> getAuthorities(){
        return this.authorities;
    }
    public static CustomUtilisateurDetails fromUtilisateur(Utilisateur utilisateur) {
        List<GrantedAuthority> authorities =  List.of(new SimpleGrantedAuthority(utilisateur.getRole().name())); 
        return new CustomUtilisateurDetails(
                utilisateur.getId(),
                utilisateur.getNomDeUtilisateur(),
                utilisateur.getMotDePasse(),
                authorities,
                utilisateur.getRole()
        );
    }


    public CustomUtilisateurDetails(Collection<? extends GrantedAuthority> authorities, Long id, String nom,
                                    String prenom, LocalDate dateNaissance, String adresse, String nomDeUtilisateur, String motDePasse,
                                    String telephone, String imageProfil, String poste, String service,
                                    String cin ,String situationFamiliale) {
        super();
        this.authorities = authorities;
        this.id = id;
        this.nom = nom;
        this.prenom = prenom;
        this.dateNaissance = dateNaissance;
        this.adresse = adresse;
        this.nomDeUtilisateur = nomDeUtilisateur;
        this.motDePasse = motDePasse;
        this.telephone = telephone;
        this.imageProfil = imageProfil;
        this.poste = poste;
        this.service = service;
        this.cin=cin ;
        this.situationFamiliale=situationFamiliale;
    }



    public CustomUtilisateurDetails(Long id, String nomDeUtilisateur, String motDePasse,
    		List<GrantedAuthority> authorities, Role role) {
        this.id = id;
        this.nomDeUtilisateur = nomDeUtilisateur;
        this.motDePasse = motDePasse;
        this.authorities = authorities;
        this.role=role;
    }

    // Méthode qui peut être utilisée pour vérifier si le compte est expiré
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // Vérifie si l'utilisateur est bloqué ou non
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    // Vérifie si les crédentials de l'utilisateur sont expirés
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // Vérifie si l'utilisateur est actif
    @Override
    public boolean isEnabled() {
        return true;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }






    public void setAuthorities(Collection<? extends GrantedAuthority> authorities) {
        this.authorities = authorities;
    }

    @Override
    public String getPassword() {
        // TODO Auto-generated method stub
        return this.motDePasse;
    }

    @Override
    public String getUsername() {
        // TODO Auto-generated method stub
        return this.nomDeUtilisateur;
    }

}